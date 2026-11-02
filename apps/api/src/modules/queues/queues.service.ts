import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { Optional } from '@nestjs/common';
import type { Prisma } from '../../generated/prisma/client';
import {
  CareSessionPriorityType,
  CareSessionStatus,
  UserRole,
} from '../../generated/prisma/enums';
import { clinicDate, clinicDateString } from '../../common/utils/clinic-date';
import { AuditLogsService } from '../audit-logs/audit-logs.service';
import { PrismaService } from '../database/services/prisma.service';
import type { CurrentUserDto } from '../users/dto/responses/current-user.dto';
import { QueueBoardQueryDto } from './dto/queue-board-query.dto';

const QUEUE_PRIORITY_GROUPS: readonly (readonly CareSessionPriorityType[])[] = [
  [CareSessionPriorityType.RETURNING_LAB, CareSessionPriorityType.REFERRAL],
  [CareSessionPriorityType.APPOINTMENT_ON_TIME],
  [CareSessionPriorityType.WALK_IN, CareSessionPriorityType.APPOINTMENT_LATE],
];
const CALLABLE_STATUSES = [
  CareSessionStatus.WAITING,
  CareSessionStatus.CHECKED_IN,
  CareSessionStatus.SKIPPED,
] as const;
const BOARD_STATUSES = [
  CareSessionStatus.CHECKED_IN,
  CareSessionStatus.WAITING,
  CareSessionStatus.CALLED,
  CareSessionStatus.SKIPPED,
  CareSessionStatus.NO_SHOW,
  CareSessionStatus.IN_CONSULTATION,
] as const;
const DOCTOR_QUEUE_STATUSES = [
  ...CALLABLE_STATUSES,
  CareSessionStatus.CALLED,
  CareSessionStatus.IN_CONSULTATION,
] as const;
const SKIP_WAIT_SECONDS = 180;
const QUEUE_INCLUDE = {
  appointment: {
    select: {
      id: true,
      appointmentCode: true,
      reason: true,
      patient: {
        select: {
          patientCode: true,
          fullName: true,
        },
      },
    },
  },
  specialty: { select: { id: true, name: true, roomCode: true } },
  appointmentSlot: {
    include: {
      doctorSchedule: {
        include: {
          doctor: {
            select: {
              id: true,
              userId: true,
              user: { select: { fullName: true } },
            },
          },
        },
      },
    },
  },
} satisfies Prisma.CareSessionInclude;

type QueueSession = Prisma.CareSessionGetPayload<{
  include: typeof QUEUE_INCLUDE;
}>;

export interface QueueSortItem {
  id: string;
  status: CareSessionStatus;
  priorityType: CareSessionPriorityType | null;
  checkedInAt: Date | null;
  queueNumber: number | null;
  skippedAt: Date | null;
  calledAt?: Date | null;
}

export interface QueueCallability {
  canCall: boolean;
  cannotCallReason: string | null;
}

export interface QueueActionability extends QueueCallability {
  canAct: boolean;
  canStart: boolean;
  cannotStartReason: string | null;
  canComplete: boolean;
  cannotCompleteReason: string | null;
  canSkip: boolean;
  cannotSkipReason: string | null;
  canRestore: boolean;
  cannotRestoreReason: string | null;
}

function priorityGroup(priorityType: CareSessionPriorityType | null): number {
  const index = QUEUE_PRIORITY_GROUPS.findIndex((group) =>
    priorityType ? group.includes(priorityType) : false,
  );
  return index < 0 ? QUEUE_PRIORITY_GROUPS.length : index;
}

export function compareQueueSessions(
  first: QueueSortItem,
  second: QueueSortItem,
): number {
  const firstSkipped = first.status === CareSessionStatus.SKIPPED;
  const secondSkipped = second.status === CareSessionStatus.SKIPPED;
  if (firstSkipped !== secondSkipped) return firstSkipped ? -1 : 1;
  if (firstSkipped && secondSkipped) {
    const skippedAtOrder =
      (first.skippedAt?.getTime() ?? Number.MAX_SAFE_INTEGER) -
      (second.skippedAt?.getTime() ?? Number.MAX_SAFE_INTEGER);
    if (skippedAtOrder !== 0) return skippedAtOrder;
  }
  const groupOrder =
    priorityGroup(first.priorityType) - priorityGroup(second.priorityType);
  if (groupOrder !== 0) return groupOrder;
  const checkedInOrder =
    (first.checkedInAt?.getTime() ?? Number.MAX_SAFE_INTEGER) -
    (second.checkedInAt?.getTime() ?? Number.MAX_SAFE_INTEGER);
  if (checkedInOrder !== 0) return checkedInOrder;
  return (
    (first.queueNumber ?? Number.MAX_SAFE_INTEGER) -
      (second.queueNumber ?? Number.MAX_SAFE_INTEGER) ||
    first.id.localeCompare(second.id)
  );
}

export function getQueueCallability(
  current: QueueSortItem,
  doctorQueue: readonly QueueSortItem[],
): QueueCallability {
  if (
    !CALLABLE_STATUSES.includes(
      current.status as (typeof CALLABLE_STATUSES)[number],
    )
  )
    return {
      canCall: false,
      cannotCallReason:
        '\u0054r\u1ea1ng th\u00e1i l\u01b0\u1ee3t kh\u00e1m kh\u00f4ng cho ph\u00e9p g\u1ecdi',
    };
  if (
    doctorQueue.some(
      (session) =>
        [CareSessionStatus.CALLED, CareSessionStatus.IN_CONSULTATION].includes(
          session.status as
            | typeof CareSessionStatus.CALLED
            | typeof CareSessionStatus.IN_CONSULTATION,
        ) && session.id !== current.id,
    )
  )
    return {
      canCall: false,
      cannotCallReason:
        'B\u00e1c s\u0129 \u0111ang c\u00f3 b\u1ec7nh nh\u00e2n \u0111\u01b0\u1ee3c g\u1ecdi',
    };
  const next = [...doctorQueue]
    .filter((session) =>
      CALLABLE_STATUSES.includes(
        session.status as (typeof CALLABLE_STATUSES)[number],
      ),
    )
    .sort(compareQueueSessions)[0];
  if (!next || next.id !== current.id)
    return {
      canCall: false,
      cannotCallReason:
        'Ch\u01b0a \u0111\u1ebfn l\u01b0\u1ee3t: c\u00f2n b\u1ec7nh nh\u00e2n \u0111\u1ee9ng tr\u01b0\u1edbc',
    };
  return { canCall: true, cannotCallReason: null };
}

export function getQueueActionability(
  current: QueueSortItem,
  doctorQueue: readonly QueueSortItem[],
  userRole: string,
  isOwner: boolean,
  now: Date,
): QueueActionability {
  if (userRole === 'RECEPTIONIST') {
    return {
      canAct: false,
      canCall: false,
      cannotCallReason: 'Chỉ xem',
      canStart: false,
      cannotStartReason: 'Chỉ xem',
      canComplete: false,
      cannotCompleteReason: 'Chỉ xem',
      canSkip: false,
      cannotSkipReason: 'Chỉ xem',
      canRestore: false,
      cannotRestoreReason: 'Chỉ xem',
    };
  }
  if (!isOwner && userRole === 'DOCTOR') {
    return {
      canAct: false,
      canCall: false,
      cannotCallReason: 'Bác sĩ chỉ được thao tác hàng chờ của mình',
      canStart: false,
      cannotStartReason: 'Bác sĩ chỉ được thao tác hàng chờ của mình',
      canComplete: false,
      cannotCompleteReason: 'Bác sĩ chỉ được thao tác hàng chờ của mình',
      canSkip: false,
      cannotSkipReason: 'Bác sĩ chỉ được thao tác hàng chờ của mình',
      canRestore: false,
      cannotRestoreReason: 'Bác sĩ chỉ được thao tác hàng chờ của mình',
    };
  }
  if (current.status === CareSessionStatus.NO_SHOW) {
    return {
      canAct: true,
      canCall: false,
      cannotCallReason: 'Bệnh nhân vắng mặt sau 3 lần bỏ qua',
      canStart: false,
      cannotStartReason: 'Bệnh nhân vắng mặt sau 3 lần bỏ qua',
      canComplete: false,
      cannotCompleteReason: 'Bệnh nhân vắng mặt sau 3 lần bỏ qua',
      canSkip: false,
      cannotSkipReason: 'Bệnh nhân vắng mặt sau 3 lần bỏ qua',
      canRestore: false,
      cannotRestoreReason: 'Bệnh nhân vắng mặt sau 3 lần bỏ qua',
    };
  }
  const callability = getQueueCallability(current, doctorQueue);
  const canStart =
    current.status === CareSessionStatus.CALLED &&
    !doctorQueue.some(
      (session) => session.status === CareSessionStatus.IN_CONSULTATION,
    );
  const canComplete = current.status === CareSessionStatus.IN_CONSULTATION;
  const canSkip =
    current.status === CareSessionStatus.CALLED &&
    skipAllowedInSeconds(current.calledAt ?? null, now) === 0;
  const canRestore = current.status === CareSessionStatus.SKIPPED;
  return {
    canAct: true,
    ...callability,
    canStart,
    cannotStartReason: canStart
      ? null
      : current.status !== CareSessionStatus.CALLED
        ? 'Chỉ có thể bắt đầu lượt đang được gọi'
        : 'Bác sĩ đang có phiên khám khác',
    canComplete,
    cannotCompleteReason: canComplete
      ? null
      : 'Chỉ có thể hoàn thành lượt đang khám',
    canSkip,
    cannotSkipReason: canSkip
      ? null
      : current.status !== CareSessionStatus.CALLED
        ? 'Chỉ có thể bỏ qua lượt đang được gọi'
        : `Bệnh nhân chưa được gọi đủ ba phút. Còn ${skipAllowedInSeconds(current.calledAt ?? null, now)} giây nữa.`,
    canRestore,
    cannotRestoreReason: canRestore
      ? null
      : 'Chỉ có thể đưa lượt đã bỏ qua trở lại',
  };
}

export function assertQueueCanCall(
  current: QueueSortItem,
  doctorQueue: readonly QueueSortItem[],
): void {
  const callability = getQueueCallability(current, doctorQueue);
  if (!callability.canCall)
    throw new ConflictException(callability.cannotCallReason);
}

function sortQueueSessions(sessions: QueueSession[]): QueueSession[] {
  return [...sessions].sort((first, second) => {
    const doctorOrder =
      first.appointmentSlot.doctorSchedule.doctor.id.localeCompare(
        second.appointmentSlot.doctorSchedule.doctor.id,
      );
    return doctorOrder || compareQueueSessions(first, second);
  });
}

export function skipAllowedInSeconds(calledAt: Date | null, now: Date): number {
  if (!calledAt) return SKIP_WAIT_SECONDS;
  return Math.max(
    0,
    Math.ceil(
      (SKIP_WAIT_SECONDS * 1000 - (now.getTime() - calledAt.getTime())) / 1000,
    ),
  );
}

export function getStatusAfterSkip(skipCount: number): CareSessionStatus {
  return skipCount >= 3 ? CareSessionStatus.NO_SHOW : CareSessionStatus.SKIPPED;
}

export function isDoctorAvailableForAutoCall(
  statuses: readonly CareSessionStatus[],
): boolean {
  return !statuses.some(
    (status) =>
      status === CareSessionStatus.CALLED ||
      status === CareSessionStatus.IN_CONSULTATION,
  );
}

@Injectable()
export class QueuesService {
  constructor(
    private readonly prisma: PrismaService,
    @Optional() private readonly auditLogs?: AuditLogsService,
  ) {}

  async board(query: QueueBoardQueryDto, user: CurrentUserDto) {
    return this.withDatabaseErrors(async () => {
      const { dateStart } = this.dateRange(query.date);
      const currentDoctorId = await this.currentDoctorId(user);
      if (user.role === 'RECEPTIONIST' && !query.doctorId)
        throw new BadRequestException(
          'Lễ tân phải chọn bác sĩ để xem hàng chờ.',
        );
      const doctorId = currentDoctorId ?? query.doctorId;
      const search = query.search?.trim();
      const numberSearch = search?.match(/\d+/)?.[0];
      const numericSearch = numberSearch ? Number(numberSearch) : null;
      const sessions = await this.prisma.careSession.findMany({
        where: {
          queueDate: dateStart,
          status: { in: [...BOARD_STATUSES] },
          ...(query.specialtyId ? { specialtyId: query.specialtyId } : {}),
          ...(doctorId
            ? { appointmentSlot: { doctorSchedule: { doctorId } } }
            : {}),
          ...(search
            ? {
                OR: [
                  {
                    appointment: {
                      patient: {
                        OR: [
                          {
                            fullName: { contains: search, mode: 'insensitive' },
                          },
                          {
                            patientCode: {
                              contains: search,
                              mode: 'insensitive',
                            },
                          },
                        ],
                      },
                    },
                  },
                  {
                    appointment: {
                      appointmentCode: {
                        contains: search,
                        mode: 'insensitive',
                      },
                    },
                  },
                  ...(numericSearch === null
                    ? []
                    : [{ queueNumber: numericSearch }]),
                ],
              }
            : {}),
        },
        include: QUEUE_INCLUDE,
        orderBy: [{ queueDate: 'asc' }, { queueNumber: 'asc' }, { id: 'asc' }],
      });
      const now = new Date();
      const doctorIds = [
        ...new Set(
          sessions.map(
            (session) => session.appointmentSlot.doctorSchedule.doctor.id,
          ),
        ),
      ];
      const doctorQueues = await Promise.all(
        doctorIds.map(
          async (id) =>
            [
              id,
              await this.prisma.careSession.findMany({
                where: {
                  queueDate: dateStart,
                  status: {
                    in: [...DOCTOR_QUEUE_STATUSES],
                  },
                  appointmentSlot: { doctorSchedule: { doctorId: id } },
                },
                include: QUEUE_INCLUDE,
              }),
            ] as const,
        ),
      );
      const queueByDoctor = new Map(doctorQueues);
      const items = sortQueueSessions(sessions).map((session) => {
        const doctorId = session.appointmentSlot.doctorSchedule.doctor.id;
        return this.presentItem(
          session,
          now,
          getQueueActionability(
            session,
            queueByDoctor.get(doctorId) ?? [],
            user.role,
            user.role !== 'DOCTOR' ||
              session.appointmentSlot.doctorSchedule.doctor.userId === user.id,
            now,
          ),
        );
      });
      return {
        date: clinicDateString(dateStart),
        timeZone: 'Asia/Ho_Chi_Minh',
        counts: {
          waiting: sessions.filter((session) =>
            [CareSessionStatus.CHECKED_IN, CareSessionStatus.WAITING].includes(
              session.status as
                | typeof CareSessionStatus.CHECKED_IN
                | typeof CareSessionStatus.WAITING,
            ),
          ).length,
          called: sessions.filter(
            ({ status }) => status === CareSessionStatus.CALLED,
          ).length,
          inConsultation: sessions.filter(
            ({ status }) => status === CareSessionStatus.IN_CONSULTATION,
          ).length,
          skipped: sessions.filter((session) =>
            [CareSessionStatus.SKIPPED, CareSessionStatus.NO_SHOW].includes(
              session.status as
                | typeof CareSessionStatus.SKIPPED
                | typeof CareSessionStatus.NO_SHOW,
            ),
          ).length,
        },
        items,
      };
    });
  }

  async call(careSessionId: string, user: CurrentUserDto) {
    const date = clinicDateString(new Date());
    try {
      await this.prisma.$transaction(
        async (tx) => {
          const session = await this.lockSession(tx, careSessionId);
          const doctorId = session.appointmentSlot.doctorSchedule.doctor.id;
          this.assertDoctorAccess(
            user,
            session.appointmentSlot.doctorSchedule.doctor.userId,
          );
          await this.lockDoctorQueue(tx, doctorId);
          const current = await this.readSession(tx, careSessionId);
          const candidates = await this.loadDoctorQueue(
            tx,
            doctorId,
            current.queueDate,
          );
          assertQueueCanCall(current, candidates);
          await tx.careSession.update({
            where: { id: current.id },
            data: { status: CareSessionStatus.CALLED, calledAt: new Date() },
          });
        },
        { isolationLevel: 'Serializable', timeout: 15000 },
      );
      return { board: await this.board({ date }, user) };
    } catch (error) {
      this.throwQueueError(error);
    }
  }

  async startConsultation(careSessionId: string, user: CurrentUserDto) {
    const date = clinicDateString(new Date());
    try {
      await this.prisma.$transaction(
        async (tx) => {
          const target = await tx.careSession.findUnique({
            where: { id: careSessionId },
            select: {
              appointmentSlot: {
                select: {
                  doctorSchedule: {
                    select: { doctorId: true },
                  },
                },
              },
            },
          });
          if (!target) throw new NotFoundException('Không tìm thấy lượt khám.');
          await this.lockDoctorQueue(
            tx,
            target.appointmentSlot.doctorSchedule.doctorId,
          );
          const session = await this.lockSession(tx, careSessionId);
          const doctor = session.appointmentSlot.doctorSchedule.doctor;
          this.assertDoctorAccess(user, doctor.userId);
          const current = await this.readSession(tx, careSessionId);
          if (current.status !== CareSessionStatus.CALLED)
            throw new ConflictException(
              'Chỉ có thể bắt đầu lượt đang được gọi.',
            );
          const active = await tx.careSession.findFirst({
            where: {
              queueDate: current.queueDate,
              status: CareSessionStatus.IN_CONSULTATION,
              appointmentSlot: { doctorSchedule: { doctorId: doctor.id } },
              id: { not: current.id },
            },
            select: { id: true },
          });
          if (active)
            throw new ConflictException('Bác sĩ đang có một phiên khám khác.');
          const startedAt = new Date();
          await tx.careSession.update({
            where: { id: current.id },
            data: { status: CareSessionStatus.IN_CONSULTATION },
          });
          await tx.consultation.upsert({
            where: { careSessionId: current.id },
            create: { careSessionId: current.id, startedAt },
            update: { startedAt },
          });
          await this.auditLogs?.record(
            {
              actor: {
                type: 'USER',
                id: user.id,
                name: user.name,
                role: user.role as import('../../generated/prisma/enums').UserRole,
              },
              actionCode: 'QUEUE_START_CONSULTATION',
              module: 'QUEUES',
              targetType: 'CARE_SESSION',
              targetId: current.id,
              result: 'SUCCESS',
              after: { status: CareSessionStatus.IN_CONSULTATION },
            },
            tx,
          );
        },
        { isolationLevel: 'Serializable', timeout: 15000 },
      );
      return { board: await this.board({ date }, user) };
    } catch (error) {
      await this.throwTransitionError(
        error,
        careSessionId,
        CareSessionStatus.IN_CONSULTATION,
        'Lượt khám vừa được bắt đầu bởi yêu cầu khác.',
      );
    }
  }

  async start(careSessionId: string, user: CurrentUserDto) {
    return this.startConsultation(careSessionId, user);
  }

  async complete(
    careSessionId: string,
    user: CurrentUserDto,
    expectedUpdatedAt: string,
  ) {
    if (!expectedUpdatedAt)
      throw new BadRequestException(['expectedUpdatedAt should not be empty']);
    const date = clinicDateString(new Date());
    try {
      await this.prisma.$transaction(
        async (tx) => {
          const target = await tx.careSession.findUnique({
            where: { id: careSessionId },
            select: {
              appointmentSlot: {
                select: {
                  doctorSchedule: {
                    select: { doctorId: true },
                  },
                },
              },
            },
          });
          if (!target) throw new NotFoundException('Không tìm thấy lượt khám.');
          await this.lockDoctorQueue(
            tx,
            target.appointmentSlot.doctorSchedule.doctorId,
          );
          const session = await this.lockSession(tx, careSessionId);
          const doctor = session.appointmentSlot.doctorSchedule.doctor;
          this.assertDoctorAccess(user, doctor.userId);
          const current = await this.readSession(tx, careSessionId);
          if (current.status !== CareSessionStatus.IN_CONSULTATION)
            throw new ConflictException(
              'Chỉ có thể hoàn thành lượt đang khám.',
            );
          const consultation = await tx.consultation.findUnique({
            where: { careSessionId: current.id },
            include: { diagnoses: true },
          });
          if (consultation?.updatedAt.toISOString() !== expectedUpdatedAt)
            throw new ConflictException(
              'Consultation was updated. Reload before completing.',
            );
          const missingFields = [
            ...(current.appointment.reason?.trim() ? [] : ['complaint']),
            ...(consultation?.clinicalNotes?.trim() ? [] : ['clinicalNotes']),
            ...(consultation?.diagnoses.some((diagnosis) => diagnosis.isPrimary)
              ? []
              : ['diagnosis']),
          ];
          if (missingFields.length)
            throw new BadRequestException(
              missingFields.map((field) => `${field} is required`),
            );
          const completedAt = new Date();
          await tx.careSession.update({
            where: { id: current.id },
            data: { status: CareSessionStatus.COMPLETED },
          });
          await tx.consultation.upsert({
            where: { careSessionId: current.id },
            create: {
              careSessionId: current.id,
              completedAt,
              lockedAt: completedAt,
            },
            update: { completedAt, lockedAt: completedAt },
          });
          await this.auditLogs?.record(
            {
              actor: {
                type: 'USER',
                id: user.id,
                name: user.name,
                role: user.role as import('../../generated/prisma/enums').UserRole,
              },
              actionCode: 'QUEUE_COMPLETE_CONSULTATION',
              module: 'QUEUES',
              targetType: 'CARE_SESSION',
              targetId: current.id,
              result: 'SUCCESS',
              after: { status: CareSessionStatus.COMPLETED },
            },
            tx,
          );
        },
        { isolationLevel: 'Serializable', timeout: 15000 },
      );
      return { board: await this.board({ date }, user) };
    } catch (error) {
      await this.throwTransitionError(
        error,
        careSessionId,
        CareSessionStatus.COMPLETED,
        'Lượt khám vừa được hoàn thành bởi yêu cầu khác.',
      );
    }
  }

  async assertCanAccessSession(
    careSessionId: string,
    user: CurrentUserDto,
    tx: Prisma.TransactionClient = this.prisma,
  ) {
    const session = await tx.careSession.findUnique({
      where: { id: careSessionId },
      select: {
        appointmentSlot: {
          select: {
            doctorSchedule: {
              select: { doctor: { select: { userId: true } } },
            },
          },
        },
      },
    });
    if (!session) throw new NotFoundException('Không tìm thấy lượt khám.');
    if (
      user.role !== UserRole.ADMIN &&
      session.appointmentSlot.doctorSchedule.doctor.userId !== user.id
    )
      throw new ForbiddenException(
        'Bạn không có quyền truy cập lượt khám này.',
      );
  }

  async skip(careSessionId: string, user: CurrentUserDto) {
    const date = clinicDateString(new Date());
    try {
      await this.prisma.$transaction(
        async (tx) => {
          const session = await this.lockSession(tx, careSessionId);
          const doctor = session.appointmentSlot.doctorSchedule.doctor;
          this.assertDoctorAccess(user, doctor.userId);
          await this.lockDoctorQueue(tx, doctor.id);
          const current = await this.readSession(tx, careSessionId);
          if (current.status !== CareSessionStatus.CALLED)
            throw new ConflictException(
              'Chá»‰ cÃ³ thá»ƒ bá» qua bá»‡nh nhÃ¢n Ä‘ang Ä‘Æ°á»£c gá»i.',
            );
          const now = new Date();
          const remainingSeconds = skipAllowedInSeconds(current.calledAt, now);
          if (remainingSeconds > 0)
            throw new ConflictException(
              `Bá»‡nh nhÃ¢n chÆ°a Ä‘Æ°á»£c gá»i Ä‘á»§ ba phÃºt. CÃ²n ${remainingSeconds} giÃ¢y ná»¯a má»›i Ä‘Æ°á»£c bá» qua.`,
            );
          const nextSkipCount = current.skipCount + 1;
          const nextStatus = getStatusAfterSkip(nextSkipCount);
          await tx.careSession.update({
            where: { id: current.id },
            data: {
              skipCount: nextSkipCount,
              status: nextStatus,
              skippedAt: new Date(),
            },
          });
          const activePatients = await tx.careSession.findMany({
            where: {
              queueDate: current.queueDate,
              appointmentSlot: { doctorSchedule: { doctorId: doctor.id } },
              status: {
                in: [
                  CareSessionStatus.CALLED,
                  CareSessionStatus.IN_CONSULTATION,
                ],
              },
              id: { not: current.id },
            },
            select: { status: true },
          });
          if (
            isDoctorAvailableForAutoCall(
              activePatients.map(({ status }) => status),
            )
          ) {
            const next = sortQueueSessions(
              await this.loadDoctorQueue(tx, doctor.id, current.queueDate),
            ).find(
              (candidate) =>
                candidate.id !== current.id &&
                [
                  CareSessionStatus.CHECKED_IN,
                  CareSessionStatus.WAITING,
                ].includes(
                  candidate.status as
                    | typeof CareSessionStatus.CHECKED_IN
                    | typeof CareSessionStatus.WAITING,
                ),
            );
            if (next)
              await tx.careSession.update({
                where: { id: next.id },
                data: {
                  status: CareSessionStatus.CALLED,
                  calledAt: new Date(),
                },
              });
          }
        },
        { isolationLevel: 'Serializable', timeout: 15000 },
      );
      return { board: await this.board({ date }, user) };
    } catch (error) {
      this.throwQueueError(error);
    }
  }

  async restore(careSessionId: string, user: CurrentUserDto) {
    const date = clinicDateString(new Date());
    try {
      await this.prisma.$transaction(
        async (tx) => {
          const session = await this.lockSession(tx, careSessionId);
          const doctor = session.appointmentSlot.doctorSchedule.doctor;
          this.assertDoctorAccess(user, doctor.userId);
          await this.lockDoctorQueue(tx, doctor.id);
          const current = await this.readSession(tx, careSessionId);
          if (current.status !== CareSessionStatus.SKIPPED)
            throw new ConflictException(
              'Chá»‰ cÃ³ thá»ƒ Ä‘Æ°a bá»‡nh nhÃ¢n Ä‘ang á»Ÿ tráº¡ng thÃ¡i bá» qua trá»Ÿ láº¡i.',
            );
          await tx.careSession.update({
            where: { id: current.id },
            data: { status: CareSessionStatus.WAITING },
          });
        },
        { isolationLevel: 'Serializable', timeout: 15000 },
      );
      return { board: await this.board({ date }, user) };
    } catch (error) {
      this.throwQueueError(error);
    }
  }

  async status(
    careSessionId: string,
    dateValue: string | undefined,
    user: CurrentUserDto,
  ) {
    return this.withDatabaseErrors(async () => {
      const session = await this.prisma.careSession.findUnique({
        where: { id: careSessionId },
        include: QUEUE_INCLUDE,
      });
      if (!session)
        throw new NotFoundException('KhÃ´ng tÃ¬m tháº¥y lÆ°á»£t khÃ¡m.');
      this.assertDoctorAccess(
        user,
        session.appointmentSlot.doctorSchedule.doctor.userId,
      );
      const now = new Date();
      const doctorQueue = await this.prisma.careSession.findMany({
        where: {
          queueDate: session.queueDate,
          status: { in: [...DOCTOR_QUEUE_STATUSES] },
          appointmentSlot: {
            doctorSchedule: {
              doctorId: session.appointmentSlot.doctorSchedule.doctor.id,
            },
          },
        },
        include: QUEUE_INCLUDE,
      });
      return {
        ...this.presentItem(
          session,
          now,
          getQueueActionability(
            session,
            doctorQueue,
            user.role,
            user.role !== 'DOCTOR' ||
              session.appointmentSlot.doctorSchedule.doctor.userId === user.id,
            now,
          ),
        ),
        date: clinicDateString(clinicDate(dateValue)),
      };
    });
  }

  private async loadDoctorQueue(
    tx: Prisma.TransactionClient,
    doctorId: string,
    queueDate: Date | null,
  ): Promise<QueueSession[]> {
    return tx.careSession.findMany({
      where: {
        queueDate,
        status: { in: [...DOCTOR_QUEUE_STATUSES] },
        appointmentSlot: { doctorSchedule: { doctorId } },
      },
      include: QUEUE_INCLUDE,
    });
  }

  private async lockSession(
    tx: Prisma.TransactionClient,
    careSessionId: string,
  ) {
    await tx.$queryRaw<Array<{ id: string }>>`
      SELECT id FROM care_sessions WHERE id = ${careSessionId}::uuid FOR UPDATE
    `;
    const session = await tx.careSession.findUnique({
      where: { id: careSessionId },
      include: QUEUE_INCLUDE,
    });
    if (!session)
      throw new NotFoundException('KhÃ´ng tÃ¬m tháº¥y lÆ°á»£t khÃ¡m.');
    return session;
  }

  private async readSession(
    tx: Prisma.TransactionClient,
    careSessionId: string,
  ) {
    const session = await tx.careSession.findUnique({
      where: { id: careSessionId },
      include: QUEUE_INCLUDE,
    });
    if (!session)
      throw new NotFoundException('KhÃ´ng tÃ¬m tháº¥y lÆ°á»£t khÃ¡m.');
    return session;
  }

  private async lockDoctorQueue(
    tx: Prisma.TransactionClient,
    doctorId: string,
  ) {
    await tx.$queryRaw<Array<{ is_locked: boolean }>>`
      SELECT pg_advisory_xact_lock(hashtext('MEDICONNECT_QUEUE'), hashtext(${doctorId})) IS NULL AS is_locked
    `;
  }

  private async currentDoctorId(user: CurrentUserDto): Promise<string | null> {
    if (user.role !== 'DOCTOR') return null;
    const doctor = await this.prisma.doctor.findUnique({
      where: { userId: user.id },
      select: { id: true },
    });
    if (!doctor)
      throw new ForbiddenException(
        'TÃ i khoáº£n bÃ¡c sÄ© chÆ°a Ä‘Æ°á»£c gáº¯n há»“ sÆ¡ bÃ¡c sÄ©.',
      );
    return doctor.id;
  }

  private assertDoctorAccess(user: CurrentUserDto, doctorUserId: string) {
    if (user.role === 'DOCTOR' && user.id !== doctorUserId)
      throw new ForbiddenException(
        'BÃ¡c sÄ© chá»‰ Ä‘Æ°á»£c thao tÃ¡c hÃ ng chá» cá»§a mÃ¬nh.',
      );
  }

  private dateRange(value?: string) {
    const dateStart = clinicDate(value);
    return { dateStart, dateEnd: new Date(dateStart.getTime() + 86400000) };
  }

  private presentItem(
    session: QueueSession,
    now: Date,
    actionability: QueueActionability = {
      canAct: false,
      canCall: false,
      cannotCallReason: null,
      canStart: false,
      cannotStartReason: null,
      canComplete: false,
      cannotCompleteReason: null,
      canSkip: false,
      cannotSkipReason: null,
      canRestore: false,
      cannotRestoreReason: null,
    },
  ) {
    const doctor = session.appointmentSlot.doctorSchedule.doctor;
    const startsAt = session.appointmentSlot.startsAt;
    const isLate = startsAt.getTime() < now.getTime();
    return {
      careSessionId: session.id,
      appointmentId: session.appointment.id,
      appointmentCode: session.appointment.appointmentCode,
      patientCode: session.appointment.patient.patientCode,
      patientName: session.appointment.patient.fullName,
      queueNumber: session.queueNumber,
      queueDisplayNumber:
        session.queueNumber === null
          ? null
          : `A-${String(session.queueNumber).padStart(3, '0')}`,
      appointmentTime: new Intl.DateTimeFormat('vi-VN', {
        timeZone: 'Asia/Ho_Chi_Minh',
        hour: '2-digit',
        minute: '2-digit',
        hour12: false,
      }).format(startsAt),
      appointmentStartsAt: startsAt,
      arrivalStatus: isLate ? 'LATE' : 'ON_TIME',
      room: session.specialty.roomCode,
      doctorId: doctor.id,
      doctorName: doctor.user.fullName,
      specialtyId: session.specialty.id,
      specialtyName: session.specialty.name,
      status: session.status,
      skipCount: session.skipCount,
      nextSkipCount: session.skipCount + 1,
      ...actionability,
      calledAt: session.calledAt,
      skippedAt: session.skippedAt,
      isNoShow: session.status === CareSessionStatus.NO_SHOW,
      skipAllowedInSeconds:
        session.status === CareSessionStatus.CALLED
          ? skipAllowedInSeconds(session.calledAt, now)
          : 0,
    };
  }

  private async withDatabaseErrors<T>(action: () => Promise<T>): Promise<T> {
    try {
      return await action();
    } catch (error) {
      this.throwQueueError(error);
    }
  }

  private async throwTransitionError(
    error: unknown,
    careSessionId: string,
    completedStatus: CareSessionStatus,
    conflictMessage: string,
  ): Promise<never> {
    if (
      error instanceof BadRequestException ||
      error instanceof ConflictException ||
      error instanceof ForbiddenException ||
      error instanceof NotFoundException
    )
      this.throwQueueError(error);
    const current = await this.prisma.careSession.findUnique({
      where: { id: careSessionId },
      select: { status: true },
    });
    if (current?.status === completedStatus)
      throw new ConflictException(conflictMessage);
    this.throwQueueError(error);
  }

  private throwQueueError(error: unknown): never {
    if (
      error instanceof BadRequestException ||
      error instanceof ConflictException ||
      error instanceof ForbiddenException ||
      error instanceof NotFoundException
    )
      throw error;
    if (typeof error === 'object' && error !== null && 'code' in error) {
      const code = (error as { code?: unknown }).code;
      if (code === 'P2034' || code === 'P2028')
        throw new ConflictException(
          'HÃ ng chá» vá»«a Ä‘Æ°á»£c cáº­p nháº­t. Vui lÃ²ng táº£i láº¡i rá»“i thá»­ láº¡i.',
        );
      if (code === 'P2002')
        throw new ConflictException(
          'Phiên khám vừa được cập nhật. Vui lòng tải lại rồi thử lại.',
        );
      if (code === 'P2025')
        throw new NotFoundException('KhÃ´ng tÃ¬m tháº¥y lÆ°á»£t khÃ¡m.');
    }
    throw new InternalServerErrorException(
      'KhÃ´ng thá»ƒ xá»­ lÃ½ hÃ ng chá» lÃºc nÃ y. Vui lÃ²ng thá»­ láº¡i.',
    );
  }
}
