import { PublicSearchQueryDto } from '../../common/dto/public-search-query.dto';
import { normalizeSearch } from '../../common/utils/normalize-search';
import { sqlTable } from '../database/utils/sql-table';
import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  Prisma,
  UserStatus,
  RoleStatusEnum,
  UserRole,
  AuditLogResult,
} from '../../generated/prisma/client';
import { PaginationUtils } from '../../common/utils/pagination.utils';
import { PrismaService } from '../database/services/prisma.service';
import { AuditLogsService } from '../audit-logs/audit-logs.service';
import { CurrentUserDto } from '../users/dto/responses/current-user.dto';
import { RoleEnum } from '../users/constants/roles.constant';
import { CreateDoctorDto } from './dto/admin/create-doctor.dto';
import { UpdateDoctorDto } from './dto/admin/update-doctor.dto';
import { DoctorQueryDto } from './dto/doctor-query.dto';
import { CreateDoctorPauseDto } from './dto/admin/create-doctor-pause.dto';
import { DoctorPauseConflictException } from './doctor-pause-conflict.exception';
import { UsersService } from '../users/services/users.service';
import { SpecialtiesService } from '../specialties/specialties.service';
import { PermissionEnum } from '../authentication/constants/permissions.constant';

const PUBLIC_SELECT = {
  id: true,
  isActive: true,
  doctorCode: true,
  academicTitle: true,
  qualification: true,
  bio: true,
  avatarUrl: true,
  user: { select: { fullName: true } },
  specialty: { select: { id: true, code: true, name: true, roomCode: true } },
} satisfies Prisma.DoctorSelect;

const ADMIN_SELECT = {
  ...PUBLIC_SELECT,
  userId: true,
  specialtyId: true,
  licenseNumber: true,
  isActive: true,
  createdAt: true,
  updatedAt: true,
  user: { select: { fullName: true, email: true, phone: true, status: true } },
} satisfies Prisma.DoctorSelect;

const ACTIVE_DOCTOR_WHERE = {
  isActive: true,
  specialty: { isActive: true },
  user: {
    status: UserStatus.ACTIVE,
    deletedAt: null,
    role: {
      name: RoleEnum.DOCTOR,
      status: RoleStatusEnum.ACTIVE,
      deletedAt: null,
    },
  },
} satisfies Prisma.DoctorWhereInput;

function activePauseAt(now: Date): Prisma.LeaveRequestWhereInput {
  return {
    source: 'ADMIN_PAUSE',
    status: 'APPROVED',
    startsAt: { lte: now },
    OR: [{ endsAt: null }, { endsAt: { gt: now } }],
  };
}

@Injectable()
export class ProvidersService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auditLogs: AuditLogsService,
    private readonly users: UsersService,
    private readonly specialties: SpecialtiesService,
  ) {}

  async listSpecialties() {
    return this.specialties.listForDoctors();
  }

  async list(query: DoctorQueryDto, isAdmin: boolean) {
    const page = new PaginationUtils().extractSkipTakeFromPagination(query);
    const now = new Date();
    const activePause = activePauseAt(now);
    const where: Prisma.DoctorWhereInput = {
      ...(isAdmin
        ? {}
        : {
            ...ACTIVE_DOCTOR_WHERE,
            leaveRequests: { none: activePause },
          }),
      ...(query.specialtyId ? { specialtyId: query.specialtyId } : {}),
      ...(query.search
        ? {
            OR: [
              { doctorCode: { contains: query.search, mode: 'insensitive' } },
              {
                user: {
                  fullName: { contains: query.search, mode: 'insensitive' },
                },
              },
            ],
          }
        : {}),
    };
    const select = {
      ...(isAdmin ? ADMIN_SELECT : PUBLIC_SELECT),
      leaveRequests: {
        where: activePause,
        select: { id: true },
        take: 1,
      },
    } as const;
    const [items, total] = await this.prisma.$transaction([
      this.prisma.doctor.findMany({
        where,
        select,
        skip: page.skip,
        take: page.take,
        orderBy: [{ doctorCode: 'asc' }, { id: 'asc' }],
      }),
      this.prisma.doctor.count({ where }),
    ]);
    return {
      items: items.map(({ leaveRequests, ...doctor }) => ({
        ...doctor,
        isActive: doctor.isActive && leaveRequests.length === 0,
        isPaused: leaveRequests.length > 0,
      })),
      pagination: page.convertPaginationResponseDtoFromTotalRecords(total),
    };
  }

  async get(
    id: string,
    isAdmin: boolean,
    db: Pick<Prisma.TransactionClient, 'doctor'> = this.prisma,
  ) {
    const now = new Date();
    const activePause = activePauseAt(now);
    const doctor = await db.doctor.findFirst({
      where: {
        id,
        ...(isAdmin
          ? {}
          : {
              ...ACTIVE_DOCTOR_WHERE,
              leaveRequests: { none: activePause },
            }),
      },
      select: {
        ...(isAdmin ? ADMIN_SELECT : PUBLIC_SELECT),
        leaveRequests: {
          where: activePause,
          select: { id: true },
          take: 1,
        },
      },
    });
    if (!doctor) throw new NotFoundException('Doctor not found');
    const { leaveRequests, ...profile } = doctor;
    return {
      ...profile,
      isActive: profile.isActive && leaveRequests.length === 0,
      isPaused: leaveRequests.length > 0,
    };
  }

  private async assertSpecialty(tx: Prisma.TransactionClient, id: string) {
    if (!(await this.specialties.lock(tx, id)).isActive)
      throw new BadRequestException('Specialty is unavailable');
  }

  async createWithAccount(
    tx: Prisma.TransactionClient,
    input: CreateDoctorDto,
  ) {
    await this.assertSpecialty(tx, input.specialtyId);
    const { fullName, phone, ...profile } = input;
    const user = await this.users.createStaffAccount(tx, {
      fullName,
      phone,
      role: RoleEnum.DOCTOR,
    });
    return tx.doctor.create({
      data: { ...profile, userId: user.id },
      select: ADMIN_SELECT,
    });
  }

  async create(input: CreateDoctorDto, actor: CurrentUserDto) {
    return this.users.withLockedAccount(actor.id, async (tx) => {
      await this.users.assertAdminPermissions(tx, actor.id, [
        PermissionEnum.DOCTORS_WRITE,
        PermissionEnum.USERS_WRITE,
      ]);
      const doctor = await this.createWithAccount(tx, input);
      await this.auditLogs.record(
        {
          actor: {
            type: 'USER',
            id: actor.id,
            name: actor.name,
            role: UserRole.ADMIN,
          },
          actionCode: 'DOCTOR_CREATE',
          module: 'DOCTORS',
          targetType: 'DOCTOR',
          targetId: doctor.id,
          result: AuditLogResult.SUCCESS,
          after: {
            userId: doctor.userId,
            specialtyId: doctor.specialtyId,
            doctorCode: doctor.doctorCode,
            licenseNumber: doctor.licenseNumber,
            academicTitle: doctor.academicTitle,
            qualificationProvided: !!doctor.qualification,
            bioProvided: !!doctor.bio,
            avatarUrlProvided: !!doctor.avatarUrl,
          },
        },
        tx,
      );
      return { ...doctor, isPaused: false };
    });
  }

  async update(
    id: string,
    input: UpdateDoctorDto,
    actor: CurrentUserDto,
    transaction?: Prisma.TransactionClient,
  ) {
    if (!Object.keys(input).length)
      throw new BadRequestException('No changes supplied');
    if (input.specialtyId)
      input = { ...input, specialtyId: input.specialtyId.toLowerCase() };
    const action = async (tx: Prisma.TransactionClient) => {
      await this.lockDoctor(tx, id);
      const doctorBefore = await tx.doctor.findUnique({
        where: { id },
        select: {
          id: true,
          specialtyId: true,
          doctorCode: true,
          licenseNumber: true,
          academicTitle: true,
          qualification: true,
          bio: true,
          avatarUrl: true,
        },
      });
      if (!doctorBefore) throw new NotFoundException('Doctor not found');
      if (
        !(Object.keys(input) as (keyof UpdateDoctorDto)[]).some(
          (field) =>
            input[field] !== undefined && input[field] !== doctorBefore[field],
        )
      )
        return this.get(id, true, tx);
      if (input.specialtyId && input.specialtyId !== doctorBefore.specialtyId) {
        await this.assertSpecialty(tx, input.specialtyId);
        if (
          await tx.doctorSchedule.findFirst({
            where: {
              doctorId: id,
              endsAt: { gt: new Date() },
              status: { not: 'CANCELLED' },
            },
            select: { id: true },
          })
        )
          throw new ConflictException(
            'Resolve future schedules before changing specialty',
          );
      }
      const doctor = await tx.doctor.update({
        where: { id },
        data: input,
        select: {
          ...ADMIN_SELECT,
          leaveRequests: {
            where: activePauseAt(new Date()),
            select: { id: true },
            take: 1,
          },
        },
      });
      const before: Record<string, string | boolean | null> = {};
      const after: Record<string, string | boolean | null> = {};
      for (const field of [
        'specialtyId',
        'doctorCode',
        'licenseNumber',
        'academicTitle',
      ] as const) {
        if (
          input[field] !== undefined &&
          doctorBefore[field] !== doctor[field]
        ) {
          before[field] = doctorBefore[field];
          after[field] = doctor[field];
        }
      }
      for (const field of ['qualification', 'bio', 'avatarUrl'] as const) {
        if (
          input[field] !== undefined &&
          doctorBefore[field] !== doctor[field]
        ) {
          before[`${field}Changed`] = false;
          after[`${field}Changed`] = true;
        }
      }
      await this.auditLogs.record(
        {
          actor: {
            type: 'USER',
            id: actor.id,
            name: actor.name,
            role: UserRole.ADMIN,
          },
          actionCode: 'DOCTOR_UPDATE',
          module: 'DOCTORS',
          targetType: 'DOCTOR',
          targetId: doctor.id,
          result: AuditLogResult.SUCCESS,
          before,
          after,
        },
        tx,
      );
      const { leaveRequests, ...profile } = doctor;
      return {
        ...profile,
        isActive: profile.isActive && leaveRequests.length === 0,
        isPaused: leaveRequests.length > 0,
      };
    };
    return transaction ? action(transaction) : this.prisma.$transaction(action);
  }

  private async lockDoctor(tx: Prisma.TransactionClient, id: string) {
    const rows = await tx.$queryRaw<
      { id: string }[]
    >`SELECT id FROM ${sqlTable(this.prisma.schemaName, 'doctors')} WHERE id = ${id}::uuid FOR UPDATE`;
    if (!rows.length) throw new NotFoundException('Doctor not found');
  }

  private overlap(
    startsAt: Date,
    endsAt: Date | null,
  ): Prisma.LeaveRequestWhereInput {
    return {
      status: 'APPROVED',
      requestType: 'ABSENT',
      ...(endsAt ? { startsAt: { lt: endsAt } } : {}),
      OR: [{ endsAt: null }, { endsAt: { gt: startsAt } }],
    };
  }

  async listPauses(doctorId: string) {
    if (
      !(await this.prisma.doctor.findUnique({
        where: { id: doctorId },
        select: { id: true },
      }))
    )
      throw new NotFoundException('Doctor not found');
    return this.prisma.leaveRequest.findMany({
      where: { doctorId, source: 'ADMIN_PAUSE' },
      orderBy: [{ startsAt: 'desc' }, { id: 'desc' }],
    });
  }

  async createPause(
    doctorId: string,
    input: CreateDoctorPauseDto,
    actor: CurrentUserDto,
  ) {
    const startsAt = new Date(input.startsAt);
    const endsAt = input.endsAt ? new Date(input.endsAt) : null;
    if (
      !Number.isFinite(startsAt.getTime()) ||
      startsAt.getTime() <= Date.now() ||
      (endsAt && (!Number.isFinite(endsAt.getTime()) || endsAt <= startsAt))
    )
      throw new BadRequestException(
        'Pause must start in the future and end after it starts',
      );
    return this.prisma.$transaction(async (tx) => {
      await this.lockDoctor(tx, doctorId);
      if (startsAt.getTime() <= Date.now())
        throw new BadRequestException('Pause must start in the future');
      const affected = await tx.careSession.findMany({
        where: {
          status: { notIn: ['CANCELLED', 'NO_SHOW'] },
          appointment: { status: { not: 'CANCELLED' } },
          appointmentSlot: {
            doctorSchedule: { doctorId },
            endsAt: { gt: startsAt },
            ...(endsAt ? { startsAt: { lt: endsAt } } : {}),
          },
        },
        select: {
          id: true,
          status: true,
          appointment: {
            select: {
              id: true,
              appointmentCode: true,
              status: true,
              patient: {
                select: { id: true, patientCode: true, fullName: true },
              },
            },
          },
          appointmentSlot: {
            select: { id: true, startsAt: true, endsAt: true },
          },
        },
        orderBy: [{ appointmentSlot: { startsAt: 'asc' } }, { id: 'asc' }],
      });
      if (affected.length) throw new DoctorPauseConflictException(affected);
      if (
        await tx.leaveRequest.findFirst({
          where: { doctorId, ...this.overlap(startsAt, endsAt) },
          select: { id: true },
        })
      )
        throw new ConflictException('Pause overlaps an existing pause');
      const pause = await tx.leaveRequest.create({
        data: {
          doctorId,
          startsAt,
          endsAt,
          reason: input.reason?.trim() || 'Tạm dừng hoạt động',
          requestType: 'ABSENT',
          source: 'ADMIN_PAUSE',
          status: 'APPROVED',
          reviewedBy: actor.id,
          reviewedAt: new Date(),
        },
      });
      await this.auditLogs.record(
        {
          actor: {
            type: 'USER',
            id: actor.id,
            name: actor.name,
            role: UserRole.ADMIN,
          },
          actionCode: 'DOCTOR_PAUSE_SCHEDULE',
          module: 'DOCTORS',
          targetType: 'DOCTOR',
          targetId: doctorId,
          result: AuditLogResult.SUCCESS,
          after: {
            pauseId: pause.id,
            startsAt: pause.startsAt.toISOString(),
            endsAt: pause.endsAt?.toISOString() ?? null,
            status: pause.status,
            hasReason: !!input.reason?.trim(),
          },
        },
        tx,
      );
      return pause;
    });
  }

  async cancelPause(doctorId: string, pauseId: string, actor: CurrentUserDto) {
    return this.prisma.$transaction(async (tx) => {
      await this.lockDoctor(tx, doctorId);
      const pause = await tx.leaveRequest.findFirst({
        where: {
          id: pauseId,
          doctorId,
          source: 'ADMIN_PAUSE',
          status: 'APPROVED',
        },
      });
      if (!pause) throw new NotFoundException('Pause not found');
      if (pause.endsAt && pause.endsAt.getTime() <= Date.now())
        throw new ConflictException('Cannot cancel a completed pause');
      const doctor = await tx.doctor.findUniqueOrThrow({
        where: { id: doctorId },
        select: { specialtyId: true, isActive: true },
      });
      if (
        doctor.isActive &&
        !(await this.specialties.lock(tx, doctor.specialtyId)).isActive
      )
        throw new ConflictException(
          'Reactivate the specialty before cancelling a doctor pause',
        );
      const updated = await tx.leaveRequest.update({
        where: { id: pauseId },
        data: { status: 'CANCELLED' },
      });
      await this.auditLogs.record(
        {
          actor: {
            type: 'USER',
            id: actor.id,
            name: actor.name,
            role: UserRole.ADMIN,
          },
          actionCode: 'DOCTOR_PAUSE_CANCEL',
          module: 'DOCTORS',
          targetType: 'DOCTOR',
          targetId: doctorId,
          result: AuditLogResult.SUCCESS,
          before: {
            pauseId: pause.id,
            startsAt: pause.startsAt.toISOString(),
            endsAt: pause.endsAt?.toISOString() ?? null,
            status: pause.status,
          },
          after: {
            pauseId: updated.id,
            status: updated.status,
            cancelledAt: updated.updatedAt.toISOString(),
          },
        },
        tx,
      );
      return updated;
    });
  }

  // Booking must call this inside its transaction and retain the doctor lock until commit.
  async assertBookable(
    tx: Prisma.TransactionClient,
    doctorId: string,
    startsAt: Date,
    endsAt: Date,
  ): Promise<void> {
    if (
      !Number.isFinite(startsAt.getTime()) ||
      !Number.isFinite(endsAt.getTime()) ||
      endsAt <= startsAt
    )
      throw new BadRequestException('Invalid booking interval');
    await this.lockDoctor(tx, doctorId);
    const available = await tx.doctor.findFirst({
      where: {
        id: doctorId,
        ...ACTIVE_DOCTOR_WHERE,
      },
      select: { id: true },
    });
    if (
      !available ||
      (await tx.leaveRequest.findFirst({
        where: { doctorId, ...this.overlap(startsAt, endsAt) },
        select: { id: true },
      }))
    )
      throw new ConflictException('Doctor is unavailable for this interval');
  }
  async search(query: PublicSearchQueryDto) {
    let nameIds: string[] | undefined;
    if (query.q?.trim()) {
      // Parameterized SQL supports accent-insensitive names without a DB extension.
      const term = normalizeSearch(query.q).replace(/[\\%_]/g, '\\$&');
      const matches = await this.prisma.$queryRaw<{ id: string }[]>(Prisma.sql`
        SELECT d.id FROM ${sqlTable(this.prisma.schemaName, 'doctors')} d
        JOIN ${sqlTable(this.prisma.schemaName, 'users')} u ON u.id = d.user_id
        WHERE translate(lower(u.full_name),
          'àáạảãâầấậẩẫăằắặẳẵèéẹẻẽêềếệểễìíịỉĩòóọỏõôồốộổỗơờớợởỡùúụủũưừứựửữỳýỵỷỹđ',
          'aaaaaaaaaaaaaaaaaeeeeeeeeeeeiiiiiooooooooooooooooouuuuuuuuuuuyyyyyd')
          LIKE ${`%${term}%`}
      `);
      nameIds = matches.map((item) => item.id);
    }
    const where: Prisma.DoctorWhereInput = {
      ...ACTIVE_DOCTOR_WHERE,
      leaveRequests: { none: activePauseAt(new Date()) },
      ...(query.specialtyId ? { specialtyId: query.specialtyId } : {}),
      ...(query.doctorId ? { id: query.doctorId } : {}),
      ...(nameIds ? { AND: [{ id: { in: nameIds } }] } : {}),
    };
    const [items, total] = await Promise.all([
      this.prisma.doctor.findMany({
        where,
        skip: (query.page - 1) * query.limit,
        take: query.limit,
        orderBy: [{ user: { fullName: 'asc' } }, { id: 'asc' }],
        select: {
          id: true,
          doctorCode: true,
          academicTitle: true,
          qualification: true,
          bio: true,
          avatarUrl: true,
          user: { select: { fullName: true } },
          specialty: { select: { id: true, name: true, roomCode: true } },
        },
      }),
      this.prisma.doctor.count({ where }),
    ]);
    return {
      items: items.map(({ user, ...doctor }) => ({
        ...doctor,
        fullName: user.fullName,
      })),
      total,
      page: query.page,
      limit: query.limit,
    };
  }
}
