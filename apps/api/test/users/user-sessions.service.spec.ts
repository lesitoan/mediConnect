import { UnauthorizedException } from '@nestjs/common';
import { UserSessionsService } from '../../src/modules/users/services/user-sessions.service';
import {
  NOW,
  OTHER_USER_ID,
  USER_ID,
  createUsersHarness,
  transactionClient,
} from './users-test.helpers';

const SESSION_ID = '55555555-5555-4555-8555-555555555555';

describe('UC02 - Phiên đăng nhập', () => {
  let harness: ReturnType<typeof createUsersHarness>;
  let service: UserSessionsService;

  beforeEach(() => {
    jest.useFakeTimers().setSystemTime(NOW);
    harness = createUsersHarness();
    service = new UserSessionsService(harness.db);
  });

  afterEach(() => {
    jest.useRealTimers();
    jest.restoreAllMocks();
  });

  it.each([
    ['UT02_SESSION_009', 'Phiên đã bị thu hồi bị từ chối', { revokedAt: NOW }],
    [
      'UT02_SESSION_010',
      'Phiên hết hạn đúng thời điểm hiện tại',
      { expiresAt: NOW },
    ],
    [
      'UT02_SESSION_012',
      'Phiên thuộc tài khoản khác',
      { userId: OTHER_USER_ID },
    ],
    [
      'UT02_SESSION_014',
      'Phiên đã hết hạn trước hiện tại',
      { expiresAt: new Date(NOW.getTime() - 1) },
    ],
  ])('%s - %s', async (_id, _description, changes) => {
    harness.tx.authSession.findUnique.mockResolvedValue({
      id: SESSION_ID,
      userId: USER_ID,
      revokedAt: null,
      expiresAt: new Date(NOW.getTime() + 1),
      ...changes,
    });
    await expect(service.assertActive(SESSION_ID, USER_ID)).rejects.toThrow(
      new UnauthorizedException('Invalid or expired session'),
    );
    expect(harness.tx.authSession.findUnique).toHaveBeenCalledWith({
      where: { id: SESSION_ID },
    });
  });

  it('UT02_SESSION_011 - Phiên hợp lệ trước thời điểm hết hạn', async () => {
    harness.tx.authSession.findUnique.mockResolvedValue({
      userId: USER_ID,
      revokedAt: null,
      expiresAt: new Date(NOW.getTime() + 1),
    });
    await expect(
      service.assertActive(SESSION_ID, USER_ID),
    ).resolves.toBeUndefined();
  });

  it('UT02_SESSION_013 - Phiên không tồn tại', async () => {
    harness.tx.authSession.findUnique.mockResolvedValue(null);
    await expect(service.assertActive(SESSION_ID, USER_ID)).rejects.toThrow(
      UnauthorizedException,
    );
  });

  it('UT02_REVOKE_001 - Không truyền sessionId nghĩa là toàn bộ phiên', async () => {
    await service.revoke(transactionClient(harness), USER_ID, 'ACCOUNT_LOCKED');
    expect(harness.tx.authSession.updateMany).toHaveBeenCalledWith({
      where: { userId: USER_ID, revokedAt: null },
      data: { revokedAt: NOW, revocationReason: 'ACCOUNT_LOCKED' },
    });
  });

  it('UT02_REVOKE_002 - Không thu hồi tài khoản khác hoặc phiên cũ', async () => {
    await service.revoke(transactionClient(harness), USER_ID, 'ROLE_CHANGED');
    expect(harness.tx.authSession.updateMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: { userId: USER_ID, revokedAt: null } }),
    );
  });

  it('UT02_REVOKE_003 - Ghi đúng thời điểm và lý do thu hồi', async () => {
    await service.revoke(transactionClient(harness), USER_ID, 'ROLE_CHANGED');
    expect(harness.tx.authSession.updateMany).toHaveBeenCalledWith(
      expect.objectContaining({
        data: { revokedAt: NOW, revocationReason: 'ROLE_CHANGED' },
      }),
    );
  });

  it('UT02_REVOKE_004 - Không có phiên cần thu hồi', async () => {
    harness.tx.authSession.updateMany.mockResolvedValue({ count: 0 });
    await expect(
      service.revoke(transactionClient(harness), USER_ID, 'ACCOUNT_LOCKED'),
    ).resolves.toEqual({ count: 0 });
  });

  it('UT02_REVOKE_005 - Lỗi lưu thu hồi được phản ánh', async () => {
    const error = new Error('Session storage unavailable');
    harness.tx.authSession.updateMany.mockRejectedValue(error);
    await expect(
      service.revoke(transactionClient(harness), USER_ID, 'ACCOUNT_LOCKED'),
    ).rejects.toBe(error);
  });
});
