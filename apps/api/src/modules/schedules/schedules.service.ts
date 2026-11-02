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

@Injectable()
export class SchedulesService {
  constructor(
    private readonly repository: SchedulesRepository,
    private readonly auditLogs: AuditLogsService,
  ) {}

  async availability(query: AvailabilityQueryDto) {
    const from = clinicDateStart(query.dateFrom);
    const until = new Date(
      clinicDateStart(query.dateTo).getTime() + 24 * 60 * 60 * 1000,
    );
    if (until <= from || until.getTime() - from.getTime() > 31 * 86400000) {
      throw new BadRequestException('Khoảng tra cứu phải từ 1 đến 31 ngày.');
    }

    await this.ensureDefaultDoctorSlots(from, until);

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

  private clinicDateTime(date: Date, time: string) {
    return new Date(`${this.clinicDateString(date)}T${time}:00+07:00`);
  }

  private async ensureDefaultDoctorSlots(from: Date, until: Date) {
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
          for (const [shiftStart, shiftEnd] of [
            ['08:00', '12:00'],
            ['13:00', '18:00'],
          ]) {
            const startsAt = this.clinicDateTime(day, shiftStart);
            const endsAt = this.clinicDateTime(day, shiftEnd);
            let schedule = await this.repository.findDoctorSchedule(
              client,
              doctor.id,
              startsAt,
              endsAt,
            );
            if (schedule?.status === 'ABSENT') continue;
            if (!schedule) {
              schedule = await this.repository.createDoctorSchedule(client, {
                doctorId: doctor.id,
                startsAt,
                endsAt,
                scheduleType: 'REGULAR',
                status: 'PUBLISHED',
                slotDurationMinutes: 30,
                createdBy: doctor.userId,
                publishedAt: now,
              });
            } else if (schedule.status !== 'PUBLISHED') {
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
              slotStart.getTime() + 30 * 60000 <= endsAt.getTime();
              slotStart = new Date(slotStart.getTime() + 30 * 60000)
            ) {
              if (slotStart <= now || existingStarts.has(slotStart.getTime()))
                continue;
              slots.push({
                doctorScheduleId: schedule.id,
                startsAt: slotStart,
                endsAt: new Date(slotStart.getTime() + 30 * 60000),
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
    this.assertWeekday(input.dayOfWeek);
    const startsAt = this.parseDate(input.startsAt, 'startsAt');
    const endsAt = this.parseDate(input.endsAt, 'endsAt');
    const effectiveFrom = this.parseDate(input.effectiveFrom, 'effectiveFrom');
    const effectiveTo = input.effectiveTo
      ? this.parseDate(input.effectiveTo, 'effectiveTo')
      : null;
    if (endsAt <= startsAt)
      throw new BadRequestException('Invalid schedule range');
    if (effectiveTo && effectiveTo < effectiveFrom)
      throw new BadRequestException('Invalid effective date range');
    if (input.staffType === StaffType.DOCTOR && !input.slotDurationMinutes)
      throw new BadRequestException(
        'slotDurationMinutes is required for doctors',
      );
    if (input.staffType === StaffType.RECEPTIONIST && input.slotDurationMinutes)
      throw new BadRequestException(
        'Receptionist schedules cannot create appointment slots',
      );

    const staff = await this.repository.findStaffUser(input.staffUserId);
    if (!staff || staff.status !== UserStatus.ACTIVE || staff.deletedAt)
      throw new NotFoundException('Staff account not found or inactive');
    if (staff.role?.name !== input.staffType)
      throw new BadRequestException('Staff type does not match account role');

    const overlap = await this.repository.findOverlappingWorkSchedules(
      input.staffUserId,
      startsAt,
      endsAt,
    );
    if (overlap.length)
      throw new ConflictException(
        'Schedule overlaps an existing work schedule',
      );

    return this.repository.createWorkSchedule({
      staffUserId: input.staffUserId,
      staffType: input.staffType,
      startsAt,
      endsAt,
      dayOfWeek: input.dayOfWeek,
      effectiveFrom,
      effectiveTo,
      isRecurring: true,
      scheduleType: input.scheduleType ?? 'REGULAR',
      slotDurationMinutes: input.slotDurationMinutes,
      createdBy: admin.id,
    });
  }

  async createWorkSchedules(
    input: CreateWorkSchedulesDto,
    admin: CurrentUserDto,
  ) {
    const created = [];
    for (const schedule of input.schedules) {
      created.push(await this.createWorkSchedule(schedule, admin));
    }
    return created;
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
    const leaves = await this.repository.findApprovedLeaveRequests(
      users.map((item) => item.id),
      users.flatMap((item) => (item.doctor ? [item.doctor.id] : [])),
      startDate,
      until,
    );
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
        shifts: dates.flatMap((date) =>
          [
            { key: 'MORNING', startsAt: '08:00', endsAt: '12:00' },
            { key: 'AFTERNOON', startsAt: '13:00', endsAt: '18:00' },
          ].map((shift) => {
            const shiftStartsAt = new Date(
              `${date}T${shift.startsAt}:00+07:00`,
            );
            const shiftEndsAt = new Date(`${date}T${shift.endsAt}:00+07:00`);
            const hasApprovedLeave = leaves.some(
              (leaveRequest) =>
                (leaveRequest.staffUserId === staffMember.id ||
                  (staffMember.doctor &&
                    leaveRequest.doctorId === staffMember.doctor.id)) &&
                leaveRequest.startsAt < shiftEndsAt &&
                leaveRequest.endsAt !== null &&
                leaveRequest.endsAt > shiftStartsAt,
            );
            return {
              date,
              key: shift.key,
              startsAt: shiftStartsAt.toISOString(),
              endsAt: shiftEndsAt.toISOString(),
              status: hasApprovedLeave ? 'ABSENT' : 'PUBLISHED',
            };
          }),
        ),
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
      const published = await client.staffWorkSchedule.update({
        where: { id },
        data: {
          status: StaffWorkScheduleStatus.PUBLISHED,
          publishedAt: getCurrentTime(),
        },
      });
      if (
        schedule.staffType === StaffType.DOCTOR &&
        schedule.staffUser.doctor &&
        schedule.slotDurationMinutes
      ) {
        await this.materializeDoctorSchedules(
          client,
          schedule,
          admin?.id ?? schedule.createdBy,
        );
      }
      return published;
    });
  }

  private async materializeDoctorSchedules(
    client: import('../../generated/prisma/client').Prisma.TransactionClient,
    schedule: Awaited<ReturnType<SchedulesService['getWorkSchedule']>>,
    createdBy: string,
  ) {
    const doctorId = schedule.staffUser.doctor!.id;
    const slotDurationMinutes = schedule.slotDurationMinutes;
    if (!slotDurationMinutes) return;
    const startDate = this.startOfDay(
      schedule.effectiveFrom > getCurrentTime()
        ? schedule.effectiveFrom
        : getCurrentTime(),
    );
    const configuredEnd = schedule.effectiveTo
      ? this.startOfDay(schedule.effectiveTo)
      : this.addDays(startDate, 90);
    const endDate = configuredEnd < startDate ? startDate : configuredEnd;

    for (
      const date = new Date(startDate);
      date <= endDate;
      date.setDate(date.getDate() + 1)
    ) {
      const dayOfWeek = date.getDay() === 0 ? 7 : date.getDay();
      if (dayOfWeek !== schedule.dayOfWeek) continue;

      const startsAt = this.withTime(date, schedule.startsAt);
      const endsAt = this.withTime(date, schedule.endsAt);
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

  private startOfDay(value: Date) {
    const date = new Date(value);
    date.setHours(0, 0, 0, 0);
    return date;
  }

  private addDays(value: Date, days: number) {
    const date = new Date(value);
    date.setDate(date.getDate() + days);
    return date;
  }

  private withTime(date: Date, time: Date) {
    const result = new Date(date);
    result.setHours(
      time.getHours(),
      time.getMinutes(),
      time.getSeconds(),
      time.getMilliseconds(),
    );
    return result;
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
    const affectedShifts = this.getOverlappingClinicShifts(startsAt, endsAt);
    if (!affectedShifts.length)
      throw new BadRequestException(
        'Khoảng nghỉ không giao với ca làm việc 08:00–12:00 hoặc 13:00–18:00.',
      );
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
        reason: input.reason.trim(),
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
          scheduleCount: affectedShifts.length,
        },
      );
      return created;
    });
    return request;
  }

  private getOverlappingClinicShifts(startsAt: Date, endsAt: Date) {
    const shifts: Array<{ startsAt: Date; endsAt: Date }> = [];
    const firstDate = clinicDateStart(this.clinicDateString(startsAt));
    const lastDate = clinicDateStart(this.clinicDateString(endsAt));
    for (
      let date = new Date(firstDate);
      date <= lastDate;
      date = new Date(date.getTime() + 86400000)
    ) {
      for (const [shiftStart, shiftEnd] of [
        ['08:00', '12:00'],
        ['13:00', '18:00'],
      ]) {
        const shiftStartsAt = this.clinicDateTime(date, shiftStart);
        const shiftEndsAt = this.clinicDateTime(date, shiftEnd);
        if (shiftStartsAt < endsAt && shiftEndsAt > startsAt) {
          shifts.push({ startsAt: shiftStartsAt, endsAt: shiftEndsAt });
        }
      }
    }
    return shifts;
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
        rejectionReason: input.rejectionReason.trim(),
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
        await this.repository.markAppointmentsPendingResolution(client, [
          ...new Set(affected.map((session) => session.appointmentId)),
        ]);
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
      await this.ensureDefaultDoctorSlots(
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
