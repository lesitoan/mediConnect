import {
  BadRequestException,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import { UserRole, UserStatus } from '../../src/generated/prisma/enums';
import { RoleEnum } from '../../src/modules/users/constants/roles.constant';
import { validateBody } from '../helpers/validation.helpers';
import { UpdateUserDto } from '../../src/modules/users/dto/admin/update-user.dto';
import { CreateUserDto } from '../../src/modules/users/dto/admin/create-user.dto';
import { UpdateUserStatusDto } from '../../src/modules/users/dto/admin/update-user-status.dto';
import {
  ADMIN,
  ADMIN_ROLE_ID,
  NOW,
  OTHER_USER_ID,
  ROLE_ID,
  USER_ID,
  account,
  createUsersHarness,
  uniqueContactError,
} from './users-test.helpers';

describe('UC02 - Quản lý tài khoản người dùng', () => {
  let harness: ReturnType<typeof createUsersHarness>;

  beforeEach(() => {
    jest.useFakeTimers().setSystemTime(NOW);
    harness = createUsersHarness();
  });

  afterEach(() => {
    jest.useRealTimers();
    jest.restoreAllMocks();
  });

  function changeRole() {
    return harness.service.update(USER_ID, { role: UserRole.ADMIN }, ADMIN);
  }

  function setStatus(
    status: 'ACTIVE' | 'LOCKED',
    reason = 'Đã xác minh tài khoản',
  ) {
    return harness.service.status(USER_ID, { status, reason }, ADMIN);
  }

  function expectNoWrites() {
    expect(harness.tx.user.update).not.toHaveBeenCalled();
    expect(harness.tx.user.create).not.toHaveBeenCalled();
    expect(harness.tx.authSession.updateMany).not.toHaveBeenCalled();
    expect(harness.audit.record).not.toHaveBeenCalled();
  }

  describe('Đổi vai trò', () => {
    it('UT02_ROLE_001 - Thay DOCTOR bằng RECEPTIONIST', async () => {
      harness.tx.user.findFirst.mockResolvedValue(account(UserRole.DOCTOR));
      harness.tx.role.findUnique.mockResolvedValue({
        id: ROLE_ID,
        name: UserRole.RECEPTIONIST,
        status: 'ACTIVE',
        deletedAt: null,
      });
      harness.tx.user.update.mockResolvedValue(account(UserRole.RECEPTIONIST));
      const result = await harness.service.update(
        USER_ID,
        { role: UserRole.RECEPTIONIST },
        ADMIN,
      );
      expect(harness.tx.user.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: USER_ID },
          data: { roleId: ROLE_ID },
        }),
      );
      expect(result.role).toMatchObject({
        id: ROLE_ID,
        name: UserRole.RECEPTIONIST,
      });
      expect(result).not.toHaveProperty('roles');
    });

    it('UT02_ROLE_003 - Ghi nhận vai trò trước và sau khi đổi', async () => {
      await changeRole();
      expect(harness.audit.record).toHaveBeenCalledWith(
        expect.objectContaining({
          actor: {
            type: 'USER',
            id: ADMIN.id,
            name: ADMIN.name,
            role: UserRole.ADMIN,
          },
          targetId: USER_ID,
          actionCode: 'USER_ROLE_CHANGE',
          before: { role: UserRole.RECEPTIONIST },
          after: { role: UserRole.ADMIN, revokedSessions: 2 },
        }),
        harness.tx,
      );
      expect(harness.tx.authSession.updateMany).toHaveBeenCalledWith(
        expect.objectContaining({
          data: { revokedAt: NOW, revocationReason: 'ROLE_CHANGED' },
        }),
      );
    });

    it.each([
      ['UT02_ROLE_004', 'Từ chối vai trò không tồn tại', null],
      [
        'UT02_ROLE_005',
        'Từ chối vai trò ngừng hoạt động',
        {
          id: ROLE_ID,
          name: UserRole.ADMIN,
          status: 'INACTIVE',
          deletedAt: null,
        },
      ],
      [
        'UT02_ROLE_006',
        'Từ chối vai trò đã xóa',
        { id: ROLE_ID, name: UserRole.ADMIN, status: 'ACTIVE', deletedAt: NOW },
      ],
    ])('%s - %s', async (_id, _description, role) => {
      harness.tx.role.findUnique.mockResolvedValue(role);
      await expect(changeRole()).rejects.toThrow(BadRequestException);
      expect(harness.tx.role.findUnique).toHaveBeenCalledWith({
        where: { name: UserRole.ADMIN },
      });
      expectNoWrites();
    });

    it('UT02_ROLE_007 - Tài khoản cần đổi vai trò không tồn tại', async () => {
      harness.tx.user.findFirst.mockResolvedValue(null);
      await expect(changeRole()).rejects.toThrow(NotFoundException);
      expectNoWrites();
    });

    it('UT02_ROLE_008 - Thiếu vai trò mới trong lệnh đổi vai trò', async () => {
      await expect(harness.service.update(USER_ID, {}, ADMIN)).rejects.toThrow(
        BadRequestException,
      );
      expectNoWrites();
    });

    it.each([
      ['UT02_ROLE_009', 'Vai trò mới là null', null],
      ['UT02_ROLE_010', 'Vai trò mới là chuỗi rỗng', ''],
      ['UT02_ROLE_011', 'Vai trò chỉ có khoảng trắng', '   '],
      [
        'UT02_ROLE_012',
        'Không nhận danh sách nhiều vai trò',
        [UserRole.DOCTOR, UserRole.RECEPTIONIST],
      ],
      ['UT02_ROLE_013', 'Chặn gỡ vai trò duy nhất', null],
    ])('%s - %s', async (_id, _description, role) => {
      await expect(validateBody(UpdateUserDto, { role })).rejects.toThrow(
        BadRequestException,
      );
      expectNoWrites();
    });

    it('UT02_ROLE_014 - Lưu đổi vai trò gặp lỗi', async () => {
      const error = new Error('Account storage unavailable');
      harness.tx.user.update.mockRejectedValue(error);
      await expect(changeRole()).rejects.toBe(error);
      expect(harness.tx.authSession.updateMany).not.toHaveBeenCalled();
      expect(harness.audit.record).not.toHaveBeenCalled();
    });
  });

  describe('Khóa và mở khóa', () => {
    it('UT02_LOCK_001 - Khóa tài khoản có lý do', async () => {
      harness.tx.user.update.mockResolvedValue({
        ...harness.current,
        status: UserStatus.LOCKED,
      });
      await expect(
        setStatus('LOCKED', 'Vi phạm quy định'),
      ).resolves.toMatchObject({ id: USER_ID, status: UserStatus.LOCKED });
      expect(harness.tx.user.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: USER_ID },
          data: { status: UserStatus.LOCKED },
        }),
      );
      expect(harness.audit.record).toHaveBeenCalledWith(
        expect.objectContaining({ reason: 'Vi phạm quy định' }),
        harness.tx,
      );
    });

    it('UT02_LOCK_002 - Lý do khóa gắn đúng người và thời điểm', async () => {
      await setStatus('LOCKED', 'Vi phạm quy định');
      expect(harness.audit.record).toHaveBeenCalledWith(
        expect.objectContaining({
          targetId: USER_ID,
          actor: {
            type: 'USER',
            id: ADMIN.id,
            name: ADMIN.name,
            role: UserRole.ADMIN,
          },
          actionCode: 'USER_LOCK',
          reason: 'Vi phạm quy định',
        }),
        harness.tx,
      );
      expect(harness.tx.authSession.updateMany).toHaveBeenCalledWith(
        expect.objectContaining({
          data: { revokedAt: NOW, revocationReason: 'ACCOUNT_LOCKED' },
        }),
      );
    });

    it.each([
      ['UT02_LOCK_003', 'Thiếu lý do khóa', undefined, UserStatus.LOCKED],
      ['UT02_LOCK_004', 'Lý do khóa là null', null, UserStatus.LOCKED],
      ['UT02_LOCK_005', 'Lý do khóa rỗng', '', UserStatus.LOCKED],
      [
        'UT02_LOCK_006',
        'Lý do khóa chỉ có khoảng trắng',
        ' \t\n ',
        UserStatus.LOCKED,
      ],
      ['UT02_UNLOCK_002', 'Thiếu lý do mở khóa', undefined, UserStatus.ACTIVE],
      ['UT02_UNLOCK_003', 'Lý do mở khóa là null', null, UserStatus.ACTIVE],
      ['UT02_UNLOCK_004', 'Lý do mở khóa rỗng', '', UserStatus.ACTIVE],
      [
        'UT02_UNLOCK_005',
        'Lý do mở khóa chỉ có khoảng trắng',
        ' \t\n ',
        UserStatus.ACTIVE,
      ],
    ])('%s - %s', async (_id, _description, reason, status) => {
      await expect(
        validateBody(UpdateUserStatusDto, { status, reason }),
      ).rejects.toThrow(BadRequestException);
      expectNoWrites();
    });

    it('UT02_LOCK_007 - Giữ nguyên lý do tiếng Việt', async () => {
      await setStatus('LOCKED', 'Cần xác minh thông tin liên hệ');
      expect(harness.audit.record).toHaveBeenCalledWith(
        expect.objectContaining({ reason: 'Cần xác minh thông tin liên hệ' }),
        harness.tx,
      );
    });

    it.each([
      ['UT02_LOCK_008', 'Khóa tài khoản không tồn tại', UserStatus.LOCKED],
      ['UT02_UNLOCK_006', 'Mở khóa tài khoản không tồn tại', UserStatus.ACTIVE],
    ] as const)('%s - %s', async (_id, _description, status) => {
      harness.tx.user.findFirst.mockResolvedValue(null);
      await expect(setStatus(status)).rejects.toThrow(NotFoundException);
      expectNoWrites();
    });

    it('UT02_LOCK_009 - Khóa không sửa vai trò và liên hệ', async () => {
      await setStatus('LOCKED');
      expect(harness.tx.user.update).toHaveBeenCalledWith(
        expect.objectContaining({ data: { status: UserStatus.LOCKED } }),
      );
    });

    it.each([
      [
        'UT02_LOCK_010',
        'Lưu trạng thái khóa gặp lỗi',
        UserStatus.LOCKED,
        UserStatus.ACTIVE,
      ],
      [
        'UT02_UNLOCK_008',
        'Lưu mở khóa gặp lỗi',
        UserStatus.ACTIVE,
        UserStatus.LOCKED,
      ],
    ] as const)('%s - %s', async (_id, _description, next, previous) => {
      harness.tx.user.findFirst.mockResolvedValue({
        ...harness.current,
        status: previous,
      });
      const error = new Error('Status storage unavailable');
      harness.tx.user.update.mockRejectedValue(error);
      await expect(setStatus(next)).rejects.toBe(error);
      expect(harness.audit.record).not.toHaveBeenCalled();
      expect(harness.tx.authSession.updateMany).not.toHaveBeenCalled();
    });

    it('UT02_UNLOCK_001 - Mở khóa có lý do hợp lệ', async () => {
      harness.tx.user.findFirst.mockResolvedValue({
        ...harness.current,
        status: UserStatus.LOCKED,
      });
      await expect(setStatus('ACTIVE')).resolves.toMatchObject({
        status: UserStatus.ACTIVE,
      });
      expect(harness.tx.user.update).toHaveBeenCalledWith(
        expect.objectContaining({ data: { status: UserStatus.ACTIVE } }),
      );
      expect(harness.audit.record).toHaveBeenCalledWith(
        expect.objectContaining({
          targetId: USER_ID,
          actionCode: 'USER_UNLOCK',
          reason: 'Đã xác minh tài khoản',
        }),
        harness.tx,
      );
    });

    it('UT02_UNLOCK_007 - Mở khóa không khôi phục phiên cũ', async () => {
      harness.tx.user.findFirst.mockResolvedValue({
        ...harness.current,
        status: UserStatus.LOCKED,
      });
      await setStatus('ACTIVE');
      expect(harness.tx.authSession.updateMany).not.toHaveBeenCalled();
      expect(harness.tx.authSession.create).not.toHaveBeenCalled();
    });
  });

  describe('Thu hồi mọi phiên khi quản trị tài khoản', () => {
    it.each([
      [
        'UT02_SESSION_001',
        'Khóa yêu cầu thu hồi mọi phiên',
        'LOCK',
        'ACCOUNT_LOCKED',
      ],
      [
        'UT02_SESSION_002',
        'Đổi vai trò yêu cầu thu hồi mọi phiên',
        'ROLE',
        'ROLE_CHANGED',
      ],
    ])('%s - %s', async (_id, _description, action, reason) => {
      if (action === 'LOCK') await setStatus('LOCKED');
      else await changeRole();
      expect(harness.tx.authSession.updateMany).toHaveBeenCalledWith({
        where: { userId: USER_ID, revokedAt: null },
        data: { revokedAt: NOW, revocationReason: reason },
      });
    });

    it('UT02_SESSION_003 - Khóa tài khoản không có phiên', async () => {
      harness.tx.authSession.updateMany.mockResolvedValue({ count: 0 });
      harness.tx.user.update.mockResolvedValue({
        ...harness.current,
        status: UserStatus.LOCKED,
      });
      await expect(setStatus('LOCKED')).resolves.toMatchObject({
        status: UserStatus.LOCKED,
      });
      expect(harness.audit.record).toHaveBeenCalledWith(
        expect.objectContaining({
          after: { status: UserStatus.LOCKED, revokedSessions: 0 },
        }),
        harness.tx,
      );
    });

    it('UT02_SESSION_004 - Đổi vai trò khi không có phiên', async () => {
      harness.tx.authSession.updateMany.mockResolvedValue({ count: 0 });
      harness.tx.user.update.mockResolvedValue(account(UserRole.ADMIN));
      await expect(changeRole()).resolves.toMatchObject({
        role: { name: UserRole.ADMIN },
      });
      expect(harness.tx.user.update).toHaveBeenCalledWith(
        expect.objectContaining({ data: { roleId: ADMIN_ROLE_ID } }),
      );
    });

    it('UT02_SESSION_005 - Không thu hồi khi vai trò mới không hợp lệ', async () => {
      harness.tx.role.findUnique.mockResolvedValue(null);
      await expect(changeRole()).rejects.toThrow(BadRequestException);
      expectNoWrites();
    });

    it('UT02_SESSION_006 - Không thu hồi khi lý do khóa không hợp lệ', async () => {
      await expect(
        validateBody(UpdateUserStatusDto, {
          status: UserStatus.LOCKED,
          reason: ' \t\n ',
        }),
      ).rejects.toThrow(BadRequestException);
      expectNoWrites();
    });

    it.each([
      ['UT02_SESSION_007', 'Thu hồi phiên lỗi khi khóa', 'LOCK'],
      ['UT02_SESSION_008', 'Thu hồi phiên lỗi khi đổi vai trò', 'ROLE'],
    ])('%s - %s', async (_id, _description, action) => {
      const error = new Error('Session revocation unavailable');
      harness.tx.authSession.updateMany.mockRejectedValue(error);
      await expect(
        action === 'LOCK' ? setStatus('LOCKED') : changeRole(),
      ).rejects.toBe(error);
      expect(harness.audit.record).not.toHaveBeenCalled();
    });
  });

  describe('Kiểm tra liên hệ', () => {
    it('UT02_CONTACT_001 - Tạo tài khoản với email đã có', async () => {
      harness.tx.user.findUnique.mockResolvedValue({
        ...account(),
        id: OTHER_USER_ID,
      });
      await expect(
        validateBody(CreateUserDto, {
          fullName: 'Nguyễn Văn An',
          role: RoleEnum.RECEPTIONIST,
          email: 'an@example.invalid',
          phone: '+84912345678',
        }).then((input) => harness.service.create(input, ADMIN)),
      ).rejects.toThrow(ConflictException);
      expectNoWrites();
    });

    it('UT02_CONTACT_003 - Tạo tài khoản với hai liên hệ chưa có', async () => {
      const input = await validateBody(CreateUserDto, {
        fullName: 'Nguyễn Văn An',
        role: RoleEnum.RECEPTIONIST,
        email: 'new@example.invalid',
        phone: '+84912345678',
      });
      harness.tx.role.findUnique.mockResolvedValue(harness.current.role);
      harness.tx.user.findUniqueOrThrow.mockResolvedValue({
        ...harness.current,
        email: 'new@example.invalid',
        phone: '+84912345678',
      });
      await expect(harness.service.create(input, ADMIN)).resolves.toMatchObject(
        { id: USER_ID, email: 'new@example.invalid', phone: '+84912345678' },
      );
      expect(harness.tx.user.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            email: 'new@example.invalid',
            phone: '+84912345678',
          }) as unknown,
        }),
      );
    });

    it('UT02_CONTACT_004 - Cập nhật email thành email của người khác', async () => {
      harness.tx.user.findUnique.mockResolvedValue({
        ...account(),
        id: OTHER_USER_ID,
        email: 'other@example.invalid',
      });
      await expect(
        validateBody(UpdateUserDto, { email: 'other@example.invalid' }).then(
          (input) => harness.service.update(USER_ID, input, ADMIN),
        ),
      ).rejects.toThrow(ConflictException);
      expectNoWrites();
    });

    it('UT02_CONTACT_006 - Giữ nguyên email của chính tài khoản', async () => {
      harness.tx.user.findUnique.mockResolvedValue(harness.current);
      const input = await validateBody(UpdateUserDto, {
        email: harness.current.email,
        fullName: 'Tên mới',
      });
      await expect(
        harness.service.update(USER_ID, input, ADMIN),
      ).resolves.toMatchObject({ id: USER_ID, email: harness.current.email });
      expect(harness.tx.user.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: USER_ID },
          data: { fullName: 'Tên mới' },
        }),
      );
    });

    it('UT02_CONTACT_008 - Giữ email của mình nhưng dùng số điện thoại trùng', async () => {
      harness.tx.user.findUnique.mockImplementation(
        ({ where }: { where: { email?: string; phone?: string } }) =>
          Promise.resolve(
            where.email
              ? harness.current
              : { ...account(), id: OTHER_USER_ID, phone: '+84912345678' },
          ),
      );
      await expect(
        validateBody(UpdateUserDto, {
          email: harness.current.email,
          phone: '+84912345678',
        }).then((input) => harness.service.update(USER_ID, input, ADMIN)),
      ).rejects.toThrow(ConflictException);
      expectNoWrites();
    });

    it('UT02_CONTACT_009 - Giữ số điện thoại nhưng dùng email trùng', async () => {
      harness.tx.user.findUnique.mockImplementation(
        ({ where }: { where: { email?: string; phone?: string } }) =>
          Promise.resolve(
            where.phone
              ? harness.current
              : {
                  ...account(),
                  id: OTHER_USER_ID,
                  email: 'other@example.invalid',
                },
          ),
      );
      await expect(
        validateBody(UpdateUserDto, {
          email: 'other@example.invalid',
          phone: harness.current.phone,
        }).then((input) => harness.service.update(USER_ID, input, ADMIN)),
      ).rejects.toThrow(ConflictException);
      expectNoWrites();
    });

    it('UT02_CONTACT_010 - Cập nhật sang hai liên hệ chưa có', async () => {
      const input = await validateBody(UpdateUserDto, {
        email: 'new@example.invalid',
        phone: '+84912345678',
      });
      harness.tx.user.update.mockResolvedValue({
        ...harness.current,
        email: 'new@example.invalid',
        phone: '+84912345678',
      });
      await expect(
        harness.service.update(USER_ID, input, ADMIN),
      ).resolves.toMatchObject({
        id: USER_ID,
        email: 'new@example.invalid',
        phone: '+84912345678',
      });
      expect(harness.tx.user.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: USER_ID },
          data: expect.objectContaining({
            email: 'new@example.invalid',
            phone: '+84912345678',
          }) as unknown,
        }),
      );
      expect(harness.tx.user.create).not.toHaveBeenCalled();
    });

    it('UT02_CONTACT_013 - Email thuộc tài khoản đang khóa vẫn bị trùng', async () => {
      harness.tx.user.findUnique.mockResolvedValue({
        ...account(),
        id: OTHER_USER_ID,
        status: UserStatus.LOCKED,
        email: 'other@example.invalid',
      });
      await expect(
        validateBody(UpdateUserDto, { email: 'other@example.invalid' }).then(
          (input) => harness.service.update(USER_ID, input, ADMIN),
        ),
      ).rejects.toThrow(ConflictException);
      expectNoWrites();
    });

    it('UT02_CONTACT_002 - Tạo tài khoản với số điện thoại đã có', async () => {
      harness.tx.user.findUnique.mockResolvedValue({
        ...account(),
        id: OTHER_USER_ID,
      });
      harness.tx.user.create.mockRejectedValue(uniqueContactError('phone'));
      await expect(
        harness.service.create(
          {
            fullName: 'Nguyễn Văn An',
            role: RoleEnum.RECEPTIONIST,
            phone: '+84901234567',
          },
          ADMIN,
        ),
      ).rejects.toThrow(ConflictException);
      expect(harness.tx.user.create).not.toHaveBeenCalled();
    });

    it('UT02_CONTACT_005 - Cập nhật số điện thoại của người khác', async () => {
      harness.tx.user.findUnique.mockResolvedValue({
        ...account(),
        id: OTHER_USER_ID,
        phone: '+84912345678',
      });
      harness.tx.user.update.mockRejectedValue(uniqueContactError('phone'));
      await expect(
        harness.service.update(USER_ID, { phone: '+84912345678' }, ADMIN),
      ).rejects.toThrow(ConflictException);
      expect(harness.tx.user.update).not.toHaveBeenCalled();
    });

    it('UT02_CONTACT_007 - Giữ nguyên số điện thoại của chính tài khoản', async () => {
      await expect(
        harness.service.update(
          USER_ID,
          { phone: harness.current.phone, fullName: 'Tên mới' },
          ADMIN,
        ),
      ).resolves.toMatchObject({ id: USER_ID });
      expect(harness.tx.user.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: USER_ID },
          data: { fullName: 'Tên mới' },
        }),
      );
      expect(harness.tx.authSession.updateMany).not.toHaveBeenCalled();
    });

    it('UT02_CONTACT_011 - Phản ánh lỗi duy nhất email khi ghi', async () => {
      harness.tx.user.create.mockRejectedValue(uniqueContactError('email'));
      await expect(
        harness.service.create(
          {
            fullName: 'Nguyễn Văn An',
            role: RoleEnum.RECEPTIONIST,
            phone: '+84912345678',
          },
          ADMIN,
        ),
      ).rejects.toThrow(ConflictException);
      expect(harness.audit.record).not.toHaveBeenCalled();
    });

    it('UT02_CONTACT_012 - Phản ánh lỗi duy nhất số điện thoại khi ghi', async () => {
      harness.tx.user.update.mockRejectedValue(uniqueContactError('phone'));
      await expect(
        harness.service.update(USER_ID, { phone: '+84912345678' }, ADMIN),
      ).rejects.toThrow(ConflictException);
      expect(harness.audit.record).not.toHaveBeenCalled();
      expect(harness.tx.authSession.updateMany).not.toHaveBeenCalled();
    });

    it('UT02_CONTACT_014 - Số điện thoại của tài khoản chờ xác minh', async () => {
      harness.tx.user.findUnique.mockResolvedValue({
        ...account(),
        id: OTHER_USER_ID,
        status: UserStatus.PENDING_VERIFICATION,
        phone: '+84912345678',
      });
      harness.tx.user.update.mockRejectedValue(uniqueContactError('phone'));
      await expect(
        harness.service.update(USER_ID, { phone: '+84912345678' }, ADMIN),
      ).rejects.toThrow(ConflictException);
      expect(harness.tx.user.update).not.toHaveBeenCalled();
    });

    it('UT02_CONTACT_015 - Liên hệ của tài khoản đã xóa mềm', async () => {
      harness.tx.user.findUnique.mockResolvedValue({
        ...account(),
        id: OTHER_USER_ID,
        deletedAt: NOW,
        phone: '+84912345678',
      });
      harness.tx.user.update.mockRejectedValue(uniqueContactError('phone'));
      await expect(
        harness.service.update(USER_ID, { phone: '+84912345678' }, ADMIN),
      ).rejects.toThrow(ConflictException);
      expect(harness.audit.record).not.toHaveBeenCalled();
    });

    it.todo(
      'UT02_CONTACT_016 - Chờ chốt hợp đồng chuẩn hóa email UC02; không thay bằng ContactDto xác thực',
    );
    it.todo(
      'UT02_CONTACT_017 - Chờ chốt hợp đồng chuẩn hóa số điện thoại UC02',
    );
  });
});
