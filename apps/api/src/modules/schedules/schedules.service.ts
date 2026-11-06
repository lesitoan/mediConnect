import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  AuditLogResult,
  AppointmentStatus,
  CareSessionStatus,
  LeaveRequestPriority,
  LeaveRequestSource,
  LeaveRequestStatus,
  LeaveRequestType,
  ScheduleExceptionResolution,
  ScheduleExceptionStatus,
  ScheduleReassignmentStatus,
  StaffType,
  StaffWorkScheduleStatus,
  UserStatus,
  UserRole,
} from '../../generated/prisma/enums';
import type { Prisma } from '../../generated/prisma/client';
import { getCurrentTime } from '../../common/utils/e2e-clock';
import { AuditLogsService } from '../audit-logs/audit-logs.service';
import type { CurrentUserDto } from '../users/dto/responses/current-user.dto';
import {
  CRITICAL_CARE_SESSION_STATUSES,
  DEFAULT_DOCTOR_SLOT_DURATION_MINUTES,
  DEFAULT_WORKING_DAYS,
  DEFAULT_WORK_WINDOWS,
  MIN_PLANNED_LEAVE_NOTICE_HOURS,
  WORKING_DAYS_PER_WEEK,
} from './constants/schedules.constant';
import type { ApproveLeaveRequestDto } from './dto/admin/approve-leave-request.dto';
import type { CreateWorkScheduleDto } from './dto/admin/create-work-schedule.dto';
import type { CreateWorkSchedulesDto } from './dto/admin/create-work-schedules.dto';
import type { ConfirmReassignmentDto } from './dto/admin/confirm-reassignment.dto';
import type { RejectLeaveRequestDto } from './dto/admin/reject-leave-request.dto';
import type { WorkScheduleQueryDto } from './dto/admin/work-schedule-query.dto';
import type { LeaveRequestQueryDto } from './dto/admin/leave-request-query.dto';
import type { CreateLeaveRequestDto } from './dto/staff/create-leave-request.dto';
import type { LeaveImpactQueryDto } from './dto/staff/leave-impact-query.dto';
import type { WorkScheduleMatrixQueryDto } from './dto/staff/work-schedule-matrix-query.dto';
import type { ProposeScheduleExceptionDto } from './dto/admin/propose-schedule-exception.dto';
import type { RespondScheduleExceptionDto } from './dto/patient/respond-schedule-exception.dto';
import { SchedulesRepository } from './schedules.repository';
import { ScheduleExceptionWorkflowService } from './schedule-exception-workflow.service';
import type { AvailabilityQueryDto } from './dto/availability-query.dto';

function clinicDateStart(value: string): Date {
  const date = new Date(`${value}T00:00:00+07:00`);
  if (
    !Number.isFinite(date.getTime()) ||
    new Date(date.getTime() + 7 * 60 * 60 * 1000).toISOString().slice(0, 10) !==
      value
  ) {
    throw new BadRequestException('Ngày tra cứu không hợp lệ.');
  }
  return date;
}

const CLINIC_TIME_FORMATTER = new Intl.DateTimeFormat('en-GB', {
  timeZone: 'Asia/Ho_Chi_Minh',
  hour: '2-digit',
  minute: '2-digit',
  second: '2-digit',
  hourCycle: 'h23',
});

const MINUTES_PER_DAY = 24 * 60;
const MINUTES_PER_WEEK = WORKING_DAYS_PER_WEEK * MINUTES_PER_DAY;

@Injectable()
export class SchedulesService {
  constructor(
    private readonly repository: SchedulesRepository,
    private readonly auditLogs: AuditLogsService,
    private readonly scheduleExceptionWorkflow: ScheduleExceptionWorkflowService,
  ) {}

  async availability(query: AvailabilityQueryDto) {
    const from = clinicDateStart(query.dateFrom);
    const until = new Date(
      clinicDateStart(query.dateTo).getTime() + 24 * 60 * 60 * 1000,
    );
    if (until <= from || until.getTime() - from.getTime() > 31 * 86400000) {
      throw new BadRequestException('Khoảng tra cứu phải từ 1 đến 31 ngày.');
    }

    await this.ensureDoctorSlotsFromWorkSchedules(from, until);

    const now = getCurrentTime();
    const timeRanges: Record<string, [number, number]> = {
      MORNING: [0, 12],
      AFTERNOON: [12, 18],
      EVENING: [18, 24],
    };
    const [startHour, endHour] = query.timePeriod
      ? timeRanges[query.timePeriod]
      : [0, 24];
    const result = await this.repository.findAvailability({
      from,
      until,
      now,
      startHour,
      endHour,
      query,
    });

    return {
      ...result,
      page: query.page,
      limit: query.limit,
      timeZone: 'Asia/Ho_Chi_Minh',
      checkedAt: now.toISOString(),
    };
  }

  private clinicDateString(value: Date) {
    const parts = new Intl.DateTimeFormat('en-CA', {
      timeZone: 'Asia/Ho_Chi_Minh',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    }).formatToParts(value);
    const year = parts.find((part) => part.type === 'year')?.value;
    const month = parts.find((part) => part.type === 'month')?.value;
    const day = parts.find((part) => part.type === 'day')?.value;
    if (!year || !month || !day)
      throw new Error('Unable to format clinic-local date');
    return `${year}-${month}-${day}`;
  }

  private clinicTime(value: Date) {
    const parts = CLINIC_TIME_FORMATTER.formatToParts(value);
    const hour = parts.find((part) => part.type === 'hour')?.value;
    const minute = parts.find((part) => part.type === 'minute')?.value;
    const second = parts.find((part) => part.type === 'second')?.value;
    if (!hour || !minute || !second)
      throw new Error('Unable to format clinic-local time');
    return `${hour}:${minute}:${second}`;
  }

  private addClinicDays(date: string, days: number) {
    const value = new Date(`${date}T00:00:00Z`);
    value.setUTCDate(value.getUTCDate() + days);
    return value.toISOString().slice(0, 10);
  }

  private getScheduleOccurrence(
    schedule: {
      startsAt: Date;
      endsAt: Date;
    },
    date: string,
  ) {
    const scheduleStartDate = this.clinicDateString(schedule.startsAt);
    const scheduleEndDate = this.clinicDateString(schedule.endsAt);
    const endDayOffset = Math.round(
      (new Date(`${scheduleEndDate}T00:00:00Z`).getTime() -
        new Date(`${scheduleStartDate}T00:00:00Z`).getTime()) /
        86400000,
    );
    const startsAt = new Date(
      `${date}T${this.clinicTime(schedule.startsAt)}+07:00`,
    );
    const endsAt = new Date(
      `${this.addClinicDays(date, endDayOffset)}T${this.clinicTime(schedule.endsAt)}+07:00`,
    );
    return { startsAt, endsAt };
  }

  private clinicWeekday(date: string) {
    const day = new Date(`${date}T00:00:00Z`).getUTCDay();
    return day === 0 ? 7 : day;
  }

  private async ensureDoctorSlotsFromWorkSchedules(from: Date, until: Date) {
    const doctors = await this.repository.findActiveDoctors();
    const now = getCurrentTime();
    for (const doctor of doctors) {
      for (
        let day = new Date(from);
        day < until;
        day = new Date(day.getTime() + 86400000)
      ) {
        await this.repository.transaction(async (client) => {
          await this.repository.lockDoctorScheduleMaterialization(
            client,
            doctor.id,
            day,
          );
          const date = this.clinicDateString(day);
          const workSchedules =
            await this.repository.findPublishedDoctorWorkSchedules(
              client,
              doctor.userId,
              this.clinicWeekday(date),
              new Date(`${date}T00:00:00Z`),
            );
          for (const workSchedule of workSchedules) {
            if (!workSchedule.slotDurationMinutes) continue;
            const { startsAt, endsAt } = this.getScheduleOccurrence(
              workSchedule,
              date,
            );
            if (endsAt <= now) continue;
            let schedule = await this.repository.findDoctorSchedule(
              client,
              doctor.id,
              startsAt,
              endsAt,
            );
            if (
              schedule?.status === 'ABSENT' ||
              schedule?.status === 'CANCELLED'
            )
              continue;
            if (!schedule) {
              schedule = await this.repository.createDoctorSchedule(client, {
                doctorId: doctor.id,
                startsAt,
                endsAt,
                scheduleType: workSchedule.scheduleType,
                status: 'PUBLISHED',
                slotDurationMinutes: workSchedule.slotDurationMinutes,
                createdBy: doctor.userId,
                publishedAt: now,
              });
            } else if (schedule.status === 'DRAFT') {
              schedule = await client.doctorSchedule.update({
                where: { id: schedule.id },
                data: { status: 'PUBLISHED', publishedAt: now },
              });
            }

            const existingSlots = await this.repository.findDoctorSlotStarts(
              client,
              doctor.id,
              startsAt,
              endsAt,
            );
            const existingStarts = new Set(
              existingSlots.map((slot) => slot.startsAt.getTime()),
            );
            const slots: Prisma.AppointmentSlotCreateManyInput[] = [];
            for (
              let slotStart = new Date(startsAt);
              slotStart < endsAt;
              slotStart = new Date(
                slotStart.getTime() + workSchedule.slotDurationMinutes * 60000,
              )
            ) {
              const slotEnd = new Date(
                Math.min(
                  slotStart.getTime() +
                    workSchedule.slotDurationMinutes * 60000,
                  endsAt.getTime(),
                ),
              );
              if (
                slotStart <= now ||
                slotEnd <= slotStart ||
                existingStarts.has(slotStart.getTime())
              )
                continue;
              slots.push({
                doctorScheduleId: schedule.id,
                startsAt: slotStart,
                endsAt: slotEnd,
              });
            }
            if (slots.length)
              await this.repository.createAppointmentSlots(client, slots);
          }
        });
      }
    }
  }

  private recordAudit(
    client: Prisma.TransactionClient,
    actor: CurrentUserDto,
    actionCode: string,
    targetType: string,
    targetId: string,
    after: Record<string, string | number | boolean | null>,
  ) {
    const role = Object.values(UserRole).find(
      (candidate) => candidate === actor.role,
    );
    if (!role) throw new Error('Authenticated user has an unsupported role');

    return this.auditLogs.record(
      {
        actor: { type: 'USER', id: actor.id, name: actor.name, role },
        actionCode,
        module: 'SCHEDULES',
        targetType,
        targetId,
        result: AuditLogResult.SUCCESS,
        after,
      },
      client,
    );
  }

  async createWorkSchedule(
    input: CreateWorkScheduleDto,
    admin: CurrentUserDto,
  ) {
    const effectiveFrom = this.parseDate(input.effectiveFrom, 'effectiveFrom');
    const effectiveTo = input.effectiveTo
      ? this.parseDate(input.effectiveTo, 'effectiveTo')
      : null;
    if (effectiveTo && effectiveTo < effectiveFrom)
      throw new BadRequestException('Invalid effective date range');
    return this.repository.transaction((client) =>
      this.createDefaultWorkSchedules(
        client,
        input,
        effectiveFrom,
        effectiveTo,
        admin,
      ),
    );
  }

  private async createDefaultWorkSchedules(
    client: Prisma.TransactionClient,
    input: CreateWorkScheduleDto,
    effectiveFrom: Date,
    effectiveTo: Date | null,
    admin: CurrentUserDto,
  ) {
    const staff = await this.repository.findStaffUser(input.staffUserId);
    if (!staff || staff.status !== UserStatus.ACTIVE || staff.deletedAt)
      throw new NotFoundException('Staff account not found or inactive');
    if (staff.role?.name !== input.staffType)
      throw new BadRequestException('Staff type does not match account role');

    const effectiveDate = this.clinicDateString(effectiveFrom);
    const schedules = DEFAULT_WORKING_DAYS.flatMap((dayOfWeek) =>
      DEFAULT_WORK_WINDOWS.map((window) => ({
        dayOfWeek,
        startsAt: new Date(
          effectiveDate + 'T' + window.startsAt + ':00+07:00',
        ),
        endsAt: new Date(
          effectiveDate + 'T' + window.endsAt + ':00+07:00',
        ),
      })),
    );
    const overlappingSchedules =
      await this.repository.findOverlappingRecurringWorkSchedules({
        staffUserId: input.staffUserId,
        effectiveFrom,
        effectiveTo,
      });
    if (
      schedules.some((schedule) =>
        overlappingSchedules.some((existing) =>
          this.doRecurringSchedulesOverlap(
            { ...schedule, effectiveFrom, effectiveTo },
            existing,
          ),
        ),
      )
    )
      throw new ConflictException(
        'Schedule overlaps an existing work schedule',
      );

    return Promise.all(
      schedules.map((schedule) =>
        this.repository.createWorkSchedule(
          {
            staffUserId: input.staffUserId,
            staffType: input.staffType,
            startsAt: schedule.startsAt,
            endsAt: schedule.endsAt,
            dayOfWeek: schedule.dayOfWeek,
            effectiveFrom,
            effectiveTo,
            isRecurring: true,
            scheduleType: 'REGULAR',
            slotDurationMinutes:
              input.staffType === StaffType.DOCTOR
                ? DEFAULT_DOCTOR_SLOT_DURATION_MINUTES
                : null,
            createdBy: admin.id,
          },
          client,
        ),
      ),
    );
  }

  private doRecurringSchedulesOverlap(
    left: {
      dayOfWeek: number;
      startsAt: Date;
      endsAt: Date;
      effectiveFrom: Date;
      effectiveTo: Date | null;
    },
    right: {
      dayOfWeek: number;
      startsAt: Date;
      endsAt: Date;
      effectiveFrom: Date;
      effectiveTo: Date | null;
    },
  ) {
    if (
      (left.effectiveTo &&
        this.clinicDateString(left.effectiveTo) <
          this.clinicDateString(right.effectiveFrom)) ||
      (right.effectiveTo &&
        this.clinicDateString(right.effectiveTo) <
          this.clinicDateString(left.effectiveFrom))
    )
      return false;

    const getWeeklyStartMinute = (schedule: {
      dayOfWeek: number;
      startsAt: Date;
    }) => {
      const [hour, minute] = this.clinicTime(schedule.startsAt)
        .split(':')
        .map(Number);
      return (schedule.dayOfWeek - 1) * MINUTES_PER_DAY + hour * 60 + minute;
    };
    const leftStart = getWeeklyStartMinute(left);
    const rightStart = getWeeklyStartMinute(right);
    const leftDuration =
      (left.endsAt.getTime() - left.startsAt.getTime()) / 60000;
    const rightDuration =
      (right.endsAt.getTime() - right.startsAt.getTime()) / 60000;

    return [-MINUTES_PER_WEEK, 0, MINUTES_PER_WEEK].some((offset) => {
      const shiftedRightStart = rightStart + offset;
      return (
        leftStart < shiftedRightStart + rightDuration &&
        leftStart + leftDuration > shiftedRightStart
      );
    });
  }

  async createWorkSchedules(
    input: CreateWorkSchedulesDto,
    admin: CurrentUserDto,
  ) {
    return this.repository.transaction(async (client) => {
      const created = [];
      for (const schedule of input.schedules) {
        const effectiveFrom = this.parseDate(
          schedule.effectiveFrom,
          'effectiveFrom',
        );
        const effectiveTo = schedule.effectiveTo
          ? this.parseDate(schedule.effectiveTo, 'effectiveTo')
          : null;
        if (effectiveTo && effectiveTo < effectiveFrom)
          throw new BadRequestException('Invalid effective date range');
        created.push(
          ...(await this.createDefaultWorkSchedules(
            client,
            schedule,
            effectiveFrom,
            effectiveTo,
            admin,
          )),
        );
      }
      return created;
    });
  }

  listWorkSchedules(query: WorkScheduleQueryDto) {
    const from = this.parseDate(query.from, 'from');
    const to = this.parseDate(query.to, 'to');
    if (to < from) throw new BadRequestException('Invalid date range');
    return this.repository.findWorkSchedules({
      ...(query.staffType ? { staffType: query.staffType } : {}),
      ...(query.staffUserId ? { staffUserId: query.staffUserId } : {}),
      effectiveFrom: { lte: to },
      OR: [{ effectiveTo: null }, { effectiveTo: { gte: from } }],
    });
  }

  async getWorkScheduleMatrix(
    query: Pick<WorkScheduleQueryDto, 'from' | 'to' | 'staffType'>,
    staffUserId?: string,
  ) {
    const startDate = clinicDateStart(query.from.slice(0, 10));
    const lastDate = clinicDateStart(query.to.slice(0, 10));
    const until = new Date(lastDate.getTime() + 86400000);
    if (
      until <= startDate ||
      until.getTime() - startDate.getTime() > 31 * 86400000
    )
      throw new BadRequestException('Khoảng xem lịch phải từ 1 đến 31 ngày.');

    const staff = await this.repository.findActiveClinicStaff(staffUserId);
    const users = staff.filter(
      (item) =>
        item.role && (!query.staffType || item.role.name === query.staffType),
    );
    const [workSchedules, leaveRequests] = await Promise.all([
      this.repository.findWorkSchedulesForMatrix(
        users.map((item) => item.id),
        startDate,
        until,
      ),
      this.repository.findScheduleLeaveRequests(
        users.map((item) => item.id),
        users.flatMap((item) => (item.doctor ? [item.doctor.id] : [])),
        startDate,
        until,
      ),
    ]);
    const dates: string[] = [];
    for (
      let date = new Date(startDate);
      date < until;
      date = new Date(date.getTime() + 86400000)
    ) {
      dates.push(this.clinicDateString(date));
    }

    return {
      dates,
      staff: users.map((staffMember) => ({
        userId: staffMember.id,
        staffType: staffMember.role?.name,
        fullName: staffMember.fullName,
        staffCode:
          staffMember.doctor?.doctorCode ??
          staffMember.id.slice(0, 8).toUpperCase(),
        specialtyName: staffMember.doctor?.specialty.name ?? 'Lễ tân',
        shifts: dates.flatMap((date) => {
          const dateDay = this.clinicWeekday(date);
          const dateSchedules = workSchedules.filter(
            (schedule) =>
              schedule.staffUserId === staffMember.id &&
              schedule.dayOfWeek === dateDay &&
              this.clinicDateString(schedule.effectiveFrom) <= date &&
              (!schedule.effectiveTo ||
                this.clinicDateString(schedule.effectiveTo) >= date),
          );
          return dateSchedules.map((schedule) => {
            const { startsAt, endsAt } = this.getScheduleOccurrence(
              schedule,
              date,
            );
            const matchingLeaveRequests = leaveRequests.filter(
              (leaveRequest) =>
                (leaveRequest.staffUserId === staffMember.id ||
                  (staffMember.doctor &&
                    leaveRequest.doctorId === staffMember.doctor.id)) &&
                leaveRequest.startsAt < endsAt &&
                (leaveRequest.endsAt === null ||
                  leaveRequest.endsAt > startsAt),
            );
            const status = matchingLeaveRequests.some(
              (leaveRequest) =>
                leaveRequest.status === LeaveRequestStatus.APPROVED,
            )
              ? 'ABSENT'
              : matchingLeaveRequests.some(
                    (leaveRequest) =>
                      leaveRequest.status === LeaveRequestStatus.RESOLVING,
                  )
                ? 'RESOLVING'
                : schedule.status;
            return {
              date,
              key: schedule.id,
              startsAt: startsAt.toISOString(),
              endsAt: endsAt.toISOString(),
              status,
            };
          });
        }),
      })),
    };
  }

  getOwnWorkScheduleMatrix(
    query: WorkScheduleMatrixQueryDto,
    user: CurrentUserDto,
  ) {
    return this.getWorkScheduleMatrix(query, user.id);
  }

  async getWorkSchedule(id: string) {
    const schedule = await this.repository.findWorkSchedule(id);
    if (!schedule) throw new NotFoundException('Work schedule not found');
    return schedule;
  }

  async publishWorkSchedule(id: string, admin?: CurrentUserDto) {
    const schedule = await this.getWorkSchedule(id);
    if (schedule.status === StaffWorkScheduleStatus.CANCELLED)
      throw new ConflictException('Cancelled schedule cannot be published');
    return this.repository.transaction(async (client) => {
      const weeklySchedules = await client.staffWorkSchedule.findMany({
        where: {
          staffUserId: schedule.staffUserId,
          staffType: schedule.staffType,
          effectiveFrom: schedule.effectiveFrom,
          effectiveTo: schedule.effectiveTo,
          status: {
            in: [
              StaffWorkScheduleStatus.DRAFT,
              StaffWorkScheduleStatus.PUBLISHED,
            ],
          },
        },
        include: {
          staffUser: { include: { doctor: true, role: true } },
        },
      });

      await client.staffWorkSchedule.updateMany({
        where: { id: { in: weeklySchedules.map((item) => item.id) } },
        data: {
          status: StaffWorkScheduleStatus.PUBLISHED,
          publishedAt: getCurrentTime(),
        },
      });

      for (const weeklySchedule of weeklySchedules) {
        await this.materializeDoctorSchedules(
          client,
          weeklySchedule,
          admin?.id ?? weeklySchedule.createdBy,
        );
      }

      return client.staffWorkSchedule.findUniqueOrThrow({ where: { id } });
    });
  }

  private async materializeDoctorSchedules(
    client: import('../../generated/prisma/client').Prisma.TransactionClient,
    schedule: {
      dayOfWeek: number;
      startsAt: Date;
      endsAt: Date;
      effectiveFrom: Date;
      effectiveTo: Date | null;
      scheduleType: import('../../generated/prisma/enums').ScheduleType;
      slotDurationMinutes: number | null;
      staffType: StaffType;
      staffUser: { doctor: { id: string } | null };
    },
    createdBy: string,
  ) {
    const doctorId = schedule.staffUser.doctor!.id;
    const slotDurationMinutes = schedule.slotDurationMinutes;
    if (
      schedule.staffType !== StaffType.DOCTOR ||
      slotDurationMinutes !== DEFAULT_DOCTOR_SLOT_DURATION_MINUTES
    )
      return;
    const now = getCurrentTime();
    const today = this.clinicDateString(now);
    const effectiveFrom = this.clinicDateString(schedule.effectiveFrom);
    const weekAnchor = effectiveFrom > today ? effectiveFrom : today;
    const weekStart = this.addClinicDays(
      weekAnchor,
      -(this.clinicWeekday(weekAnchor) - 1),
    );
    const weekEnd = this.addClinicDays(weekStart, WORKING_DAYS_PER_WEEK - 1);
    const firstDate =
      effectiveFrom > weekStart
        ? effectiveFrom > today
          ? effectiveFrom
          : today
        : weekStart;
    const configuredEndDate = schedule.effectiveTo
      ? this.clinicDateString(schedule.effectiveTo)
      : weekEnd;
    const endDate = configuredEndDate < weekEnd ? configuredEndDate : weekEnd;

    for (
      let date = firstDate;
      date <= endDate;
      date = this.addClinicDays(date, 1)
    ) {
      if (this.clinicWeekday(date) !== schedule.dayOfWeek) continue;

      const { startsAt, endsAt } = this.getScheduleOccurrence(schedule, date);
      if (endsAt <= getCurrentTime()) continue;

      const existing = await this.repository.findDoctorSchedule(
        client,
        doctorId,
        startsAt,
        endsAt,
      );
      if (existing) continue;

      const doctorSchedule = await this.repository.createDoctorSchedule(
        client,
        {
          doctorId,
          startsAt,
          endsAt,
          scheduleType: schedule.scheduleType,
          status: 'PUBLISHED',
          slotDurationMinutes,
          createdBy,
          publishedAt: getCurrentTime(),
        },
      );
      const slots: import('../../generated/prisma/client').Prisma.AppointmentSlotCreateManyInput[] =
        [];
      for (
        let slotStart = new Date(startsAt);
        slotStart < endsAt;
        slotStart = new Date(slotStart.getTime() + slotDurationMinutes * 60_000)
      ) {
        const slotEnd = new Date(
          Math.min(
            slotStart.getTime() + slotDurationMinutes * 60_000,
            endsAt.getTime(),
          ),
        );
        if (slotEnd <= slotStart) break;
        slots.push({
          doctorScheduleId: doctorSchedule.id,
          startsAt: slotStart,
          endsAt: slotEnd,
        });
      }
      await this.repository.createAppointmentSlots(client, slots);
    }
  }

  async cancelWorkSchedule(id: string) {
    await this.getWorkSchedule(id);
    return this.repository.updateWorkSchedule(id, {
      status: StaffWorkScheduleStatus.CANCELLED,
      updatedAt: getCurrentTime(),
    });
  }

  async listOwnWorkSchedules(user: CurrentUserDto) {
    return this.repository.findWorkSchedules({ staffUserId: user.id });
  }

  async previewOwnLeaveImpact(
    query: LeaveImpactQueryDto,
    user: CurrentUserDto,
  ) {
    const startsAt = this.parseDate(query.startsAt, 'startsAt');
    const endsAt = this.parseDate(query.endsAt, 'endsAt');
    if (endsAt <= startsAt)
      throw new BadRequestException('Invalid leave range');

    const staff = await this.repository.findStaffUser(user.id);
    if (
      !staff ||
      ![StaffType.DOCTOR, StaffType.RECEPTIONIST].includes(
        staff.role?.name as StaffType,
      )
    )
      throw new ForbiddenException(
        'Only doctors and receptionists can preview leave impact',
      );

    await this.getWorkSchedulesAffectedByLeave(user.id, startsAt, endsAt);
    if (!staff.doctor) return { affectedSessions: [] };

    const affectedSessions = await this.repository.findAffectedCareSessions(
      staff.doctor.id,
      startsAt,
      endsAt,
    );
    return {
      affectedSessions: affectedSessions.map((session) => ({
        id: session.id,
        appointmentCode: session.appointment.appointmentCode,
        startsAt: session.appointmentSlot.startsAt,
        endsAt: session.appointmentSlot.endsAt,
        status: session.status,
        specialtyName: session.specialty.name,
      })),
    };
  }

  async createLeaveRequest(input: CreateLeaveRequestDto, user: CurrentUserDto) {
    if (
      input.requestType !== LeaveRequestType.PLANNED_LEAVE &&
      input.requestType !== LeaveRequestType.URGENT_ABSENCE
    ) {
      throw new BadRequestException(
        'Only planned leave or urgent absence can be requested',
      );
    }
    const startsAt = this.parseDate(input.startsAt, 'startsAt');
    const endsAt = this.parseDate(input.endsAt, 'endsAt');
    if (endsAt <= startsAt)
      throw new BadRequestException('Invalid leave range');
    if (startsAt <= getCurrentTime())
      throw new BadRequestException('Leave must start in the future');
    const reason = input.reason.trim();
    if (!reason)
      throw new BadRequestException('Reason must contain non-whitespace text');
    const noticeHours = Math.floor(
      (startsAt.getTime() - getCurrentTime().getTime()) / 3_600_000,
    );
    if (
      input.requestType === LeaveRequestType.PLANNED_LEAVE &&
      noticeHours < MIN_PLANNED_LEAVE_NOTICE_HOURS
    )
      throw new BadRequestException(
        'Planned leave requires at least 48 hours notice',
      );
    if (
      input.requestType === LeaveRequestType.URGENT_ABSENCE &&
      noticeHours >= MIN_PLANNED_LEAVE_NOTICE_HOURS
    )
      throw new BadRequestException(
        'Use planned leave when notice is at least 48 hours',
      );

    const staff = await this.repository.findStaffUser(user.id);
    if (
      !staff ||
      ![StaffType.DOCTOR, StaffType.RECEPTIONIST].includes(
        staff.role?.name as StaffType,
      )
    )
      throw new ForbiddenException(
        'Only doctors and receptionists can request leave',
      );
    const affectedSchedules = await this.getWorkSchedulesAffectedByLeave(
      user.id,
      startsAt,
      endsAt,
    );

    const request = await this.repository.transaction(async (client) => {
      const created = await this.repository.createLeaveRequest(client, {
        doctorId: staff.doctor?.id ?? null,
        staffUserId: user.id,
        requestType: input.requestType,
        priority:
          input.requestType === LeaveRequestType.URGENT_ABSENCE
            ? LeaveRequestPriority.URGENT
            : LeaveRequestPriority.NORMAL,
        startsAt,
        endsAt,
        reason,
        status: LeaveRequestStatus.PENDING,
        noticeHours,
      });
      await this.recordAudit(
        client,
        user,
        'LEAVE_REQUEST_CREATED',
        'LEAVE_REQUEST',
        created.id,
        {
          requestType: input.requestType,
          scheduleCount: affectedSchedules.length,
        },
      );
      await this.repository.createLeaveRequestSchedules(
        client,
        affectedSchedules.map((schedule) => ({
          leaveRequestId: created.id,
          staffWorkScheduleId: schedule.id,
        })),
      );
      return created;
    });
    return request;
  }

  private hasRecurringOccurrenceOverlap(
    schedule: {
      dayOfWeek: number;
      startsAt: Date;
      endsAt: Date;
      effectiveFrom: Date;
      effectiveTo: Date | null;
    },
    startsAt: Date,
    endsAt: Date,
  ) {
    const requestStartDate = this.clinicDateString(startsAt);
    const requestEndDate = this.clinicDateString(endsAt);
    const earliestOccurrence = this.addClinicDays(requestStartDate, -1);
    const effectiveStartDate = this.clinicDateString(schedule.effectiveFrom);
    const effectiveEndDate = schedule.effectiveTo
      ? this.clinicDateString(schedule.effectiveTo)
      : requestEndDate;
    const startDate =
      earliestOccurrence > effectiveStartDate
        ? earliestOccurrence
        : effectiveStartDate;
    const endDate =
      requestEndDate < effectiveEndDate ? requestEndDate : effectiveEndDate;
    if (startDate > endDate) return false;

    const weekdayOffset =
      (schedule.dayOfWeek - this.clinicWeekday(startDate) + 7) %
      WORKING_DAYS_PER_WEEK;
    let occurrenceDate = this.addClinicDays(startDate, weekdayOffset);
    if (occurrenceDate > endDate) return false;

    for (let attempt = 0; attempt < 2; attempt += 1) {
      const occurrence = this.getScheduleOccurrence(schedule, occurrenceDate);
      if (occurrence.startsAt < endsAt && occurrence.endsAt > startsAt)
        return true;
      if (occurrence.startsAt >= endsAt) return false;
      occurrenceDate = this.addClinicDays(
        occurrenceDate,
        WORKING_DAYS_PER_WEEK,
      );
      if (occurrenceDate > endDate) return false;
    }
    return false;
  }

  private async getWorkSchedulesAffectedByLeave(
    staffUserId: string,
    startsAt: Date,
    endsAt: Date,
  ) {
    const requestStartDate = this.clinicDateString(startsAt);
    const requestEndDate = this.clinicDateString(endsAt);
    const workSchedules =
      await this.repository.findPublishedWorkSchedulesForStaff(
        staffUserId,
        clinicDateStart(this.addClinicDays(requestStartDate, -1)),
        clinicDateStart(this.addClinicDays(requestEndDate, 1)),
      );
    const affectedSchedules = workSchedules.filter((schedule) =>
      this.hasRecurringOccurrenceOverlap(schedule, startsAt, endsAt),
    );
    if (!affectedSchedules.length)
      throw new BadRequestException(
        'Khoảng nghỉ không giao với ca làm việc đã công bố của nhân viên.',
      );
    return affectedSchedules;
  }

  listOwnLeaveRequests(user: CurrentUserDto) {
    return this.repository.findLeaveRequests({ staffUserId: user.id });
  }

  async cancelOwnLeaveRequest(id: string, user: CurrentUserDto) {
    const request = await this.repository.findLeaveRequest(id);
    if (!request || request.staffUserId !== user.id)
      throw new NotFoundException('Leave request not found');
    if (request.status !== LeaveRequestStatus.PENDING)
      throw new ConflictException(
        'Only pending leave requests can be cancelled',
      );
    return this.repository.transaction((client) =>
      this.repository.updateLeaveRequest(client, id, {
        status: LeaveRequestStatus.CANCELLED,
      }),
    );
  }

  listLeaveRequests(query: LeaveRequestQueryDto) {
    return this.repository.findLeaveRequests({
      ...(query.status ? { status: query.status } : {}),
      ...(query.requestType ? { requestType: query.requestType } : {}),
      ...(query.priority ? { priority: query.priority } : {}),
      source: LeaveRequestSource.DOCTOR_REQUEST,
    });
  }

  async getLeaveRequest(id: string) {
    const request = await this.repository.findLeaveRequest(id);
    if (!request) throw new NotFoundException('Leave request not found');
    return request;
  }

  async getLeaveImpact(id: string) {
    const request = await this.getLeaveRequest(id);
    if (!request.doctorId || !request.doctor || !request.endsAt)
      return {
        request,
        affectedSessions: [],
        criticalCount: 0,
        replacementDoctors: [],
      };
    const affectedSessions = await this.repository.findAffectedCareSessions(
      request.doctorId,
      request.startsAt,
      request.endsAt,
    );
    const replacementDoctors = await this.repository.findReplacementDoctors(
      request.doctorId,
      request.doctor.specialtyId,
    );
    return {
      request,
      affectedSessions,
      criticalCount: affectedSessions.filter((session) =>
        (CRITICAL_CARE_SESSION_STATUSES as readonly string[]).includes(
          session.status,
        ),
      ).length,
      replacementDoctors,
    };
  }

  getReassignmentPreview(id: string) {
    return this.getLeaveImpact(id);
  }

  async rejectLeaveRequest(
    id: string,
    input: RejectLeaveRequestDto,
    admin: CurrentUserDto,
  ) {
    const rejectionReason = input.rejectionReason.trim();
    if (!rejectionReason)
      throw new BadRequestException(
        'Rejection reason must contain non-whitespace text',
      );
    const request = await this.getLeaveRequest(id);
    if (
      request.status !== LeaveRequestStatus.PENDING &&
      request.status !== LeaveRequestStatus.RESOLVING
    )
      throw new ConflictException(
        'Only pending or resolving leave requests can be rejected',
      );
    return this.repository.transaction(async (client) => {
      const current = await this.repository.findLeaveRequest(id, client);
      if (
        !current ||
        (current.status !== LeaveRequestStatus.PENDING &&
          current.status !== LeaveRequestStatus.RESOLVING)
      )
        throw new ConflictException(
          'Leave request changed while it was being reviewed',
        );
      const appointmentIds = [
        ...new Set(
          current.exceptions.map(
            (exception) => exception.careSession.appointmentId,
          ),
        ),
      ];
      if (
        current.status === LeaveRequestStatus.RESOLVING &&
        current.exceptions.some(
          (exception) => exception.status === ScheduleExceptionStatus.RESOLVED,
        )
      )
        throw new ConflictException(
          'A leave request cannot be rejected after a patient has accepted a resolution',
        );
      await client.scheduleReassignment.updateMany({
        where: {
          exception: { leaveRequestId: id },
          status: ScheduleReassignmentStatus.PROPOSED,
        },
        data: { status: ScheduleReassignmentStatus.CANCELLED },
      });
      await client.scheduleException.updateMany({
        where: { leaveRequestId: id, status: { not: 'RESOLVED' } },
        data: { status: ScheduleExceptionStatus.CANCELLED },
      });
      if (appointmentIds.length) {
        await client.appointment.updateMany({
          where: {
            id: { in: appointmentIds },
            status: AppointmentStatus.PENDING_RESOLUTION,
          },
          data: { status: AppointmentStatus.CONFIRMED },
        });
      }
      const updated = await this.repository.updateLeaveRequest(client, id, {
        status: LeaveRequestStatus.REJECTED,
        rejectionReason,
        reviewedBy: admin.id,
        reviewedAt: getCurrentTime(),
      });
      await this.recordAudit(
        client,
        admin,
        'LEAVE_REQUEST_REJECTED',
        'LEAVE_REQUEST',
        id,
        { status: LeaveRequestStatus.REJECTED },
      );
      return updated;
    });
  }

  async approveLeaveRequest(
    id: string,
    input: ApproveLeaveRequestDto,
    admin: CurrentUserDto,
  ) {
    const request = await this.getLeaveRequest(id);
    if (request.status !== LeaveRequestStatus.PENDING)
      throw new ConflictException(
        'Only pending leave requests can be approved',
      );

    return this.repository.transaction(async (client) => {
      const current = await this.repository.findLeaveRequest(id, client);
      if (!current || current.status !== LeaveRequestStatus.PENDING)
        throw new ConflictException(
          'Leave request changed while it was being reviewed',
        );
      if (!current.endsAt)
        throw new BadRequestException('Leave request is missing an end date');
      const affected = current.doctorId
        ? await this.repository.findAffectedCareSessions(
            current.doctorId,
            current.startsAt,
            current.endsAt,
            client,
          )
        : [];
      let replacementDoctor = null;
      if (current.doctorId && input.replacementDoctorId) {
        replacementDoctor = await this.repository.findDoctor(
          input.replacementDoctorId,
        );
        if (
          !replacementDoctor ||
          !replacementDoctor.isActive ||
          replacementDoctor.user.status !== UserStatus.ACTIVE ||
          replacementDoctor.user.deletedAt !== null ||
          replacementDoctor.specialtyId !== current.doctor?.specialtyId ||
          replacementDoctor.id === current.doctorId
        ) {
          throw new BadRequestException(
            'Replacement doctor must be active and in the same specialty',
          );
        }
      }

      const exceptionIds: string[] = [];
      for (const session of affected) {
        const exception = await this.repository.createScheduleException(
          client,
          {
            leaveRequestId: id,
            careSessionId: session.id,
            originalDoctorId: current.doctorId!,
            status: ScheduleExceptionStatus.PENDING_REASSIGNMENT,
            reason: 'Chờ quản trị viên đề xuất phương án cho bệnh nhân',
          },
        );
        exceptionIds.push(exception.id);
        if (replacementDoctor) {
          await this.repository.createScheduleReassignment(client, {
            exceptionId: exception.id,
            fromDoctorId: current.doctorId!,
            toDoctorId: replacementDoctor.id,
            fromSlotId: session.appointmentSlotId,
            status: ScheduleReassignmentStatus.PROPOSED,
            proposedBy: admin.id,
          });
        }
      }
      if (affected.length) {
        const appointmentIds = [
          ...new Set(affected.map((session) => session.appointmentId)),
        ];
        await this.repository.markAppointmentsPendingResolution(
          client,
          appointmentIds,
        );
        await this.scheduleExceptionWorkflow.startResolution({
          leaveRequestId: id,
          exceptionIds,
          appointmentIds,
          actorId: admin.id,
        });
      }
      const nextStatus = affected.length
        ? LeaveRequestStatus.RESOLVING
        : LeaveRequestStatus.APPROVED;
      await this.repository.updateLeaveRequest(client, id, {
        status: nextStatus,
        ...(affected.length
          ? {}
          : { reviewedBy: admin.id, reviewedAt: getCurrentTime() }),
      });
      if (!affected.length && current.doctorId) {
        await this.repository.markDoctorSchedulesAbsent(
          client,
          current.doctorId,
          current.startsAt,
          current.endsAt,
        );
      }
      await this.recordAudit(
        client,
        admin,
        affected.length
          ? 'LEAVE_REQUEST_RESOLUTION_STARTED'
          : 'LEAVE_REQUEST_APPROVED',
        'LEAVE_REQUEST',
        id,
        {
          replacementDoctorId: replacementDoctor?.id ?? null,
          affectedSessionCount: affected.length,
          status: nextStatus,
        },
      );
      return this.repository.findLeaveRequest(id, client);
    });
  }

  listScheduleExceptions() {
    return this.repository.findScheduleExceptions();
  }

  async getScheduleException(id: string) {
    const exception = await this.repository.findScheduleException(id);
    if (!exception) throw new NotFoundException('Schedule exception not found');
    return exception;
  }

  async confirmReassignment(
    id: string,
    input: ConfirmReassignmentDto,
    admin: CurrentUserDto,
  ) {
    const existing = await this.repository.findScheduleException(id);
    if (!existing) throw new NotFoundException('Schedule exception not found');
    const proposal: ProposeScheduleExceptionDto = {
      resolution: ScheduleExceptionResolution.REASSIGNED,
      toSlotId: input.toSlotId,
    };
    return this.proposeScheduleException(id, proposal, admin);
  }

  async proposeScheduleException(
    id: string,
    input: ProposeScheduleExceptionDto,
    admin: CurrentUserDto,
  ) {
    const existing = await this.repository.findScheduleException(id);
    if (!existing) throw new NotFoundException('Schedule exception not found');
    if (
      existing.status === ScheduleExceptionStatus.RESOLVED ||
      existing.leaveRequest.status !== LeaveRequestStatus.RESOLVING
    )
      throw new ConflictException(
        'The leave request is not waiting for exception resolution',
      );

    const originalSlot = existing.careSession.appointmentSlot;
    if (!originalSlot)
      throw new ConflictException('Original appointment slot is unavailable');
    let targetSlotId = input.toSlotId;
    const targetDoctorId = input.toDoctorId;
    if (
      input.resolution === ScheduleExceptionResolution.REASSIGNED &&
      !targetSlotId &&
      targetDoctorId
    ) {
      const shiftDate = clinicDateStart(
        this.clinicDateString(originalSlot.startsAt),
      );
      await this.ensureDoctorSlotsFromWorkSchedules(
        shiftDate,
        new Date(shiftDate.getTime() + 86400000),
      );
      const matchingSlot = await this.repository.findAvailableReplacementSlotAt(
        targetDoctorId,
        originalSlot.startsAt,
        originalSlot.endsAt,
      );
      targetSlotId = matchingSlot?.id;
      if (!targetSlotId)
        throw new ConflictException(
          'Selected replacement doctor has no available slot at this appointment time',
        );
    }

    return this.repository.transaction(async (client) => {
      const current = await client.scheduleException.findUnique({
        where: { id },
        include: {
          careSession: {
            include: { appointmentSlot: true, appointment: true },
          },
          reassignments: true,
        },
      });
      if (!current || current.status === ScheduleExceptionStatus.RESOLVED)
        throw new ConflictException('Schedule exception is already resolved');

      const reason = input.reason?.trim() || null;
      if (input.resolution === ScheduleExceptionResolution.CANCELLED) {
        await client.scheduleReassignment.updateMany({
          where: {
            exceptionId: id,
            status: ScheduleReassignmentStatus.PROPOSED,
          },
          data: { status: ScheduleReassignmentStatus.CANCELLED },
        });
        const proposal = await this.repository.updateScheduleException(
          client,
          id,
          {
            status: ScheduleExceptionStatus.PROPOSED,
            resolution: ScheduleExceptionResolution.CANCELLED,
            reason,
            resolvedBy: null,
            resolvedAt: null,
          },
        );
        await this.recordAudit(
          client,
          admin,
          'SCHEDULE_EXCEPTION_CANCELLATION_PROPOSED',
          'SCHEDULE_EXCEPTION',
          id,
          { resolution: ScheduleExceptionResolution.CANCELLED },
        );
        return proposal;
      }

      if (!targetSlotId)
        throw new BadRequestException(
          'A replacement appointment slot is required for this proposal',
        );
      const replacementSlot = await this.repository.findAppointmentSlot(
        targetSlotId,
        client,
      );
      if (!replacementSlot)
        throw new NotFoundException('Replacement appointment slot not found');
      const replacementDoctorId =
        targetDoctorId ?? replacementSlot.doctorSchedule.doctorId;
      if (
        replacementSlot.doctorSchedule.doctorId !== replacementDoctorId ||
        replacementSlot.doctorSchedule.doctor.specialtyId !==
          current.careSession.specialtyId ||
        replacementSlot.id === current.careSession.appointmentSlotId
      )
        throw new BadRequestException(
          'Replacement slot must be a different slot in the same specialty',
        );
      if (
        input.resolution === ScheduleExceptionResolution.REASSIGNED &&
        (replacementSlot.startsAt.getTime() !==
          originalSlot.startsAt.getTime() ||
          replacementSlot.endsAt.getTime() !== originalSlot.endsAt.getTime())
      )
        throw new BadRequestException(
          'A reassignment must preserve the appointment time',
        );
      if (
        (await this.repository.isSlotBlockedByLeave(
          replacementDoctorId,
          replacementSlot.startsAt,
          replacementSlot.endsAt,
          client,
        )) > 0
      )
        throw new ConflictException(
          'Replacement slot is during approved leave',
        );
      const available = await this.repository.findAvailableReplacementSlotById(
        replacementSlot.id,
        replacementDoctorId,
        client,
      );
      if (!available)
        throw new ConflictException('Replacement slot is no longer available');

      const previousProposal = await this.repository.findProposedReassignment(
        id,
        client,
      );
      if (previousProposal) {
        await this.repository.updateReassignment(client, previousProposal.id, {
          toDoctorId: replacementDoctorId,
          toSlotId: replacementSlot.id,
          status: ScheduleReassignmentStatus.PROPOSED,
          proposedBy: admin.id,
          proposedAt: getCurrentTime(),
          notes: reason,
        });
      } else {
        await this.repository.createScheduleReassignment(client, {
          exceptionId: id,
          fromDoctorId: current.originalDoctorId,
          toDoctorId: replacementDoctorId,
          fromSlotId: current.careSession.appointmentSlotId,
          toSlotId: replacementSlot.id,
          status: ScheduleReassignmentStatus.PROPOSED,
          proposedBy: admin.id,
          notes: reason,
        });
      }
      const proposal = await this.repository.updateScheduleException(
        client,
        id,
        {
          status: ScheduleExceptionStatus.PROPOSED,
          resolution: input.resolution,
          reason,
          resolvedBy: null,
          resolvedAt: null,
        },
      );
      await this.recordAudit(
        client,
        admin,
        'SCHEDULE_EXCEPTION_APPOINTMENT_PROPOSED',
        'SCHEDULE_EXCEPTION',
        id,
        {
          resolution: input.resolution,
          toSlotId: replacementSlot.id,
          toDoctorId: replacementDoctorId,
        },
      );
      return proposal;
    });
  }

  listMyScheduleExceptionProposals(user: CurrentUserDto) {
    return this.repository.findPatientScheduleExceptions(user.id);
  }

  async respondToScheduleException(
    id: string,
    input: RespondScheduleExceptionDto,
    user: CurrentUserDto,
  ) {
    return this.repository.transaction(async (client) => {
      const exception = await this.repository.findPatientScheduleException(
        id,
        user.id,
        client,
      );
      if (!exception)
        throw new NotFoundException('Schedule proposal not found');
      if (
        exception.status !== ScheduleExceptionStatus.PROPOSED ||
        exception.leaveRequest.status !== LeaveRequestStatus.RESOLVING
      )
        throw new ConflictException(
          'This proposal is no longer awaiting a response',
        );

      const proposedResolution = exception.resolution;
      if (!proposedResolution)
        throw new ConflictException('The proposal has no resolution type');
      const reassignment = exception.reassignments.find(
        (item) => item.status === ScheduleReassignmentStatus.PROPOSED,
      );

      if (input.decision === 'REJECT') {
        if (reassignment) {
          await this.repository.updateReassignment(client, reassignment.id, {
            status: ScheduleReassignmentStatus.REJECTED,
          });
        }
        await this.repository.updateScheduleException(client, id, {
          status: ScheduleExceptionStatus.PENDING_REASSIGNMENT,
          resolution: null,
          reason: 'Bệnh nhân chưa đồng ý với phương án được đề xuất',
          resolvedBy: null,
          resolvedAt: null,
        });
        await this.recordAudit(
          client,
          user,
          'SCHEDULE_EXCEPTION_PROPOSAL_REJECTED',
          'SCHEDULE_EXCEPTION',
          id,
          { decision: input.decision },
        );
        return {
          exceptionId: id,
          status: ScheduleExceptionStatus.PENDING_REASSIGNMENT,
        };
      }

      if (proposedResolution === ScheduleExceptionResolution.CANCELLED) {
        await client.careSession.update({
          where: { id: exception.careSessionId },
          data: { status: CareSessionStatus.CANCELLED },
        });
        const activeSessions = await client.careSession.count({
          where: {
            appointmentId: exception.careSession.appointmentId,
            status: {
              notIn: [CareSessionStatus.CANCELLED, CareSessionStatus.NO_SHOW],
            },
          },
        });
        if (!activeSessions) {
          await client.appointment.update({
            where: { id: exception.careSession.appointmentId },
            data: {
              status: AppointmentStatus.CANCELLED,
              cancellationReason:
                'Bệnh nhân xác nhận hủy do lịch bác sĩ thay đổi',
              cancelledAt: getCurrentTime(),
              cancelledBy: user.id,
            },
          });
        }
      } else {
        if (!reassignment?.toDoctorId || !reassignment.toSlotId)
          throw new ConflictException(
            'The replacement appointment slot is missing',
          );
        const slot = await this.repository.findAvailableReplacementSlotById(
          reassignment.toSlotId,
          reassignment.toDoctorId,
          client,
        );
        if (!slot)
          throw new ConflictException(
            'The proposed appointment slot is no longer available',
          );
        if (
          slot.doctorSchedule.doctor.specialtyId !==
          exception.careSession.specialtyId
        )
          throw new ConflictException(
            'The proposed slot is in another specialty',
          );
        if (
          (await this.repository.isSlotBlockedByLeave(
            reassignment.toDoctorId,
            slot.startsAt,
            slot.endsAt,
            client,
          )) > 0
        )
          throw new ConflictException(
            'The proposed slot is during approved leave',
          );

        await this.repository.updateCareSessionSlot(
          client,
          exception.careSessionId,
          slot.id,
        );
        await this.repository.updateReassignment(client, reassignment.id, {
          status: ScheduleReassignmentStatus.CONFIRMED,
          confirmedBy: user.id,
          confirmedAt: getCurrentTime(),
        });
      }

      await this.repository.updateScheduleException(client, id, {
        status: ScheduleExceptionStatus.RESOLVED,
        resolution: proposedResolution,
        resolvedBy: user.id,
        resolvedAt: getCurrentTime(),
      });
      const unresolvedAppointmentExceptions =
        await this.repository.countUnresolvedAppointmentExceptions(
          exception.careSession.appointmentId,
          client,
        );
      if (!unresolvedAppointmentExceptions) {
        const activeSessions = await client.careSession.count({
          where: {
            appointmentId: exception.careSession.appointmentId,
            status: {
              notIn: [CareSessionStatus.CANCELLED, CareSessionStatus.NO_SHOW],
            },
          },
        });
        await client.appointment.update({
          where: { id: exception.careSession.appointmentId },
          data: {
            status: activeSessions
              ? AppointmentStatus.CONFIRMED
              : AppointmentStatus.CANCELLED,
          },
        });
      }
      await this.recordAudit(
        client,
        user,
        'SCHEDULE_EXCEPTION_PROPOSAL_ACCEPTED',
        'SCHEDULE_EXCEPTION',
        id,
        { resolution: proposedResolution },
      );
      await this.completeLeaveRequestIfResolved(
        client,
        exception.leaveRequestId,
        user,
      );
      return {
        exceptionId: id,
        status: ScheduleExceptionStatus.RESOLVED,
        resolution: proposedResolution,
      };
    });
  }

  private async completeLeaveRequestIfResolved(
    client: Prisma.TransactionClient,
    leaveRequestId: string,
    actor: CurrentUserDto,
  ) {
    const leaveRequest = await client.leaveRequest.findUnique({
      where: { id: leaveRequestId },
      include: { exceptions: true },
    });
    if (
      !leaveRequest ||
      leaveRequest.status !== LeaveRequestStatus.RESOLVING ||
      leaveRequest.exceptions.some(
        (exception) => exception.status !== ScheduleExceptionStatus.RESOLVED,
      )
    )
      return;

    await this.repository.updateLeaveRequest(client, leaveRequestId, {
      status: LeaveRequestStatus.APPROVED,
      reviewedBy: actor.id,
      reviewedAt: getCurrentTime(),
    });
    if (leaveRequest.doctorId && leaveRequest.endsAt) {
      await this.repository.markDoctorSchedulesAbsent(
        client,
        leaveRequest.doctorId,
        leaveRequest.startsAt,
        leaveRequest.endsAt,
      );
    }
    await this.recordAudit(
      client,
      actor,
      'LEAVE_REQUEST_APPROVED',
      'LEAVE_REQUEST',
      leaveRequestId,
      { status: LeaveRequestStatus.APPROVED },
    );
  }

  private parseDate(value: string, field: string): Date {
    const parsed = new Date(value);
    if (Number.isNaN(parsed.getTime()))
      throw new BadRequestException(`${field} must be a valid ISO date`);
    return parsed;
  }

  private assertWeekday(dayOfWeek: number): void {
    if (dayOfWeek < 1 || dayOfWeek > WORKING_DAYS_PER_WEEK)
      throw new BadRequestException('dayOfWeek must be between 1 and 7');
  }
}
