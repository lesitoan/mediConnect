/* eslint-disable @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-argument */
import {
  ServiceUnavailableException,
  Controller,
  Get,
  type INestApplication,
} from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { JwtService } from '@nestjs/jwt';
import { hash } from 'bcrypt';
import type { Server } from 'node:http';
import { createHash, randomUUID } from 'node:crypto';
import request from 'supertest';
import {
  OtpDeliveryService,
  type OtpDelivery,
} from '../src/modules/notifications/otp-delivery.service';
import { AppModule } from '../src/app.module';
import { configureApp } from '../src/configure-app';
import { PrismaService } from '../src/database/prisma.service';
import { Prisma, type AuthSession } from '../src/generated/prisma/client';
import { RedisService } from '../src/common/redis/redis.service';
import { OtpStoreService } from '../src/modules/authentication/otp-store.service';
import { InMemoryOtpStore } from './support/in-memory-otp-store';
import {
  PermissionStatusEnum,
  RoleStatusEnum,
  UserStatus,
  AuthSessionClientType,
} from '../src/generated/prisma/enums';
import { RoleEnum } from '../src/modules/users/constants/roles.constant';
import { AuthRole } from '../src/modules/authentication/decorators/auth-role.decorator';
import { AuthPermission } from '../src/modules/authentication/decorators/auth-permission.decorator';
import { PermissionEnum } from '../src/modules/authentication/constants/permissions.constant';

@Controller('rbac-probe')
class RbacProbeController {
  @Get('admin')
  @AuthRole(RoleEnum.ADMIN)
  admin() {
    return { success: true };
  }

  @Get('permission')
  @AuthPermission('TEST_WRITE', PermissionEnum.USERS_READ_ME)
  permission() {
    return { success: true };
  }

  @Get('custom-role')
  @AuthRole('NURSE')
  customRole() {
    return { success: true };
  }

  @Get('protected')
  protectedRoute() {
    return { success: true };
  }
}

interface StoredUser {
  id: string;
  email?: string | null;
  phone?: string | null;
  emailVerifiedAt?: Date | null;
  phoneVerifiedAt?: Date | null;
  name: string;
  passwordHash: string | null;
  roleId: string;
  status: UserStatus;
  deletedAt: Date | null;
  passwordChangedAt: Date | null;
}

interface StoredRole {
  id: string;
  name: string;
  status: RoleStatusEnum;
  deletedAt: Date | null;
}

interface ApiBody {
  success: boolean;
  data: {
    challengeId: string;
    resetToken: string;
    accessToken: string;
    refreshToken?: string;
    sessionId: string;
    refreshExpiresIn: number;
    expiresIn: number;
    id: string;
    roleId: string;
    role: string;
    permissions: string[];
  };
  message?: string | string[];
}

describe('Authentication and RBAC (HTTP, real JWT/bcrypt, in-memory Prisma boundary)', () => {
  let app: INestApplication;
  let server: Server;
  let jwt: JwtService;
  const users = new Map<string, StoredUser>();
  const sessions = new Map<string, AuthSession>();
  let accountQueue: Promise<unknown> = Promise.resolve();
  const roles = new Map<string, StoredRole>();
  const rolePermissions = new Map<string, string[]>();
  const disabledPermissions = new Set<string>();
  const deletedPermissions = new Set<string>();
  const deletedGrants = new Set<string>();
  let passwordHash: string;

  function roleId(name: string): string {
    return 'role-id-' + name;
  }

  function hydrate(user: StoredUser | undefined) {
    if (!user) return null;
    const role = roles.get(user.roleId)!;
    return {
      ...user,
      fullName: user.name,
      phone: user.phone ?? null,
      avatar: null,
      createdAt: new Date('2026-01-01'),
      role: {
        ...role,
        infoPermission: (rolePermissions.get(role.name) ?? []).map((name) => ({
          deletedAt: deletedGrants.has(role.id + ':' + name)
            ? new Date()
            : null,
          permission: {
            name,
            status: disabledPermissions.has(name)
              ? PermissionStatusEnum.INACTIVE
              : PermissionStatusEnum.ACTIVE,
            deletedAt: deletedPermissions.has(name) ? new Date() : null,
          },
        })),
      },
    };
  }

  const otpStore = new InMemoryOtpStore();
  const otps = otpStore.records;
  const deliveries: OtpDelivery[] = [];
  const delivery = {
    assertConfigured: jest.fn(),
    send: jest.fn((input: OtpDelivery) => {
      deliveries.push(input);
      return Promise.resolve();
    }),
  };
  const prisma = {
    role: {
      findUnique: jest.fn(({ where }: { where: { name: string } }) =>
        Promise.resolve(
          [...roles.values()].find((role) => role.name === where.name) ?? null,
        ),
      ),
    },
    user: {
      update: jest.fn(({ where, data }) => {
        Object.assign(users.get(where.id)!, data);
        return Promise.resolve(hydrate(users.get(where.id)));
      }),
      findUnique: jest.fn(
        ({
          where,
        }: {
          where: { id?: string; email?: string; phone?: string };
        }) =>
          Promise.resolve(
            hydrate(
              where.id
                ? users.get(where.id)
                : [...users.values()].find((user) =>
                    where.email
                      ? user.email === where.email
                      : user.phone === where.phone,
                  ),
            ),
          ),
      ),
      create: jest.fn(
        ({
          data,
        }: {
          data: {
            fullName: string;
            email?: string;
            phone?: string;
            passwordHash: string;
            roleId: string;
            status: UserStatus;
          };
        }) => {
          if (
            [...users.values()].some((user) =>
              data.email
                ? user.email === data.email
                : user.phone === data.phone,
            )
          ) {
            return Promise.reject(
              new Prisma.PrismaClientKnownRequestError('Unique constraint', {
                code: 'P2002',
                clientVersion: '7',
              }),
            );
          }
          const user: StoredUser = {
            ...data,
            name: data.fullName,
            id: 'user-' + (users.size + 1),
            deletedAt: null,
            passwordChangedAt: null,
          };
          users.set(user.id, user);
          return Promise.resolve(hydrate(user));
        },
      ),
    },
    authSession: {
      create: jest.fn(
        ({
          data,
        }: {
          data: Pick<
            AuthSession,
            'id' | 'userId' | 'refreshTokenHash' | 'clientType' | 'expiresAt'
          > &
            Partial<AuthSession>;
        }) => {
          const session: AuthSession = {
            createdAt: new Date(),
            lastActiveAt: new Date(),
            revokedAt: null,
            revocationReason: null,
            ...data,
            deviceName: data.deviceName ?? null,
            userAgent: data.userAgent ?? null,
            ipAddress: data.ipAddress ?? null,
          };
          sessions.set(session.id, session);
          return Promise.resolve({ ...session });
        },
      ),
      findUnique: jest.fn(({ where }: { where: { id: string } }) =>
        Promise.resolve(
          sessions.has(where.id) ? { ...sessions.get(where.id)! } : null,
        ),
      ),
      findMany: jest.fn(
        ({ where }: { where: { userId: string; expiresAt: { gt: Date } } }) =>
          Promise.resolve(
            [...sessions.values()]
              .filter(
                (session) =>
                  session.userId === where.userId &&
                  !session.revokedAt &&
                  session.expiresAt > where.expiresAt.gt,
              )
              .map(
                ({
                  id,
                  clientType,
                  deviceName,
                  userAgent,
                  ipAddress,
                  createdAt,
                  lastActiveAt,
                  expiresAt,
                }) => ({
                  id,
                  clientType,
                  deviceName,
                  userAgent,
                  ipAddress,
                  createdAt,
                  lastActiveAt,
                  expiresAt,
                }),
              ),
          ),
      ),
      updateMany: jest.fn(
        ({
          where,
          data,
        }: {
          where: {
            id?: string;
            userId?: string;
            refreshTokenHash?: string;
            revokedAt?: null;
            expiresAt?: { gt: Date };
          };
          data: Partial<AuthSession>;
        }) => {
          let count = 0;
          for (const session of sessions.values()) {
            if (
              (where.id && session.id !== where.id) ||
              (where.userId && session.userId !== where.userId) ||
              (where.refreshTokenHash &&
                session.refreshTokenHash !== where.refreshTokenHash) ||
              (where.revokedAt === null && session.revokedAt !== null) ||
              (where.expiresAt && session.expiresAt <= where.expiresAt.gt)
            )
              continue;
            Object.assign(session, data);
            count++;
          }
          return Promise.resolve({ count });
        },
      ),
    },
    $transaction: jest.fn(
      (action: (tx: unknown) => Promise<unknown>): Promise<unknown> => {
        const result = accountQueue.then(() => action(prisma));
        accountQueue = result.catch(() => undefined);
        return result;
      },
    ),
    $queryRaw: jest.fn(() => Promise.resolve([{ value: 1 }])),
  };

  beforeAll(async () => {
    passwordHash = await hash('ValidPassword1!', 4);
    const module = await Test.createTestingModule({
      imports: [AppModule],
      controllers: [RbacProbeController],
    })
      .overrideProvider(RedisService)
      .useValue({})
      .overrideProvider(OtpStoreService)
      .useValue(otpStore)
      .overrideProvider(OtpDeliveryService)
      .useValue(delivery)
      .overrideProvider(PrismaService)
      .useValue(prisma)
      .compile();
    app = module.createNestApplication();
    configureApp(app);
    await app.init();
    server = app.getHttpServer() as Server;
    jwt = app.get(JwtService);
  });

  beforeEach(() => {
    jest.clearAllMocks();
    users.clear();
    sessions.clear();
    otpStore.clear();
    deliveries.length = 0;
    rolePermissions.clear();
    roles.clear();
    disabledPermissions.clear();
    deletedPermissions.clear();
    deletedGrants.clear();
    for (const name of Object.values(RoleEnum)) {
      roles.set(roleId(name), {
        id: roleId(name),
        name,
        status: RoleStatusEnum.ACTIVE,
        deletedAt: null,
      });
      rolePermissions.set(name, [PermissionEnum.USERS_READ_ME]);
    }
    users.set('patient-id', {
      id: 'patient-id',
      name: 'Patient',
      email: 'patient@example.com',
      passwordHash,
      roleId: roleId(RoleEnum.PATIENT),
      status: UserStatus.ACTIVE,
      deletedAt: null,
      passwordChangedAt: null,
    });
  });

  afterAll(async () => {
    await app.close();
  });

  async function login() {
    const response = await request(server)
      .post('/api/v1/authentication/login')
      .send({ email: 'patient@example.com', password: 'ValidPassword1!' })
      .expect(200);
    return response;
  }

  function accessToken(userId = 'patient-id') {
    const id = randomUUID();
    sessions.set(id, {
      id,
      userId,
      refreshTokenHash: 'test-session-hash',
      clientType: AuthSessionClientType.WEB,
      deviceName: null,
      userAgent: null,
      ipAddress: null,
      createdAt: new Date(),
      lastActiveAt: new Date(),
      expiresAt: new Date(Date.now() + 2592000000),
      revokedAt: null,
      revocationReason: null,
    });
    return jwt.sign({
      sub: userId,
      sid: id,
      tokenUse: 'ACCESS',
      cv: users.get(userId)?.passwordChangedAt?.toISOString() ?? null,
    });
  }

  async function mobileLogin(email = 'patient@example.com') {
    const response = await request(server)
      .post('/api/v1/authentication/login')
      .set('User-Agent', 'MediConnect test device')
      .send({
        email,
        password: 'ValidPassword1!',
        clientType: 'MOBILE',
        deviceName: ' Test phone ',
      })
      .expect(200);
    return { response, data: (response.body as ApiBody).data };
  }
  function refresh(token: string) {
    return request(server)
      .post('/api/v1/authentication/refresh')
      .send({ refreshToken: token });
  }

  it('rejects invalid login session metadata before creating sessions', async () => {
    for (const metadata of [
      { clientType: null },
      { clientType: 'ADMIN' },
      { deviceName: 'x'.repeat(256) },
    ]) {
      await request(server)
        .post('/api/v1/authentication/login')
        .send({
          email: 'patient@example.com',
          password: 'ValidPassword1!',
          ...metadata,
        })
        .expect(400);
    }
    expect(sessions.size).toBe(0);
  });

  it('persists WEB sessions with only a refresh hash and correctly scoped HttpOnly cookies', async () => {
    const response = await login();
    const data = (response.body as ApiBody).data;
    const cookies = response.headers['set-cookie'] as unknown as string[];
    const cookie = cookies.find((value) => value.startsWith('refreshToken='))!;
    const token = cookie.split(';')[0].slice('refreshToken='.length);
    const session = sessions.get(data.sessionId)!;
    expect(sessions.size).toBe(1);
    expect(data).not.toHaveProperty('refreshToken');
    expect(session.refreshTokenHash).toBe(
      createHash('sha256').update(token).digest('hex'),
    );
    expect(session.refreshTokenHash).not.toBe(token);
    expect(session).toMatchObject({
      userId: 'patient-id',
      clientType: 'WEB',
      revokedAt: null,
    });
    expect(cookie).toContain('HttpOnly');
    expect(cookie).toContain('Path=/api/v1/authentication');
    expect(cookie).toContain('SameSite=Lax');
    expect(jwt.decode(data.accessToken)).toMatchObject({
      sid: data.sessionId,
      tokenUse: 'ACCESS',
    });
    expect(jwt.decode(token)).toMatchObject({
      sid: data.sessionId,
      tokenUse: 'REFRESH',
      aud: 'mediconnect-refresh',
    });
  });

  it('returns both tokens for MOBILE without setting browser cookies and records device metadata', async () => {
    const { response, data } = await mobileLogin();
    expect(data.refreshToken).toEqual(expect.any(String));
    expect(response.headers['set-cookie']).toBeUndefined();
    expect(sessions.get(data.sessionId)).toMatchObject({
      clientType: 'MOBILE',
      deviceName: 'Test phone',
      userAgent: 'MediConnect test device',
    });
    expect(sessions.get(data.sessionId)!.ipAddress).toEqual(expect.any(String));
  });

  it('rotates tokens within one session and updates its hash without extending absolute expiration', async () => {
    const { data } = await mobileLogin();
    const session = sessions.get(data.sessionId)!;
    const expiresAt = session.expiresAt;
    session.lastActiveAt = new Date('2026-01-01');
    const response = await refresh(data.refreshToken!).expect(200);
    const next = (response.body as ApiBody).data;
    expect(next.sessionId).toBe(data.sessionId);
    expect(next.refreshToken).not.toBe(data.refreshToken);
    expect(next.accessToken).not.toBe(data.accessToken);
    expect(sessions.size).toBe(1);
    expect(session.refreshTokenHash).toBe(
      createHash('sha256').update(next.refreshToken!).digest('hex'),
    );
    expect(session.expiresAt).toEqual(expiresAt);
    expect(session.lastActiveAt.getTime()).toBeGreaterThan(
      new Date('2026-01-01').getTime(),
    );
    await request(server)
      .get('/api/v1/me')
      .set('Authorization', 'Bearer ' + next.accessToken)
      .expect(200);
  });

  it('allows WEB refresh with an expired access token and requires Origin when using cookies', async () => {
    const response = await login();
    const cookies = response.headers['set-cookie'] as unknown as string[];
    const cookie = cookies
      .find((value) => value.startsWith('refreshToken='))!
      .split(';')[0];
    await request(server)
      .post('/api/v1/authentication/refresh')
      .set('Cookie', cookie)
      .send({})
      .expect(403);
    await request(server)
      .post('/api/v1/authentication/refresh')
      .set('Cookie', cookie)
      .set('Origin', 'https://untrusted.example')
      .send({})
      .expect(403);
    const refreshed = await request(server)
      .post('/api/v1/authentication/refresh')
      .set('Cookie', cookie + '; accessToken=expired')
      .set('Origin', 'http://localhost:3000')
      .send({})
      .expect(200);
    expect((refreshed.body as ApiBody).data).not.toHaveProperty('refreshToken');
    expect(refreshed.headers['set-cookie']).toHaveLength(2);
    expect(refreshed.headers['cache-control']).toBe('no-store');
  });

  it('revokes the entire affected session when a previously issued refresh token is reused', async () => {
    const { data } = await mobileLogin();
    const other = await mobileLogin();
    const next = (await refresh(data.refreshToken!).expect(200))
      .body as ApiBody;
    await refresh(data.refreshToken!).expect(401);
    expect(sessions.get(data.sessionId)!.revocationReason).toBe(
      'REFRESH_TOKEN_REUSE',
    );
    await refresh(next.data.refreshToken!).expect(401);
    await request(server)
      .get('/api/v1/me')
      .set('Authorization', 'Bearer ' + next.data.accessToken)
      .expect(401);
    await request(server)
      .get('/api/v1/me')
      .set('Authorization', 'Bearer ' + other.data.accessToken)
      .expect(200);
  });

  it('allows only one concurrent refresh and commits reuse revocation for the loser', async () => {
    const { data } = await mobileLogin();
    const responses = await Promise.all([
      refresh(data.refreshToken!),
      refresh(data.refreshToken!),
    ]);
    expect(responses.map((response) => response.status).sort()).toEqual([
      200, 401,
    ]);
    expect(sessions.get(data.sessionId)!.revocationReason).toBe(
      'REFRESH_TOKEN_REUSE',
    );
    expect(sessions.size).toBe(1);
  });

  it('rejects missing, forged, expired and wrong-purpose refresh tokens without revoking a valid session', async () => {
    const { data } = await mobileLogin();
    const expired = jwt.sign(
      {
        sub: 'patient-id',
        sid: data.sessionId,
        cv: null,
        tokenUse: 'REFRESH',
        jti: 'a'.repeat(64),
      },
      { audience: 'mediconnect-refresh', expiresIn: -1 },
    );
    for (const token of [data.refreshToken! + 'x', expired, data.accessToken])
      await refresh(token).expect(401);
    await request(server)
      .post('/api/v1/authentication/refresh')
      .send({})
      .expect(401);
    await request(server)
      .post('/api/v1/authentication/refresh')
      .send({ refreshToken: 'bad' })
      .expect(400);
    expect(sessions.get(data.sessionId)!.revokedAt).toBeNull();
    await refresh(data.refreshToken!).expect(200);
  });

  it('rejects refresh tokens as bearer access credentials and tokens without a persisted session', async () => {
    const { data } = await mobileLogin();
    await request(server)
      .get('/api/v1/me')
      .set('Authorization', 'Bearer ' + data.refreshToken)
      .expect(401);
    await request(server)
      .get('/api/v1/me')
      .set('Authorization', 'Bearer ' + jwt.sign({ sub: 'patient-id' }))
      .expect(401);
    const unknown = jwt.sign({
      sub: 'patient-id',
      sid: randomUUID(),
      cv: null,
      tokenUse: 'ACCESS',
    });
    await request(server)
      .get('/api/v1/me')
      .set('Authorization', 'Bearer ' + unknown)
      .expect(401);
    sessions.get(data.sessionId)!.userId = 'another-user';
    await request(server)
      .get('/api/v1/me')
      .set('Authorization', 'Bearer ' + data.accessToken)
      .expect(401);
    await refresh(data.refreshToken!).expect(401);
  });

  it.each([
    'EXPIRED',
    'REVOKED',
    'LOCKED_USER',
    'DELETED_USER',
    'INACTIVE_ROLE',
    'DELETED_ROLE',
    'CHANGED_PASSWORD',
  ])('rejects access and refresh for %s', async (state) => {
    const { data } = await mobileLogin();
    const session = sessions.get(data.sessionId)!;
    const user = users.get('patient-id')!;
    if (state === 'EXPIRED') session.expiresAt = new Date(Date.now() - 1);
    if (state === 'REVOKED') session.revokedAt = new Date();
    if (state === 'LOCKED_USER') user.status = UserStatus.LOCKED;
    if (state === 'DELETED_USER') user.deletedAt = new Date();
    if (state === 'INACTIVE_ROLE')
      roles.get(user.roleId)!.status = RoleStatusEnum.INACTIVE;
    if (state === 'DELETED_ROLE')
      roles.get(user.roleId)!.deletedAt = new Date();
    if (state === 'CHANGED_PASSWORD') user.passwordChangedAt = new Date();
    await refresh(data.refreshToken!).expect(401);
    await request(server)
      .get('/api/v1/me')
      .set('Authorization', 'Bearer ' + data.accessToken)
      .expect(401);
  });

  it('caps both token lifetimes to the remaining session lifetime', async () => {
    const { data } = await mobileLogin();
    sessions.get(data.sessionId)!.expiresAt = new Date(Date.now() + 6000);
    const next = (await refresh(data.refreshToken!).expect(200))
      .body as ApiBody;
    expect(next.data.refreshExpiresIn).toBeLessThanOrEqual(6);
    expect(next.data.refreshExpiresIn).toBeGreaterThan(0);
    expect(next.data.expiresIn).toBeLessThanOrEqual(6);
  });

  it('logs out the current session, clears both cookies and preserves another device', async () => {
    const { data } = await mobileLogin();
    const other = await mobileLogin();
    const response = await request(server)
      .post('/api/v1/authentication/logout')
      .set('Authorization', 'Bearer ' + data.accessToken)
      .expect(200);
    const cookies = response.headers['set-cookie'] as unknown as string[];
    expect(cookies).toHaveLength(2);
    expect(
      cookies.every((cookie) => cookie.includes('Expires=Thu, 01 Jan 1970')),
    ).toBe(true);
    expect(sessions.get(data.sessionId)!.revocationReason).toBe('LOGOUT');
    await refresh(data.refreshToken!).expect(401);
    await request(server)
      .get('/api/v1/me')
      .set('Authorization', 'Bearer ' + data.accessToken)
      .expect(401);
    await request(server)
      .get('/api/v1/me')
      .set('Authorization', 'Bearer ' + other.data.accessToken)
      .expect(200);
  });

  it("lists only the current user's active sessions without exposing hashes and enforces ownership when revoking", async () => {
    const { data } = await mobileLogin();
    const other = await mobileLogin();
    users.set('other-id', {
      ...users.get('patient-id')!,
      id: 'other-id',
      email: 'other@example.com',
    });
    const foreign = await mobileLogin('other@example.com');
    const result = await request(server)
      .get('/api/v1/authentication/sessions')
      .set('Authorization', 'Bearer ' + data.accessToken)
      .expect(200);
    const listed = result.body.data as Array<{
      id: string;
      isCurrent: boolean;
    }>;
    expect(listed).toHaveLength(2);
    expect(
      listed.find((session) => session.id === data.sessionId)!.isCurrent,
    ).toBe(true);
    expect(
      listed.find((session) => session.id === other.data.sessionId)!.isCurrent,
    ).toBe(false);
    expect(JSON.stringify(listed)).not.toContain('refreshTokenHash');
    await request(server)
      .delete('/api/v1/authentication/sessions/' + foreign.data.sessionId)
      .set('Authorization', 'Bearer ' + data.accessToken)
      .expect(404);
    await request(server)
      .delete('/api/v1/authentication/sessions/not-a-uuid')
      .set('Authorization', 'Bearer ' + data.accessToken)
      .expect(400);
    await request(server)
      .delete('/api/v1/authentication/sessions/' + other.data.sessionId)
      .set('Authorization', 'Bearer ' + data.accessToken)
      .expect(200);
    await refresh(other.data.refreshToken!).expect(401);
    expect(sessions.get(foreign.data.sessionId)!.revokedAt).toBeNull();
  });

  it("logs out all own sessions without revoking another user's sessions", async () => {
    const { data } = await mobileLogin();
    const other = await mobileLogin();
    users.set('other-id', {
      ...users.get('patient-id')!,
      id: 'other-id',
      email: 'other@example.com',
    });
    const foreign = await mobileLogin('other@example.com');
    await request(server)
      .post('/api/v1/authentication/logout_all')
      .set('Authorization', 'Bearer ' + data.accessToken)
      .expect(200);
    expect(sessions.get(data.sessionId)!.revocationReason).toBe('LOGOUT_ALL');
    await refresh(other.data.refreshToken!).expect(401);
    await refresh(foreign.data.refreshToken!).expect(200);
  });

  it('revokes all access and refresh credentials after password reset', async () => {
    const { data } = await mobileLogin();
    const other = await mobileLogin();
    const verified = (await verify(await forgot()).expect(200)).body as ApiBody;
    await request(server)
      .post('/api/v1/authentication/reset_password')
      .send({
        resetToken: verified.data.resetToken,
        password: 'ChangedPassword2!',
      })
      .expect(200);
    for (const pair of [data, other.data]) {
      expect(sessions.get(pair.sessionId)!.revocationReason).toBe(
        'PASSWORD_RESET',
      );
      await refresh(pair.refreshToken!).expect(401);
      await request(server)
        .get('/api/v1/me')
        .set('Authorization', 'Bearer ' + pair.accessToken)
        .expect(401);
    }
  });

  it('does not issue credentials or cookies when session creation fails', async () => {
    prisma.authSession.create.mockRejectedValueOnce(
      new Error('Database unavailable'),
    );
    const response = await request(server)
      .post('/api/v1/authentication/login')
      .send({ email: 'patient@example.com', password: 'ValidPassword1!' })
      .expect(500);
    expect(response.headers['set-cookie']).toBeUndefined();
    expect(response.body).not.toHaveProperty('data.accessToken');
    expect(sessions.size).toBe(0);
  });

  it('rechecks credentials under the account lock before creating a login session', async () => {
    prisma.$transaction.mockImplementationOnce(async (action) => {
      users.get('patient-id')!.passwordHash = 'new-password-hash';
      return action(prisma);
    });
    await request(server)
      .post('/api/v1/authentication/login')
      .send({ email: 'patient@example.com', password: 'ValidPassword1!' })
      .expect(401);
    expect(sessions.size).toBe(0);
  });

  it('keeps the previous refresh token usable and returns no credentials when rotation persistence fails', async () => {
    const { data } = await mobileLogin();
    const previousHash = sessions.get(data.sessionId)!.refreshTokenHash;
    prisma.authSession.updateMany.mockRejectedValueOnce(
      new Error('Rotation database failure'),
    );
    const response = await refresh(data.refreshToken!).expect(500);
    expect(response.headers['set-cookie']).toBeUndefined();
    expect(response.body).not.toHaveProperty('data.accessToken');
    expect(sessions.get(data.sessionId)!.refreshTokenHash).toBe(previousHash);
    await refresh(data.refreshToken!).expect(200);
  });

  it('filters inactive sessions and clears cookies when revoking the current session', async () => {
    const { data } = await mobileLogin();
    const expired = await mobileLogin();
    const revoked = await mobileLogin();
    sessions.get(expired.data.sessionId)!.expiresAt = new Date(Date.now() - 1);
    sessions.get(revoked.data.sessionId)!.revokedAt = new Date();
    const result = await request(server)
      .get('/api/v1/authentication/sessions')
      .set('Authorization', 'Bearer ' + data.accessToken)
      .expect(200);
    expect(result.body.data).toHaveLength(1);
    const response = await request(server)
      .delete('/api/v1/authentication/sessions/' + data.sessionId)
      .set('Authorization', 'Bearer ' + data.accessToken)
      .expect(200);
    expect(response.headers['set-cookie']).toHaveLength(2);
    expect(sessions.get(data.sessionId)!.revocationReason).toBe('USER_REVOKED');
    await refresh(data.refreshToken!).expect(401);
    await request(server)
      .get('/api/v1/me')
      .set('Authorization', 'Bearer ' + data.accessToken)
      .expect(401);
  });

  it('protects session mutation endpoints from cookie CSRF', async () => {
    const response = await login();
    const cookie = (
      response.headers['set-cookie'] as unknown as string[]
    )[0].split(';')[0];
    await request(server)
      .post('/api/v1/authentication/logout')
      .set('Cookie', cookie)
      .expect(403);
    await request(server)
      .post('/api/v1/authentication/logout_all')
      .set('Cookie', cookie)
      .set('Origin', 'https://untrusted.example')
      .expect(403);
    expect([...sessions.values()][0].revokedAt).toBeNull();
  });

  it('registers a pending PATIENT, sends email OTP and activates only after verification', async () => {
    const response = await request(server)
      .post('/api/v1/authentication/register')
      .send({
        name: ' New Patient ',
        email: 'NEW@GMAIL.COM ',
        password: 'NewPassword1!',
      })
      .expect(201);
    const body = response.body as ApiBody;
    const user = [...users.values()].find(
      (user) => user.email === 'new@gmail.com',
    )!;
    expect(user).toMatchObject({
      name: 'New Patient',
      roleId: roleId(RoleEnum.PATIENT),
      status: 'PENDING_VERIFICATION',
    });
    expect(user.passwordHash).not.toBe('NewPassword1!');
    expect(body.data).not.toHaveProperty('passwordHash');
    expect(body.data).not.toHaveProperty('otp');
    expect(body.data).not.toHaveProperty('accessToken');
    expect(deliveries[0]).toMatchObject({
      destination: 'new@gmail.com',
      channel: 'EMAIL',
      purpose: 'REGISTER',
    });
    expect(otps.get(body.data.challengeId)!.codeDigest).not.toBe(
      deliveries[0].code,
    );
    await request(server)
      .post('/api/v1/authentication/login')
      .send({ email: 'new@gmail.com', password: 'NewPassword1!' })
      .expect(401);
    await request(server)
      .post('/api/v1/authentication/verify')
      .send({ challengeId: body.data.challengeId, otp: deliveries[0].code })
      .expect(200);
    expect(user.status).toBe('ACTIVE');
    expect(user.emailVerifiedAt).toBeInstanceOf(Date);
    await request(server)
      .post('/api/v1/authentication/verify')
      .send({ challengeId: body.data.challengeId, otp: deliveries[0].code })
      .expect(400);
    await request(server)
      .post('/api/v1/authentication/login')
      .send({ email: 'new@gmail.com', password: 'NewPassword1!' })
      .expect(200);
  });

  it.each(['roleId', 'role', 'permissions', 'status', 'passwordHash'])(
    'rejects registration privilege field %s',
    async (field) => {
      await request(server)
        .post('/api/v1/authentication/register')
        .send({
          name: 'Patient',
          email: 'new@example.com',
          password: 'NewPassword1!',
          [field]: 'ADMIN',
        })
        .expect(400);
      expect(prisma.user.create).not.toHaveBeenCalled();
    },
  );

  it('returns conflict for an existing email and for a database uniqueness race', async () => {
    await request(server)
      .post('/api/v1/authentication/register')
      .send({
        name: 'Patient',
        email: 'patient@example.com',
        password: 'NewPassword1!',
      })
      .expect(409);
    prisma.user.create.mockRejectedValueOnce(
      new Prisma.PrismaClientKnownRequestError('Unique', {
        code: 'P2002',
        clientVersion: '7',
      }),
    );
    await request(server)
      .post('/api/v1/authentication/register')
      .send({
        name: 'Patient',
        email: 'race@example.com',
        password: 'NewPassword1!',
      })
      .expect(409);
  });

  it.each([null, 42, {}, []])(
    'rejects malformed email without throwing a server error: %p',
    async (email) => {
      await request(server)
        .post('/api/v1/authentication/login')
        .send({ email, password: 'ValidPassword1!' })
        .expect(400);
    },
  );

  it('enforces password limits in bytes and required fields', async () => {
    await request(server)
      .post('/api/v1/authentication/register')
      .send({
        name: 'Patient',
        email: 'new@example.com',
        password: 'Aa1!' + 'é'.repeat(35),
      })
      .expect(400);
    await request(server)
      .post('/api/v1/authentication/login')
      .send({})
      .expect(400);
  });

  it('logs in and supports both bearer and HttpOnly cookie on /me', async () => {
    const response = await login();
    const body = response.body as ApiBody;
    expect(body.data.accessToken).toEqual(expect.any(String));
    expect(response.headers['cache-control']).toBe('no-store');
    const cookies = response.headers['set-cookie'] as unknown as string[];
    expect(cookies[0]).toContain('HttpOnly');
    expect(cookies[0]).toContain('SameSite=Lax');
    expect(cookies[0]).toContain('Path=/api/v1');
    for (const headers of [
      { Authorization: 'Bearer ' + body.data.accessToken },
      { Cookie: cookies[0].split(';')[0] },
    ]) {
      const me = await request(server)
        .get('/api/v1/me')
        .set(headers)
        .expect(200);
      expect((me.body as ApiBody).data).toMatchObject({
        id: 'patient-id',
        roleId: roleId(RoleEnum.PATIENT),
        role: RoleEnum.PATIENT,
        permissions: ['USERS_READ_ME'],
      });
      expect((me.body as ApiBody).data).not.toHaveProperty('passwordHash');
    }
  });

  it('does not expose user listing, editing or password reset routes', async () => {
    for (const url of [
      '/api/v1/users',
      '/api/v1/user',
      '/api/v1/user/me',
      '/api/v1/users/patient-id',
    ]) {
      await request(server)
        .get(url)
        .set('Authorization', 'Bearer ' + accessToken())
        .expect(404);
    }
    await request(server)
      .patch('/api/v1/me')
      .set('Authorization', 'Bearer ' + accessToken())
      .send({ role: 'ADMIN' })
      .expect(404);
  });

  it('returns the same authentication error for unknown email and wrong password', async () => {
    const responses = [];
    for (const email of ['unknown@example.com', 'patient@example.com']) {
      const result = await request(server)
        .post('/api/v1/authentication/login')
        .send({ email, password: 'WrongPassword1!' })
        .expect(401);
      responses.push(result.body as ApiBody);
    }
    expect(responses[0]).toEqual(responses[1]);
  });

  it.each([UserStatus.LOCKED, UserStatus.PENDING_VERIFICATION])(
    'rejects %s at login and /me even for an existing token',
    async (status) => {
      const token = accessToken();
      users.get('patient-id')!.status = status;
      await request(server)
        .post('/api/v1/authentication/login')
        .send({ email: 'patient@example.com', password: 'ValidPassword1!' })
        .expect(401);
      await request(server)
        .get('/api/v1/me')
        .set('Authorization', 'Bearer ' + token)
        .expect(401);
    },
  );

  it('rejects disabled role, deleted user, missing user and changed password', async () => {
    const token = accessToken();
    roles.get(roleId(RoleEnum.PATIENT))!.status = RoleStatusEnum.INACTIVE;
    await request(server)
      .get('/api/v1/me')
      .set('Authorization', 'Bearer ' + token)
      .expect(401);
    roles.get(roleId(RoleEnum.PATIENT))!.status = RoleStatusEnum.ACTIVE;
    users.get('patient-id')!.deletedAt = new Date();
    await request(server)
      .get('/api/v1/me')
      .set('Authorization', 'Bearer ' + token)
      .expect(401);
    users.get('patient-id')!.deletedAt = null;
    users.get('patient-id')!.passwordChangedAt = new Date();
    await request(server)
      .get('/api/v1/me')
      .set('Authorization', 'Bearer ' + token)
      .expect(401);
    users.clear();
    await request(server)
      .get('/api/v1/me')
      .set('Authorization', 'Bearer ' + token)
      .expect(401);
  });

  it('rejects missing, expired, tampered, wrong-audience and incomplete tokens', async () => {
    await request(server).get('/api/v1/me').expect(401);
    for (const token of [
      'invalid',
      accessToken() + 'x',
      jwt.sign({ sub: 'patient-id' }, { expiresIn: -1 }),
      jwt.sign({ sub: 'patient-id' }, { audience: 'another-app' }),
      jwt.sign({ sub: 'patient-id' }, { secret: 'another-secret' }),
      jwt.sign({ role: 'ADMIN' }),
    ]) {
      await request(server)
        .get('/api/v1/me')
        .set('Authorization', 'Bearer ' + token)
        .expect(401);
    }
    await request(server)
      .get('/api/v1/me')
      .set('Authorization', 'Basic abc')
      .set('Cookie', 'accessToken=' + accessToken())
      .expect(401);
  });

  it('enforces roles and uses role changes immediately instead of trusting old token claims', async () => {
    const token = accessToken();
    await request(server)
      .get('/api/v1/rbac-probe/admin')
      .set('Authorization', 'Bearer ' + token)
      .expect(403);
    users.get('patient-id')!.roleId = roleId(RoleEnum.ADMIN);
    await request(server)
      .get('/api/v1/rbac-probe/admin')
      .set('Authorization', 'Bearer ' + token)
      .expect(200);
  });

  it('requires every declared permission and does not grant admin an implicit bypass', async () => {
    const token = accessToken();
    await request(server)
      .get('/api/v1/rbac-probe/permission')
      .set('Authorization', 'Bearer ' + token)
      .expect(403);
    rolePermissions.set(RoleEnum.PATIENT, ['TEST_WRITE']);
    await request(server)
      .get('/api/v1/rbac-probe/permission')
      .set('Authorization', 'Bearer ' + token)
      .expect(403);
    rolePermissions.set(RoleEnum.PATIENT, [
      'TEST_WRITE',
      PermissionEnum.USERS_READ_ME,
    ]);
    await request(server)
      .get('/api/v1/rbac-probe/permission')
      .set('Authorization', 'Bearer ' + token)
      .expect(200);
    users.get('patient-id')!.roleId = roleId(RoleEnum.ADMIN);
    rolePermissions.set(RoleEnum.ADMIN, []);
    await request(server)
      .get('/api/v1/me')
      .set('Authorization', 'Bearer ' + token)
      .expect(403);
  });

  it.each(['MISSING', 'INACTIVE', 'DELETED'])(
    'rejects registration when the PATIENT role is %s',
    async (state) => {
      const role = roles.get(roleId(RoleEnum.PATIENT))!;
      if (state === 'MISSING') roles.delete(role.id);
      if (state === 'INACTIVE') role.status = RoleStatusEnum.INACTIVE;
      if (state === 'DELETED') role.deletedAt = new Date();
      await request(server)
        .post('/api/v1/authentication/register')
        .send({
          name: 'Patient',
          email: 'new@gmail.com',
          password: 'NewPassword1!',
        })
        .expect(503);
      expect(prisma.user.create).not.toHaveBeenCalled();
      expect(delivery.send).not.toHaveBeenCalled();
    },
  );

  it('supports a database-defined role and authorizes by name rather than ID', async () => {
    const token = accessToken();
    roles.set('custom-role-id', {
      id: 'custom-role-id',
      name: 'NURSE',
      status: RoleStatusEnum.ACTIVE,
      deletedAt: null,
    });
    rolePermissions.set('NURSE', [PermissionEnum.USERS_READ_ME]);
    users.get('patient-id')!.roleId = 'custom-role-id';
    const me = await request(server)
      .get('/api/v1/me')
      .set('Authorization', 'Bearer ' + token)
      .expect(200);
    expect((me.body as ApiBody).data).toMatchObject({
      roleId: 'custom-role-id',
      role: 'NURSE',
    });
    await request(server)
      .get('/api/v1/rbac-probe/custom-role')
      .set('Authorization', 'Bearer ' + token)
      .expect(200);
    await request(server)
      .get('/api/v1/rbac-probe/admin')
      .set('Authorization', 'Bearer ' + token)
      .expect(403);
  });

  it.each(['INACTIVE_PERMISSION', 'DELETED_PERMISSION', 'DELETED_GRANT'])(
    'revokes access immediately for %s',
    async (state) => {
      const token = accessToken();
      await request(server)
        .get('/api/v1/me')
        .set('Authorization', 'Bearer ' + token)
        .expect(200);
      if (state === 'INACTIVE_PERMISSION')
        disabledPermissions.add(PermissionEnum.USERS_READ_ME);
      if (state === 'DELETED_PERMISSION')
        deletedPermissions.add(PermissionEnum.USERS_READ_ME);
      if (state === 'DELETED_GRANT')
        deletedGrants.add(
          roleId(RoleEnum.PATIENT) + ':' + PermissionEnum.USERS_READ_ME,
        );
      await request(server)
        .get('/api/v1/me')
        .set('Authorization', 'Bearer ' + token)
        .expect(403);
    },
  );

  it('rejects login and OTP operations for a soft-deleted role', async () => {
    const id = await forgot();
    const token = accessToken();
    roles.get(roleId(RoleEnum.PATIENT))!.deletedAt = new Date();
    await request(server)
      .get('/api/v1/me')
      .set('Authorization', 'Bearer ' + token)
      .expect(401);
    await request(server)
      .post('/api/v1/authentication/login')
      .send({ email: 'patient@example.com', password: 'ValidPassword1!' })
      .expect(401);
    await verify(id).expect(400);
    await forgot();
    expect(deliveries).toHaveLength(1);
  });

  it('protects routes by default and rejects untrusted login origins', async () => {
    await request(server).get('/api/v1/rbac-probe/protected').expect(401);
    await request(server)
      .get('/api/v1/rbac-probe/protected')
      .set('Authorization', 'Bearer ' + accessToken())
      .expect(200);
    await request(server)
      .post('/api/v1/authentication/login')
      .set('Origin', 'https://untrusted.example')
      .send({ email: 'patient@example.com', password: 'ValidPassword1!' })
      .expect(403);
    const result = await request(server)
      .post('/api/v1/authentication/login')
      .set('Origin', 'http://localhost:3000')
      .send({ email: 'patient@example.com', password: 'ValidPassword1!' })
      .expect(200);
    expect(result.headers['access-control-allow-origin']).toBe(
      'http://localhost:3000',
    );
  });

  async function forgot(email = 'patient@example.com') {
    const response = await request(server)
      .post('/api/v1/authentication/forgot_password')
      .send({ email })
      .expect(200);
    return (response.body as ApiBody).data.challengeId;
  }
  function verify(id: string, otp = deliveries.at(-1)!.code) {
    return request(server)
      .post('/api/v1/authentication/verify')
      .send({ challengeId: id, otp });
  }

  it('supports normalized Vietnamese phone registration, Zalo activation and phone login', async () => {
    const response = await request(server)
      .post('/api/v1/authentication/register')
      .send({
        name: 'Phone Patient',
        phone: '0901234567',
        password: 'NewPassword1!',
      })
      .expect(201);
    expect(deliveries[0]).toMatchObject({
      channel: 'ZALO',
      destination: '+84901234567',
    });
    await verify((response.body as ApiBody).data.challengeId).expect(200);
    const user = [...users.values()].find(
      (user) => user.phone === '+84901234567',
    )!;
    expect(user.phoneVerifiedAt).toBeInstanceOf(Date);
    await request(server)
      .post('/api/v1/authentication/login')
      .send({ phone: '84901234567', password: 'NewPassword1!' })
      .expect(200);
  });

  it.each([
    {},
    { email: 'a@gmail.com', phone: '0901234567' },
    { phone: null },
    { phone: 901234567 },
    { phone: '+123456789' },
    { phone: '090' },
    { email: null },
  ])('rejects invalid or ambiguous contact: %p', async (contact) => {
    await request(server)
      .post('/api/v1/authentication/register')
      .send({ name: 'Patient', password: 'NewPassword1!', ...contact })
      .expect(400);
    expect(delivery.send).not.toHaveBeenCalled();
  });

  it('rejects unconfigured delivery before creating an account', async () => {
    delivery.assertConfigured.mockImplementationOnce(() => {
      throw new ServiceUnavailableException('Not configured');
    });
    await request(server)
      .post('/api/v1/authentication/register')
      .send({ name: 'Patient', phone: '0901234567', password: 'NewPassword1!' })
      .expect(503);
    expect(users.size).toBe(1);
  });

  it('revokes failed delivery and keeps the account pending', async () => {
    delivery.send.mockRejectedValueOnce(
      new ServiceUnavailableException('Unavailable'),
    );
    await request(server)
      .post('/api/v1/authentication/register')
      .send({
        name: 'Patient',
        email: 'failed@gmail.com',
        password: 'NewPassword1!',
      })
      .expect(503);
    const otp = [...otps.values()][0];
    expect(otp.revokedAt).toBeInstanceOf(Date);
    expect(otp.sentAt).toBeNull();
    expect(
      [...users.values()].find((user) => user.email === 'failed@gmail.com')!
        .status,
    ).toBe('PENDING_VERIFICATION');
    await verify(otp.id, '123456').expect(400);
  });

  it('commits every wrong attempt and rejects the correct OTP after five failures', async () => {
    const id = await forgot();
    const correct = deliveries[0].code;
    const wrong = correct === '000000' ? '111111' : '000000';
    for (let i = 1; i <= 5; i++) {
      await verify(id, wrong).expect(400);
      expect(otps.get(id)!.attemptCount).toBe(i);
    }
    await verify(id, correct).expect(400);
    expect(otps.get(id)!.revokedAt).toBeInstanceOf(Date);
  });

  it('rejects expired, undelivered and unknown challenges', async () => {
    const id = await forgot();
    otps.get(id)!.sentAt = null;
    await verify(id).expect(400);
    otps.get(id)!.sentAt = new Date();
    otps.get(id)!.expiresAt = new Date(Date.now() - 1);
    await verify(id).expect(400);
    await verify('f51f2e87-70b8-4f6f-9f17-072bad90d1ee').expect(400);
  });

  it('enforces resend cooldown/hour cap and invalidates superseded codes', async () => {
    const first = await forgot();
    const originalCode = deliveries[0].code;
    await forgot();
    expect(deliveries).toHaveLength(1);
    otps.get(first)!.createdAt = new Date(Date.now() - 61_000);
    const response = await request(server)
      .post('/api/v1/authentication/send_otp')
      .send({ email: 'patient@example.com', purpose: 'RESET_PASSWORD' })
      .expect(200);
    expect(deliveries).toHaveLength(2);
    await verify(first, originalCode).expect(400);
    await verify((response.body as ApiBody).data.challengeId).expect(200);
    for (let i = 0; i < 5; i++) {
      for (const row of otps.values())
        row.createdAt = new Date(row.createdAt.getTime() - 61_000);
      await forgot();
    }
    expect(deliveries).toHaveLength(5);
  });

  it('returns the same response shape without revealing unknown or ineligible accounts', async () => {
    const unknown = await forgot('unknown@example.com');
    expect(otps.has(unknown)).toBe(false);
    expect(deliveries).toHaveLength(0);
    users.get('patient-id')!.status = UserStatus.LOCKED;
    const locked = await forgot();
    expect(otps.has(locked)).toBe(false);
    expect(deliveries).toHaveLength(0);
    await request(server)
      .post('/api/v1/authentication/send_otp')
      .send({ email: 'patient@example.com', purpose: 'SET_PASSWORD' })
      .expect(400);
  });

  it('cannot use a registration OTP to unlock an account', async () => {
    for (const status of [UserStatus.LOCKED]) {
      const response = await request(server)
        .post('/api/v1/authentication/register')
        .send({
          name: 'Patient',
          email: status.toLowerCase() + '@gmail.com',
          password: 'NewPassword1!',
        })
        .expect(201);
      const user = [...users.values()].find(
        (user) => user.email === status.toLowerCase() + '@gmail.com',
      )!;
      user.status = status;
      await verify((response.body as ApiBody).data.challengeId).expect(400);
      expect(user.status).toBe(status);
    }
  });

  it('finishes password recovery once, revokes sessions and rejects old JWT/password immediately', async () => {
    const loginResponse = await login();
    const oldToken = (loginResponse.body as ApiBody).data.accessToken;
    const id = await forgot();
    const verified = await verify(id).expect(200);
    const resetToken = (verified.body as ApiBody).data.resetToken;
    expect(resetToken).toMatch(/^[a-f0-9]{64}$/);
    expect(otps.get(id)!.continuationTokenHash).not.toBe(resetToken);
    expect(verified.headers['cache-control']).toBe('no-store');
    await verify(id).expect(400);
    await request(server)
      .post('/api/v1/authentication/reset_password')
      .send({ resetToken, password: 'ChangedPassword2!' })
      .expect(200);
    await request(server)
      .post('/api/v1/authentication/reset_password')
      .send({ resetToken, password: 'AnotherPassword3!' })
      .expect(400);
    expect(prisma.authSession.updateMany).toHaveBeenCalled();
    await request(server)
      .get('/api/v1/me')
      .set('Authorization', 'Bearer ' + oldToken)
      .expect(401);
    await request(server)
      .post('/api/v1/authentication/login')
      .send({ email: 'patient@example.com', password: 'ValidPassword1!' })
      .expect(401);
    const current = await request(server)
      .post('/api/v1/authentication/login')
      .send({ email: 'patient@example.com', password: 'ChangedPassword2!' })
      .expect(200);
    await request(server)
      .get('/api/v1/me')
      .set(
        'Authorization',
        'Bearer ' + (current.body as ApiBody).data.accessToken,
      )
      .expect(200);
  });

  it('rejects expired, forged, superseded and locked-account reset tokens', async () => {
    const id = await forgot();
    const verified = await verify(id).expect(200);
    const resetToken = (verified.body as ApiBody).data.resetToken;
    const reset = (token = resetToken) =>
      request(server)
        .post('/api/v1/authentication/reset_password')
        .send({ resetToken: token, password: 'ChangedPassword2!' });
    await reset('f'.repeat(64)).expect(400);
    otps.get(id)!.continuationExpiresAt = new Date(Date.now() - 1);
    await reset().expect(400);
    otps.get(id)!.continuationExpiresAt = new Date(Date.now() + 60_000);
    users.get('patient-id')!.status = UserStatus.LOCKED;
    await reset().expect(400);
    users.get('patient-id')!.status = UserStatus.ACTIVE;
    otps.get(id)!.createdAt = new Date(Date.now() - 61_000);
    await forgot();
    await reset().expect(400);
  });

  it('does not accept caller-selected purpose or credentials in verification', async () => {
    const id = await forgot();
    await request(server)
      .post('/api/v1/authentication/verify')
      .send({ challengeId: id, otp: deliveries[0].code, purpose: 'REGISTER' })
      .expect(400);
    expect(users.get('patient-id')!.status).toBe('ACTIVE');
  });

  it('resend preserves failed attempts across challenges', async () => {
    const first = await forgot();
    const wrong = deliveries[0].code === '000000' ? '111111' : '000000';
    for (let i = 0; i < 3; i++) await verify(first, wrong).expect(400);
    otps.get(first)!.createdAt = new Date(Date.now() - 61_000);
    const second = await forgot();
    expect(deliveries).toHaveLength(2);
    const nextWrong = deliveries[1].code === '000000' ? '111111' : '000000';
    await verify(second, nextWrong).expect(400);
    await verify(second, nextWrong).expect(400);
    expect(otps.get(second)!.attemptCount).toBe(5);
    await verify(second, deliveries[1].code).expect(400);
    otps.get(second)!.createdAt = new Date(Date.now() - 61_000);
    await forgot();
    expect(deliveries).toHaveLength(2);
    expect(users.get('patient-id')!.status).toBe(UserStatus.ACTIVE);
  });

  it('concurrent verification issues exactly one reset grant', async () => {
    const id = await forgot();
    const results = await Promise.all(
      Array.from({ length: 8 }, () => verify(id)),
    );
    expect(results.filter((result) => result.status === 200)).toHaveLength(1);
    expect(results.filter((result) => result.status === 400)).toHaveLength(7);
  });

  it('concurrent reset requests consume the grant once', async () => {
    const id = await forgot();
    const verified = await verify(id).expect(200);
    const resetToken = (verified.body as ApiBody).data.resetToken;
    const results = await Promise.all(
      Array.from({ length: 3 }, () =>
        request(server)
          .post('/api/v1/authentication/reset_password')
          .send({ resetToken, password: 'ChangedPassword2!' }),
      ),
    );
    expect(results.filter((result) => result.status === 200)).toHaveLength(1);
    expect(results.filter((result) => result.status === 400)).toHaveLength(2);
    expect(prisma.user.update).toHaveBeenCalledTimes(1);
  });

  it('does not allow a reset token to activate a locked account or restore stale credentials', async () => {
    const id = await forgot();
    const verified = await verify(id).expect(200);
    users.get('patient-id')!.passwordChangedAt = new Date();
    await request(server)
      .post('/api/v1/authentication/reset_password')
      .send({
        resetToken: (verified.body as ApiBody).data.resetToken,
        password: 'ChangedPassword2!',
      })
      .expect(400);
    expect(prisma.user.update).not.toHaveBeenCalled();
  });

  it('does not restore a consumed grant after a database failure', async () => {
    const id = await forgot();
    const verified = await verify(id).expect(200);
    const resetToken = (verified.body as ApiBody).data.resetToken;
    prisma.user.update.mockRejectedValueOnce(
      new Error('Simulated database failure'),
    );
    await request(server)
      .post('/api/v1/authentication/reset_password')
      .send({ resetToken, password: 'ChangedPassword2!' })
      .expect(500);
    await request(server)
      .post('/api/v1/authentication/reset_password')
      .send({ resetToken, password: 'ChangedPassword2!' })
      .expect(400);
    expect(users.get('patient-id')!.passwordHash).toBe(passwordHash);
  });

  it('fails closed when Redis is unavailable before registration creates an account', async () => {
    otpStore.assertReady.mockImplementationOnce(() => {
      throw new ServiceUnavailableException(
        'OTP verification is temporarily unavailable',
      );
    });
    await request(server)
      .post('/api/v1/authentication/register')
      .send({
        name: 'Patient',
        email: 'new@gmail.com',
        password: 'NewPassword1!',
      })
      .expect(503);
    expect(prisma.user.create).not.toHaveBeenCalled();
  });

  it('applies IP throttling before creating an account or sending messages', async () => {
    otpStore.throttle.mockResolvedValueOnce(false);
    await request(server)
      .post('/api/v1/authentication/register')
      .send({
        name: 'Patient',
        email: 'new@gmail.com',
        password: 'NewPassword1!',
      })
      .expect(429);
    expect(prisma.user.create).not.toHaveBeenCalled();
    otpStore.throttle.mockResolvedValueOnce(false);
    await request(server)
      .post('/api/v1/authentication/forgot_password')
      .send({ email: 'patient@example.com' })
      .expect(429);
    expect(delivery.send).not.toHaveBeenCalled();
  });

  it('requires a server-issued reset grant instead of accepting an OTP as resetToken', async () => {
    const id = await forgot();
    await request(server)
      .post('/api/v1/authentication/reset_password')
      .send({ resetToken: deliveries[0].code, password: 'ChangedPassword2!' })
      .expect(400);
    await request(server)
      .post('/api/v1/authentication/reset_password')
      .send({
        challengeId: id,
        otp: deliveries[0].code,
        password: 'ChangedPassword2!',
      })
      .expect(400);
    expect(prisma.user.update).not.toHaveBeenCalled();
  });
});
