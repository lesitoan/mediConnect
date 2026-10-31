import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { isUUID } from 'class-validator';
import {
  AuditLogResult,
  Prisma,
  UserStatus,
} from '../../../generated/prisma/client';
import { PaginationUtils } from '../../../common/utils/pagination.utils';
import {
  AuditLogsService,
  type AuditEvent,
} from '../../audit-logs/audit-logs.service';
import { PrismaService } from '../../database/services/prisma.service';
import { PermissionEnum } from '../../authentication/constants/permissions.constant';
import { RoleEnum } from '../constants/roles.constant';
import { CurrentUserDto } from '../dto/responses/current-user.dto';
import { CreateUserDto } from '../dto/admin/create-user.dto';
import { UpdateUserDto } from '../dto/admin/update-user.dto';
import { UpdateUserStatusDto } from '../dto/admin/update-user-status.dto';
import { UserQueryDto } from '../dto/admin/user-query.dto';
import { UsersService } from './users.service';
import { ProvidersService } from '../../providers/providers.service';
import { sqlTable } from '../../database/utils/sql-table';
import { PatientsService } from '../../patients/patients.service';

const USER_SELECT = {
  id: true,
  fullName: true,
  email: true,
  phone: true,
  status: true,
  createdAt: true,
  updatedAt: true,
  role: { select: { id: true, name: true } },
  doctor: {
    select: {
      id: true,
      doctorCode: true,
      specialty: { select: { id: true, name: true } },
    },
  },
  patient: { select: { patientCode: true } },
  authSessions: {
    orderBy: { createdAt: 'desc' },
    take: 1,
    select: { createdAt: true },
  },
} satisfies Prisma.UserSelect;
type ManagedUser = Prisma.UserGetPayload<{ select: typeof USER_SELECT }>;

function present(user: ManagedUser, actorId: string) {
  const { authSessions, ...data } = user;
  return {
    ...data,
    lastLoginAt: authSessions[0]?.createdAt ?? null,
    isCurrentUser: user.id === actorId,
  };
}

function contactConflict(error: unknown): never {
  if (
    error instanceof Prisma.PrismaClientKnownRequestError &&
    error.code === 'P2002'
  )
    throw new ConflictException(
      'Email, số điện thoại hoặc thông tin định danh đã tồn tại.',
    );
  throw error;
}

@Injectable()
export class AdminUsersService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly users: UsersService,
    private readonly audit: AuditLogsService,
    private readonly providers: ProvidersService,
    private readonly patients: PatientsService,
  ) {}

  async list(query: UserQueryDto, actor: CurrentUserDto) {
    const page = new PaginationUtils().extractSkipTakeFromPagination(query);
    const where: Prisma.UserWhereInput = {
      deletedAt: null,
      ...(query.role ? { role: { name: query.role } } : {}),
      ...(query.status ? { status: query.status } : {}),
      ...(query.specialtyId
        ? { doctor: { specialtyId: query.specialtyId } }
        : {}),
      ...(query.search
        ? {
            OR: [
              { fullName: { contains: query.search, mode: 'insensitive' } },
              { email: { contains: query.search, mode: 'insensitive' } },
              { phone: { contains: query.search } },
              {
                doctor: {
                  doctorCode: { contains: query.search, mode: 'insensitive' },
                },
              },
              {
                patient: {
                  patientCode: { contains: query.search, mode: 'insensitive' },
                },
              },
              ...(isUUID(query.search, '4') ? [{ id: query.search }] : []),
            ],
          }
        : {}),
    };
    const [items, count] = await this.prisma.$transaction([
      this.prisma.user.findMany({
        where,
        select: USER_SELECT,
        skip: page.skip,
        take: page.take,
        orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
      }),
      this.prisma.user.count({ where }),
    ]);
    return {
      items: items.map((user) => present(user, actor.id)),
      pagination: page.convertPaginationResponseDtoFromTotalRecords(count),
    };
  }

  async get(id: string, actor: CurrentUserDto) {
    const user = await this.prisma.user.findFirst({
      where: { id, deletedAt: null },
      select: USER_SELECT,
    });
    if (!user) throw new NotFoundException('Không tìm thấy tài khoản.');
    const patientProfile =
      user.role?.name === RoleEnum.PATIENT && user.patient
        ? await this.patients.getByUserId(id)
        : undefined;
    return {
      ...present(user, actor.id),
      ...(patientProfile ? { patientProfile } : {}),
    };
  }

  async options() {
    return {
      specialties: await this.providers.listSpecialties(),
    };
  }

  async create(input: CreateUserDto, actor: CurrentUserDto) {
    if ((input.role === RoleEnum.DOCTOR) !== !!input.doctor)
      throw new BadRequestException(
        'Tài khoản bác sĩ cần hồ sơ bác sĩ; vai trò khác không nhận hồ sơ này.',
      );
    if (
      input.doctor &&
      !actor.permissions.includes(PermissionEnum.DOCTORS_WRITE)
    )
      throw new ForbiddenException('Thiếu quyền tạo hồ sơ bác sĩ.');
    return this.users
      .withLockedAccount(actor.id, async (tx) => {
        const grants = await this.users.assertAdminPermissions(tx, actor.id, [
          PermissionEnum.USERS_WRITE,
        ]);
        if (
          !grants.includes(PermissionEnum.USERS_ASSIGN_ROLE) ||
          (input.doctor && !grants.includes(PermissionEnum.DOCTORS_WRITE))
        )
          throw new ForbiddenException(
            'Quyền tạo tài khoản hoặc hồ sơ bác sĩ không còn hiệu lực.',
          );
        const doctor = input.doctor
          ? await this.providers.createWithAccount(tx, {
              ...input.doctor,
              fullName: input.fullName,
              phone: input.phone,
            })
          : null;
        const created = doctor
          ? { id: doctor.userId }
          : await this.users.createStaffAccount(tx, input);
        const user = await tx.user.findUniqueOrThrow({
          where: { id: created.id },
          select: USER_SELECT,
        });
        await this.record(tx, actor, user.id, 'USER_CREATE', undefined, {
          fullName: user.fullName,
          email: user.email,
          phone: user.phone,
          role: user.role!.name,
          status: user.status,
          ...(doctor
            ? {
                doctorId: doctor.id,
                doctorCode: doctor.doctorCode,
                specialtyId: doctor.specialtyId,
              }
            : {}),
        });
        return present(user, actor.id);
      })
      .catch(contactConflict);
  }

  private async manage<T>(
    id: string,
    actor: CurrentUserDto,
    permission: string,
    action: (
      tx: Prisma.TransactionClient,
      user: ManagedUser,
      grants: string[],
    ) => Promise<T>,
  ) {
    return this.prisma
      .$transaction(async (tx) => {
        // Serialize both accounts in order while allowing Audit foreign keys during doctor updates.
        await tx.$queryRaw`SELECT id FROM ${sqlTable(this.prisma.schemaName, 'users')} WHERE id IN (${actor.id}::uuid, ${id}::uuid) ORDER BY id FOR NO KEY UPDATE`;
        const grants = await this.users.assertAdminPermissions(tx, actor.id, [
          permission,
        ]);
        const user = await tx.user.findFirst({
          where: { id, deletedAt: null },
          select: USER_SELECT,
        });
        if (!user) throw new NotFoundException('Không tìm thấy tài khoản.');
        if (
          !user.role ||
          !Object.values(RoleEnum).includes(user.role.name as RoleEnum)
        )
          throw new ForbiddenException('Vai trò tài khoản không khả dụng.');
        return action(tx, user, grants);
      })
      .catch(contactConflict);
  }

  async update(id: string, input: UpdateUserDto, actor: CurrentUserDto) {
    id = id.toLowerCase();
    if (!Object.values(input).some((value) => value !== undefined))
      throw new BadRequestException('Chưa có thông tin cập nhật.');
    const {
      fullName,
      phone,
      role: nextRole,
      specialtyId: nextSpecialtyId,
      ...profileInput
    } = input;
    const hasPatientChanges = Object.values(profileInput).some(
      (value) => value !== undefined,
    );
    return this.manage(
      id,
      actor,
      PermissionEnum.USERS_WRITE,
      async (tx, user, grants) => {
        if (hasPatientChanges && user.role!.name !== 'PATIENT')
          throw new BadRequestException(
            'Chỉ bệnh nhân mới có các trường hồ sơ này.',
          );
        const roleChanged =
          nextRole !== undefined && nextRole !== user.role!.name;
        const data: Prisma.UserUncheckedUpdateInput = {};
        const before: AuditEvent['before'] = {};
        const after: AuditEvent['after'] = {};
        for (const field of ['fullName', 'phone'] as const) {
          if (input[field] !== undefined && input[field] !== user[field]) {
            data[field] = input[field] as string;
            before[field] = user[field];
            after[field] = input[field]!;
          }
        }
        if (roleChanged) {
          if (actor.id.toLowerCase() === id)
            throw new ForbiddenException(
              'Không thể tự thay đổi vai trò của chính mình.',
            );
          if (user.role!.name !== 'RECEPTIONIST' || nextRole !== 'ADMIN')
            throw new BadRequestException(
              'Chỉ cho phép nâng vai trò Lễ tân lên Quản trị viên.',
            );
          if (!grants.includes(PermissionEnum.USERS_ASSIGN_ROLE))
            throw new ForbiddenException('Thiếu quyền phân vai trò.');
          const role = await tx.role.findUnique({
            where: { name: nextRole },
          });
          if (!role || role.status !== 'ACTIVE' || role.deletedAt)
            throw new BadRequestException('Vai trò không khả dụng.');
          data.roleId = role.id;
          before.role = user.role!.name;
          after.role = role.name;
        }
        if (
          !user.email &&
          !(input.phone === undefined ? user.phone : input.phone)
        )
          throw new BadRequestException(
            'Tài khoản phải có ít nhất một email hoặc số điện thoại.',
          );
        if (nextSpecialtyId !== undefined) {
          if (user.role!.name !== 'DOCTOR' || !user.doctor)
            throw new BadRequestException('Chỉ bác sĩ mới có chuyên khoa.');
          const specialtyId = nextSpecialtyId.toLowerCase();
          if (specialtyId !== user.doctor.specialty.id) {
            if (!grants.includes(PermissionEnum.DOCTORS_WRITE))
              throw new ForbiddenException(
                'Thiếu quyền cập nhật hồ sơ bác sĩ.',
              );
            await this.providers.update(
              user.doctor.id,
              { specialtyId },
              actor,
              tx,
            );
          }
        }
        const synchronized = await this.users.synchronizePatientAccount(
          tx,
          id,
          { fullName, phone },
        );
        if ('fullName' in synchronized && !('fullName' in after))
          after.patientNameSynchronized = true;
        if ('phone' in synchronized && !('phone' in after))
          after.patientPhoneSynchronized = true;
        const contactChanged = 'phone' in after;
        if ('phone' in after) data.phoneVerifiedAt = null;
        const updated = Object.keys(data).length
          ? await tx.user.update({ where: { id }, data, select: USER_SELECT })
          : await tx.user.findUniqueOrThrow({
              where: { id },
              select: USER_SELECT,
            });
        if (roleChanged || contactChanged) {
          const revoked = await tx.authSession.updateMany({
            where: { userId: id, revokedAt: null },
            data: {
              revokedAt: new Date(),
              revocationReason: roleChanged
                ? 'ROLE_CHANGED'
                : 'CONTACT_CHANGED',
            },
          });
          after.revokedSessions = revoked.count;
        }
        const patientProfile = hasPatientChanges
          ? await this.patients.updateProfile(id, profileInput, actor, tx)
          : undefined;
        if (Object.keys(after).length)
          await this.record(
            tx,
            actor,
            id,
            roleChanged ? 'USER_ROLE_CHANGE' : 'USER_UPDATE',
            before,
            after,
          );
        return {
          ...present(updated, actor.id),
          ...(patientProfile ? { patientProfile } : {}),
        };
      },
    );
  }

  async status(id: string, input: UpdateUserStatusDto, actor: CurrentUserDto) {
    id = id.toLowerCase();
    if (id === actor.id.toLowerCase())
      throw new ForbiddenException(
        'Không thể thay đổi trạng thái tài khoản của chính mình.',
      );
    return this.manage(
      id,
      actor,
      PermissionEnum.USERS_LOCK,
      async (tx, user) => {
        if (user.role!.name === 'PATIENT')
          throw new ForbiddenException(
            'Không thể khóa hoặc mở khóa tài khoản bệnh nhân.',
          );
        if (user.status === input.status) return present(user, actor.id);
        const updated = await tx.user.update({
          where: { id },
          data: { status: input.status },
          select: USER_SELECT,
        });
        const after: AuditEvent['after'] = { status: input.status };
        if (input.status === UserStatus.LOCKED) {
          const revoked = await tx.authSession.updateMany({
            where: { userId: id, revokedAt: null },
            data: { revokedAt: new Date(), revocationReason: 'ACCOUNT_LOCKED' },
          });
          after.revokedSessions = revoked.count;
        }
        await this.record(
          tx,
          actor,
          id,
          input.status === UserStatus.LOCKED ? 'USER_LOCK' : 'USER_UNLOCK',
          { status: user.status },
          after,
          input.reason,
        );
        return present(updated, actor.id);
      },
    );
  }

  private record(
    tx: Prisma.TransactionClient,
    actor: CurrentUserDto,
    id: string,
    actionCode: string,
    before?: AuditEvent['before'],
    after?: AuditEvent['after'],
    reason?: string,
  ) {
    return this.audit.record(
      {
        actor: {
          type: 'USER',
          id: actor.id,
          name: actor.name,
          role: RoleEnum.ADMIN,
        },
        actionCode,
        module: 'USERS',
        targetType: 'USER',
        targetId: id,
        result: AuditLogResult.SUCCESS,
        before,
        after,
        reason,
      },
      tx,
    );
  }
}
