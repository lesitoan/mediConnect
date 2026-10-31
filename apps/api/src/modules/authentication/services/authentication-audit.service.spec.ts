import { UnauthorizedException } from '@nestjs/common';
import type { ConfigService } from '@nestjs/config';
import type { JwtService } from '@nestjs/jwt';
import { hash } from 'bcrypt';
import { AuthSessionClientType } from '../../../generated/prisma/enums';
import type { UsersService } from '../../users/services/users.service';
import type { UserSessionsService } from '../../users/services/user-sessions.service';
import { AuthenticationService } from './authentication.service';
import type { OtpService } from './otp.service';

describe('Authentication audit integration', () => {
  const user = { id: 'user-id', passwordHash: '', passwordChangedAt: null };
  const tx = { user: { findUnique: jest.fn() } };
  const users = {
    findForAuthentication: jest.fn(),
    isAllowedToAuthenticate: jest.fn().mockReturnValue(true),
    withLockedAccount: jest.fn(
      (id: string, fn: (client: typeof tx) => unknown) => fn(tx),
    ),
    recordAccountEvent: jest.fn(),
  };
  const sessions = {
    create: jest.fn(),
    revoke: jest.fn(),
    findById: jest.fn(),
  };
  const jwt = {
    signAsync: jest.fn().mockResolvedValue('issued-token'),
    verifyAsync: jest.fn(),
  };
  const service = new AuthenticationService(
    users as unknown as UsersService,
    jwt as unknown as JwtService,
    { getOrThrow: () => 3600 } as unknown as ConfigService,
    {} as OtpService,
    sessions as unknown as UserSessionsService,
  );

  beforeAll(async () => {
    user.passwordHash = await hash('Example123!', 4);
  });
  beforeEach(() => {
    jest.clearAllMocks();
    users.findForAuthentication.mockResolvedValue(user);
    tx.user.findUnique.mockResolvedValue(user);
    sessions.revoke.mockResolvedValue({ count: 1 });
    users.recordAccountEvent.mockResolvedValue(undefined);
  });

  it('audits login in the session transaction and fails if audit cannot be saved', async () => {
    await service.login({
      email: 'user@example.invalid',
      password: 'Example123!',
      clientType: AuthSessionClientType.WEB,
    });
    expect(users.recordAccountEvent).toHaveBeenCalledWith(
      tx,
      user.id,
      'ACCOUNT_LOGIN',
      { sessionId: expect.any(String) as unknown },
    );
    users.recordAccountEvent.mockRejectedValueOnce(
      new Error('audit unavailable'),
    );
    await expect(
      service.login({
        email: 'user@example.invalid',
        password: 'Example123!',
        clientType: AuthSessionClientType.WEB,
      }),
    ).rejects.toThrow('audit unavailable');
  });

  it('audits logout and revocation but does not duplicate an already revoked session', async () => {
    await service.logout(user.id);
    expect(users.recordAccountEvent).toHaveBeenLastCalledWith(
      tx,
      user.id,
      'ACCOUNT_LOGOUT_ALL',
      { revokedSessions: 1 },
    );
    sessions.findById.mockResolvedValue({ userId: user.id });
    await service.revokeSession(user.id, 'session-id');
    expect(users.recordAccountEvent).toHaveBeenLastCalledWith(
      tx,
      user.id,
      'ACCOUNT_REVOKE_SESSION',
      { sessionId: 'session-id' },
    );
    sessions.revoke.mockResolvedValueOnce({ count: 0 });
    users.recordAccountEvent.mockClear();
    await service.logout(user.id, 'session-id');
    expect(users.recordAccountEvent).not.toHaveBeenCalled();
  });

  it('audits automatic revocation on refresh replay before returning unauthorized', async () => {
    const sid = '11111111-1111-4111-8111-111111111111';
    jwt.verifyAsync.mockResolvedValue({
      sub: user.id,
      sid,
      cv: null,
      tokenUse: 'REFRESH',
      jti: 'a'.repeat(64),
      iat: 1,
      exp: 2,
    });
    sessions.findById.mockResolvedValue({
      id: sid,
      userId: user.id,
      refreshTokenHash: 'b'.repeat(64),
      revokedAt: null,
      expiresAt: new Date(Date.now() + 60000),
    });
    await expect(service.refresh('old-token')).rejects.toThrow(
      UnauthorizedException,
    );
    expect(users.recordAccountEvent).toHaveBeenLastCalledWith(
      tx,
      user.id,
      'ACCOUNT_REVOKE_REUSED_SESSION',
      { sessionId: sid },
      true,
    );
  });
});
