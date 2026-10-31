import { UnauthorizedException } from '@nestjs/common';
import { UserRole, UserStatus } from '../../src/generated/prisma/enums';
import {
  NOW,
  ADMIN_ROLE_ID,
  USER_ID,
  authenticationAccount,
  createUsersHarness,
  permission,
} from './users-test.helpers';

describe('UC02 - Quyền truy cập tài khoản', () => {
  let harness: ReturnType<typeof createUsersHarness>;

  beforeEach(() => {
    jest.useFakeTimers().setSystemTime(NOW);
    harness = createUsersHarness();
  });

  afterEach(() => {
    jest.useRealTimers();
    jest.restoreAllMocks();
  });

  it('UT02_ROLE_002 - Quyền chỉ lấy từ vai trò hiện tại', () => {
    const user = authenticationAccount();
    user.role!.name = UserRole.RECEPTIONIST;
    user.role!.infoPermission = [permission('PERMISSION_B')] as NonNullable<
      typeof user.role
    >['infoPermission'];
    const result = harness.users.toCurrentUser(user);
    expect(result.permissions).toEqual(['PERMISSION_B']);
    expect(result.permissions).not.toContain('PERMISSION_A');
    expect(result.role).toBe(UserRole.RECEPTIONIST);
  });

  it.each([
    ['UT02_ACCESS_001', 'Tài khoản và vai trò đều hoạt động', {}, true],
    [
      'UT02_ACCESS_002',
      'Tài khoản LOCKED không được xác thực',
      { status: UserStatus.LOCKED },
      false,
    ],
    [
      'UT02_ACCESS_003',
      'Tài khoản chờ xác minh không được xác thực',
      { status: UserStatus.PENDING_VERIFICATION },
      false,
    ],
    [
      'UT02_ACCESS_004',
      'Tài khoản đã xóa mềm không được xác thực',
      { deletedAt: NOW },
      false,
    ],
    [
      'UT02_ACCESS_005',
      'Vai trò ngừng hoạt động không được xác thực',
      { role: { status: 'INACTIVE', deletedAt: null } },
      false,
    ],
    [
      'UT02_ACCESS_006',
      'Vai trò đã xóa mềm không được xác thực',
      { role: { status: 'ACTIVE', deletedAt: NOW } },
      false,
    ],
    [
      'UT02_ACCESS_007',
      'Thiếu quan hệ vai trò không được xác thực',
      { role: null },
      false,
    ],
  ] as const)('%s - %s', (_id, _description, changes, expected) => {
    const user = { ...authenticationAccount(), ...changes };
    expect(harness.users.isAllowedToAuthenticate(user)).toBe(expected);
  });

  it('UT02_ACCESS_008 - Tải lại người dùng đã bị khóa', async () => {
    harness.tx.user.findUnique.mockResolvedValue({
      ...authenticationAccount(),
      status: UserStatus.LOCKED,
    });
    await expect(
      harness.users.getAuthenticatedUser(USER_ID, NOW.getTime() / 1000),
    ).rejects.toThrow(new UnauthorizedException('Account is unavailable'));
    expect(harness.tx.user.findUnique).toHaveBeenCalledWith(
      expect.objectContaining({ where: { id: USER_ID } }),
    );
  });

  it('UT02_ACCESS_009 - Lấy vai trò hiện tại từ kho thay cho dữ liệu cũ', async () => {
    const user = authenticationAccount();
    user.roleId = ADMIN_ROLE_ID;
    user.role!.id = ADMIN_ROLE_ID;
    user.role!.name = UserRole.ADMIN;
    user.role!.infoPermission = [permission('USERS_WRITE')] as NonNullable<
      typeof user.role
    >['infoPermission'];
    harness.tx.user.findUnique.mockResolvedValue(user);
    await expect(
      harness.users.getAuthenticatedUser(USER_ID, NOW.getTime() / 1000),
    ).resolves.toMatchObject({
      id: USER_ID,
      roleId: ADMIN_ROLE_ID,
      role: UserRole.ADMIN,
      permissions: ['USERS_WRITE'],
    });
  });

  it.each([
    ['UT02_ACCESS_010', 'Bỏ liên kết cấp quyền đã xóa mềm', { deletedAt: NOW }],
    [
      'UT02_ACCESS_011',
      'Bỏ quyền ngừng hoạt động',
      { permission: { name: 'REMOVED', status: 'INACTIVE', deletedAt: null } },
    ],
    [
      'UT02_ACCESS_012',
      'Bỏ quyền đã xóa mềm',
      { permission: { name: 'REMOVED', status: 'ACTIVE', deletedAt: NOW } },
    ],
  ])('%s - %s', (_id, _description, changes) => {
    const user = authenticationAccount();
    user.role!.infoPermission = [
      { ...permission('REMOVED'), ...changes },
      permission('USERS_READ_ME'),
    ] as NonNullable<typeof user.role>['infoPermission'];
    expect(harness.users.toCurrentUser(user).permissions).toEqual([
      'USERS_READ_ME',
    ]);
  });
});
