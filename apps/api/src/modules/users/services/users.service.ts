import {
  ForbiddenException,
  Injectable,
  ServiceUnavailableException,
  UnauthorizedException,
} from '@nestjs/common';
import { hash } from 'bcrypt';
import type { Prisma } from '../../../generated/prisma/client';
import { PrismaService } from '../../database/services/prisma.service';
import {
  PatientGender,
  PermissionStatusEnum,
  RoleStatusEnum,
  UserStatus,
  UserRole,
  AuditLogResult,
} from '../../../generated/prisma/enums';
import { STAFF_EMAIL_DOMAIN, staffEmailName } from '../utils/staff-email.util';
import {
  AuditLogsService,
  type AuditEvent,
} from '../../audit-logs/audit-logs.service';
import { CurrentUserDto } from '../dto/responses/current-user.dto';
import { UsersRepository, type AuthenticationUser } from '../users.repository';
import { RoleEnum } from '../constants/roles.constant';
import { sqlTable } from '../../database/utils/sql-table';
import { PermissionEnum } from '../../authentication/constants/permissions.constant';

@Injectable()
export class UsersService {
  constructor(
    private readonly usersRepository: UsersRepository,
    private readonly prisma: PrismaService,
    private readonly audit: AuditLogsService,
  ) {}

  findForAuthentication(contact: { email?: string; phone?: string }) {
    return this.usersRepository.findByContact(contact);
  }

  createPatient(input: {
    email?: string;
    phone: string;
    name: string;
    passwordHash: string;
    dateOfBirth?: string;
    gender?: PatientGender;
  }) {
    return this.prisma.$transaction(async (tx) => {
      const user = await this.usersRepository.createPatient(input, tx);
      await this.audit.record(
        {
          actor: { type: 'ANONYMOUS' },
          actionCode: 'ACCOUNT_REGISTER',
          module: 'USERS',
          targetType: 'USER',
          targetId: user.id,
          result: AuditLogResult.SUCCESS,
          after: { status: user.status },
        },
        tx,
      );
      return user;
    });
  }

  async createStaffAccount(
    tx: Prisma.TransactionClient,
    input: {
      fullName: string;
      phone?: string;
      role: RoleEnum.ADMIN | RoleEnum.RECEPTIONIST | RoleEnum.DOCTOR;
    },
  ) {
    const role = await tx.role.findUnique({ where: { name: input.role } });
    if (!role || role.status !== RoleStatusEnum.ACTIVE || role.deletedAt) {
      throw new ServiceUnavailableException('Vai trò nhân sự không khả dụng.');
    }
    const name = staffEmailName(input.fullName);
    // Same-name creations across API instances must choose different suffixes.
    await tx.$queryRaw`SELECT pg_advisory_xact_lock(hashtext('STAFF_EMAIL'), hashtext(${name}))`;
    const email = await this.availableStaffEmail(tx, name);
    const passwordHash = await hash('123456', 12);
    return tx.user.create({
      data: {
        fullName: input.fullName,
        email,
        phone: input.phone,
        roleId: role.id,
        status: UserStatus.ACTIVE,
        passwordHash,
        passwordChangedAt: new Date(),
      },
      select: { id: true },
    });
  }

  async previewStaffEmail(fullName: string) {
    return {
      email: await this.availableStaffEmail(
        this.prisma,
        staffEmailName(fullName),
      ),
    };
  }

  private async availableStaffEmail(
    db: Pick<Prisma.TransactionClient, 'user'>,
    name: string,
  ) {
    const existing = await db.user.findMany({
      where: {
        OR: [
          {
            email: {
              equals: `${name}@${STAFF_EMAIL_DOMAIN}`,
              mode: 'insensitive',
            },
          },
          {
            email: {
              startsWith: `${name}.`,
              endsWith: `@${STAFF_EMAIL_DOMAIN}`,
              mode: 'insensitive',
            },
          },
        ],
      },
      select: { email: true },
    });
    const used = new Set(existing.map((user) => user.email?.toLowerCase()));
    let localPart = name;
    for (
      let suffix = 2;
      used.has(`${localPart}@${STAFF_EMAIL_DOMAIN}`);
      suffix++
    )
      localPart = `${name}.${suffix}`;
    if (localPart.length > 64)
      throw new ServiceUnavailableException(
        'Họ tên quá dài để tạo email không trùng.',
      );
    return `${localPart}@${STAFF_EMAIL_DOMAIN}`;
  }

  isAllowedToAuthenticate(user: {
    status: UserStatus;
    deletedAt: Date | null;
    role: { status: RoleStatusEnum; deletedAt: Date | null } | null;
  }): boolean {
    return (
      user.status === UserStatus.ACTIVE &&
      user.deletedAt === null &&
      user.role?.status === RoleStatusEnum.ACTIVE &&
      user.role.deletedAt === null
    );
  }

  async assertAdminPermissions(
    tx: Prisma.TransactionClient,
    actorId: string,
    permissions: readonly string[],
  ) {
    const current = await tx.user.findUnique({
      where: { id: actorId },
      include: {
        role: {
          include: {
            infoPermission: {
              where: {
                deletedAt: null,
                permission: { status: 'ACTIVE', deletedAt: null },
              },
              include: { permission: true },
            },
          },
        },
      },
    });
    if (
      !current ||
      !this.isAllowedToAuthenticate(current) ||
      current.role?.name !== RoleEnum.ADMIN
    )
      throw new ForbiddenException(
        'Tài khoản không còn quyền thực hiện thao tác.',
      );
    const grants = current.role.infoPermission.map(
      (grant) => grant.permission.name,
    );
    if (permissions.some((permission) => !grants.includes(permission)))
      throw new ForbiddenException(
        'Tài khoản không còn quyền thực hiện thao tác.',
      );
    return grants;
  }

  async getAuthenticatedUser(
    userId: string,
    issuedAt: number,
    credentialVersion?: unknown,
  ): Promise<CurrentUserDto> {
    const user = await this.usersRepository.findById(userId);
    if (!user || !this.isAllowedToAuthenticate(user))
      throw new UnauthorizedException('Account is unavailable');
    if (
      user.passwordChangedAt &&
      (credentialVersion !== undefined
        ? credentialVersion !== user.passwordChangedAt.toISOString()
        : issuedAt * 1000 <= user.passwordChangedAt.getTime())
    ) {
      throw new UnauthorizedException('Please sign in again');
    }
    return this.toCurrentUser(user);
  }

  async assertSelfPermission(
    tx: Prisma.TransactionClient,
    userId: string,
    permission: PermissionEnum,
  ): Promise<CurrentUserDto> {
    const user = await this.usersRepository.findById(userId, tx);
    if (!user || !this.isAllowedToAuthenticate(user))
      throw new UnauthorizedException('Tài khoản không còn khả dụng.');
    const current = this.toCurrentUser(user);
    if (
      !Object.values(RoleEnum).includes(current.role as RoleEnum) ||
      !current.permissions.includes(permission)
    )
      throw new ForbiddenException(
        'Tài khoản không còn quyền thực hiện thao tác.',
      );
    return current;
  }

  async updateName(
    tx: Prisma.TransactionClient,
    current: CurrentUserDto,
    fullName: string,
  ) {
    const isNameChanged = current.name !== fullName;
    if (isNameChanged)
      await tx.user.update({
        where: { id: current.id },
        data: { fullName },
      });
    const patientUpdate = await this.synchronizePatientAccount(tx, current.id, {
      fullName,
    });
    if (!isNameChanged && !Object.keys(patientUpdate).length) return current;
    await this.audit.record(
      {
        actor: {
          type: 'USER',
          id: current.id,
          name: current.name,
          role: current.role as UserRole,
        },
        actionCode: 'USER_UPDATE',
        module: 'USERS',
        targetType: 'USER',
        targetId: current.id,
        result: AuditLogResult.SUCCESS,
        before: isNameChanged ? { fullName: current.name } : undefined,
        after: isNameChanged ? { fullName } : { patientNameSynchronized: true },
      },
      tx,
    );
    return { ...current, name: fullName };
  }

  async synchronizePatientAccount(
    tx: Prisma.TransactionClient,
    userId: string,
    input: { fullName?: string; phone?: string | null },
  ) {
    const fields = ['fullName', 'phone'] as const;
    const data: { fullName?: string; phone?: string | null } = {};
    if (!fields.some((field) => input[field] !== undefined)) return data;
    const patient = await tx.patient.findUnique({
      where: { userId },
      select: { id: true, fullName: true, phone: true },
    });
    if (!patient) return data;
    for (const field of fields) {
      if (input[field] !== undefined && input[field] !== patient[field])
        Object.assign(data, { [field]: input[field] });
    }
    if (Object.keys(data).length)
      await tx.patient.update({ where: { id: patient.id }, data });
    return data;
  }

  // Serialize account changes while allowing foreign-key references from other audited writes.
  withLockedAccount<T>(
    userId: string,
    action: (tx: Prisma.TransactionClient) => Promise<T>,
  ): Promise<T> {
    return this.prisma.$transaction(async (tx) => {
      await tx.$queryRaw`SELECT id FROM ${sqlTable(this.prisma.schemaName, 'users')} WHERE id = ${userId}::uuid FOR NO KEY UPDATE`;
      return action(tx);
    });
  }

  async activateAccount(
    tx: Prisma.TransactionClient,
    userId: string,
    channel: 'EMAIL' | 'ZALO',
    now: Date,
  ): Promise<void> {
    await tx.user.update({
      where: { id: userId },
      data: {
        status: UserStatus.ACTIVE,
        ...(channel === 'EMAIL'
          ? { emailVerifiedAt: now }
          : { phoneVerifiedAt: now }),
      },
    });
    await this.recordAccountEvent(tx, userId, 'ACCOUNT_ACTIVATE');
  }

  async resetPassword(
    tx: Prisma.TransactionClient,
    userId: string,
    passwordHash: string,
    now: Date,
  ): Promise<void> {
    await tx.user.update({
      where: { id: userId },
      data: { passwordHash, passwordChangedAt: now },
    });
    const revoked = await tx.authSession.updateMany({
      where: { userId, revokedAt: null },
      data: { revokedAt: now, revocationReason: 'PASSWORD_RESET' },
    });
    await this.recordAccountEvent(tx, userId, 'ACCOUNT_RESET_CREDENTIALS', {
      revokedSessions: revoked.count,
    });
  }

  async recordAccountEvent(
    tx: Prisma.TransactionClient,
    userId: string,
    actionCode: string,
    after?: AuditEvent['after'],
    isSystem = false,
  ): Promise<void> {
    const user = await tx.user.findUniqueOrThrow({
      where: { id: userId },
      select: { id: true, fullName: true, role: { select: { name: true } } },
    });
    const role = user.role?.name as UserRole;
    if (!isSystem && !Object.values(UserRole).includes(role))
      throw new ServiceUnavailableException('Account role is unavailable');
    await this.audit.record(
      {
        actor: isSystem
          ? { type: 'SYSTEM' }
          : { type: 'USER', id: user.id, name: user.fullName, role },
        actionCode,
        module: 'USERS',
        targetType: 'USER',
        targetId: userId,
        result: AuditLogResult.SUCCESS,
        after,
      },
      tx,
    );
  }

  toCurrentUser(user: AuthenticationUser): CurrentUserDto {
    return {
      id: user.id,
      name: user.fullName,
      email: user.email,
      phone: user.phone,
      avatar: null,
      roleId: user.roleId,
      role: user.role?.name ?? '',
      status: user.status,
      permissions: (user.role?.infoPermission ?? [])
        .filter(
          (entry) =>
            entry.deletedAt === null &&
            entry.permission.status === PermissionStatusEnum.ACTIVE &&
            entry.permission.deletedAt === null,
        )
        .map((entry) => entry.permission.name),
      createdAt: user.createdAt,
    };
  }
}
