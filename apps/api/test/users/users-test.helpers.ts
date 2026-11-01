import { Prisma } from '../../src/generated/prisma/client';
import { UserRole, UserStatus } from '../../src/generated/prisma/enums';
import type { AuditLogsService } from '../../src/modules/audit-logs/audit-logs.service';
import type { PrismaService } from '../../src/modules/database/services/prisma.service';
import type { PatientsService } from '../../src/modules/patients/patients.service';
import type { ProvidersService } from '../../src/modules/providers/providers.service';
import type { CurrentUserDto } from '../../src/modules/users/dto/responses/current-user.dto';
import { AdminUsersService } from '../../src/modules/users/services/admin-users.service';
import { UsersService } from '../../src/modules/users/services/users.service';
import type { AuthenticationUser } from '../../src/modules/users/users.repository';
import { UsersRepository } from '../../src/modules/users/users.repository';

export const NOW = new Date('2026-11-02T08:00:00+07:00');
export const USER_ID = '11111111-1111-4111-8111-111111111111';
export const OTHER_USER_ID = '22222222-2222-4222-8222-222222222222';
export const ADMIN_ID = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';
export const ROLE_ID = '33333333-3333-4333-8333-333333333333';
export const ADMIN_ROLE_ID = '44444444-4444-4444-8444-444444444444';
export const DOCTOR_ROLE_ID = '55555555-5555-4555-8555-555555555555';

export function permission(name: string) {
  return {
    deletedAt: null as Date | null,
    permission: { name, status: 'ACTIVE', deletedAt: null as Date | null },
  };
}

export function account(role: UserRole = UserRole.RECEPTIONIST) {
  const roleId =
    role === UserRole.ADMIN
      ? ADMIN_ROLE_ID
      : role === UserRole.DOCTOR
        ? DOCTOR_ROLE_ID
        : ROLE_ID;
  return {
    id: USER_ID,
    fullName: 'Nguyễn Văn An',
    email: 'an@example.invalid',
    phone: '+84901234567',
    status: UserStatus.ACTIVE as UserStatus,
    deletedAt: null as Date | null,
    passwordChangedAt: null,
    roleId,
    role: {
      id: roleId,
      name: role,
      status: 'ACTIVE',
      deletedAt: null as Date | null,
      infoPermission: [permission('USERS_READ_ME')],
    },
    doctor: null,
    patient: null,
    authSessions: [],
    createdAt: NOW,
    updatedAt: NOW,
  };
}

export const ADMIN: CurrentUserDto = {
  id: ADMIN_ID,
  name: 'Quản trị viên A',
  email: 'admin@example.invalid',
  phone: null,
  avatar: null,
  roleId: ADMIN_ROLE_ID,
  role: UserRole.ADMIN,
  status: UserStatus.ACTIVE,
  permissions: ['USERS_WRITE', 'USERS_ASSIGN_ROLE', 'USERS_LOCK'],
  createdAt: NOW,
};

export function createUsersHarness() {
  const current = account();
  const tx = {
    $queryRaw: jest.fn().mockResolvedValue([]),
    user: {
      findFirst: jest.fn().mockResolvedValue(current),
      findUnique: jest.fn().mockResolvedValue(null),
      findMany: jest.fn().mockResolvedValue([]),
      findUniqueOrThrow: jest.fn().mockResolvedValue(current),
      create: jest.fn().mockResolvedValue({ id: USER_ID }),
      update: jest.fn().mockResolvedValue(current),
    },
    role: {
      findUnique: jest.fn().mockResolvedValue({
        id: ADMIN_ROLE_ID,
        name: UserRole.ADMIN,
        status: 'ACTIVE',
        deletedAt: null,
      }),
    },
    authSession: {
      updateMany: jest.fn().mockResolvedValue({ count: 2 }),
      findUnique: jest.fn(),
      create: jest.fn(),
    },
    patient: {
      findUnique: jest.fn().mockResolvedValue(null),
      update: jest.fn(),
    },
  };
  const prisma = {
    ...tx,
    schemaName: 'public',
    $transaction: jest.fn((action: (client: typeof tx) => Promise<unknown>) =>
      action(tx),
    ),
  };
  const audit = { record: jest.fn().mockResolvedValue(undefined) };
  const db = prisma as unknown as PrismaService;
  const repository = new UsersRepository(db);
  const users = new UsersService(
    repository,
    db,
    audit as unknown as AuditLogsService,
  );
  jest
    .spyOn(users, 'assertAdminPermissions')
    .mockResolvedValue(ADMIN.permissions);
  const service = new AdminUsersService(
    db,
    users,
    audit as unknown as AuditLogsService,
    {} as ProvidersService,
    {} as PatientsService,
  );
  return { service, users, repository, prisma, db, tx, audit, current };
}

export function authenticationAccount() {
  return account() as unknown as AuthenticationUser;
}

export function uniqueContactError(field: 'email' | 'phone') {
  // Use Prisma's real error class so the service's conflict handler is exercised.
  return new Prisma.PrismaClientKnownRequestError('Unique constraint failed', {
    code: 'P2002',
    clientVersion: '7.10.0',
    meta: { target: [field] },
  });
}

export function transactionClient(
  harness: ReturnType<typeof createUsersHarness>,
) {
  return harness.tx as unknown as Prisma.TransactionClient;
}
