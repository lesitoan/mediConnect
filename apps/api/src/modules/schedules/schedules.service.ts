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
import type { ResolveScheduleExceptionDto } from './dto/admin/resolve-schedule-exception.dto';
import type { WorkScheduleQueryDto } from './dto/admin/work-schedule-query.dto';
import type { LeaveRequestQueryDto } from './dto/admin/leave-request-query.dto';
import type { CreateLeaveRequestDto } from './dto/staff/create-leave-request.dto';
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

    const now = new Date();
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
          publishedAt: new Date(),
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
      schedule.effectiveFrom > new Date() ? schedule.effectiveFrom : new Date(),
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
      if (endsAt <= new Date()) continue;

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
          publishedAt: new Date(),
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
      updatedAt: new Date(),
    });
  }

  async listOwnWorkSchedules(user: CurrentUserDto) {
    return this.repository.findWorkSchedules({ staffUserId: user.id });
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
    const noticeHours = Math.floor(
      (startsAt.getTime() - Date.now()) / 3_600_000,
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
    const schedules = await this.repository.findOverlappingWorkSchedules(
      user.id,
      startsAt,
      endsAt,
    );
    if (!schedules.length)
      throw new BadRequestException(
        'No work schedule exists in the requested range',
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
      await this.repository.createLeaveRequestSchedules(
        client,
        schedules.map((schedule) => ({
          leaveRequestId: created.id,
          staffWorkScheduleId: schedule.id,
        })),
      );
      await this.recordAudit(
        client,
        user,
        'LEAVE_REQUEST_CREATED',
        'LEAVE_REQUEST',
        created.id,
        {
          requestType: input.requestType,
          scheduleCount: schedules.length,
        },
      );
      return created;
    });
    return request;
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
    if (!request.doctorId || !request.doctor)
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
      request.startsAt,
      request.endsAt,
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
    if (request.status !== LeaveRequestStatus.PENDING)
      throw new ConflictException(
        'Only pending leave requests can be rejected',
      );
    return this.repository.transaction(async (client) => {
      const updated = await this.repository.updateLeaveRequest(client, id, {
        status: LeaveRequestStatus.REJECTED,
        rejectionReason: input.rejectionReason.trim(),
        reviewedBy: admin.id,
        reviewedAt: new Date(),
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
    if (request.doctorId && !input.replacementDoctorId)
      throw new BadRequestException(
        'A replacement doctor is required before approving doctor leave',
      );

    return this.repository.transaction(async (client) => {
      const current = await this.repository.findLeaveRequest(id, client);
      if (!current || current.status !== LeaveRequestStatus.PENDING)
        throw new ConflictException(
          'Leave request changed while it was being reviewed',
        );
      const affected = current.doctorId
        ? await this.repository.findAffectedCareSessions(
            current.doctorId,
            current.startsAt,
            current.endsAt,
            client,
          )
        : [];
      let replacementDoctor = null;
      if (current.doctorId) {
        replacementDoctor = await this.repository.findDoctor(
          input.replacementDoctorId!,
        );
        if (
          !replacementDoctor ||
          !replacementDoctor.isActive ||
          replacementDoctor.specialtyId !== current.doctor?.specialtyId ||
          replacementDoctor.id === current.doctorId
        ) {
          throw new BadRequestException(
            'Replacement doctor must be active and in the same specialty',
          );
        }
        if (
          (await this.repository.findDoctorScheduleOverlap(
            replacementDoctor.id,
            current.startsAt,
            current.endsAt,
          )) === 0
        )
          throw new BadRequestException(
            'Replacement doctor has no published schedule in this period',
          );
      }

      await this.repository.updateLeaveRequest(client, id, {
        status: LeaveRequestStatus.APPROVED,
        reviewedBy: admin.id,
        reviewedAt: new Date(),
      });
      const linkedScheduleIds = current.scheduleLinks.map(
        (link) => link.staffWorkScheduleId,
      );
      await this.repository.markStaffSchedulesAbsent(client, linkedScheduleIds);
      if (current.doctorId)
        await this.repository.markDoctorSchedulesAbsent(
          client,
          current.doctorId,
          current.startsAt,
          current.endsAt,
        );

      const criticalAppointmentIds: string[] = [];
      for (const session of affected) {
        const isCritical = (
          CRITICAL_CARE_SESSION_STATUSES as readonly string[]
        ).includes(session.status);
        const exception = await this.repository.createScheduleException(
          client,
          {
            leaveRequestId: id,
            careSessionId: session.id,
            originalDoctorId: current.doctorId!,
            status: isCritical
              ? ScheduleExceptionStatus.PENDING_REASSIGNMENT
              : ScheduleExceptionStatus.PROPOSED,
            reason: isCritical
              ? 'Requires exception workflow before reassignment'
              : 'Doctor leave reassignment required',
          },
        );
        await this.repository.createScheduleReassignment(client, {
          exceptionId: exception.id,
          fromDoctorId: current.doctorId!,
          toDoctorId: replacementDoctor?.id,
          fromSlotId: session.appointmentSlotId,
          status: ScheduleReassignmentStatus.PROPOSED,
          proposedBy: admin.id,
          notes: isCritical
            ? 'Must be resolved through the exception workflow'
            : null,
        });
        if (isCritical) criticalAppointmentIds.push(session.appointmentId);
      }
      if (criticalAppointmentIds.length)
        await this.repository.markAppointmentsPendingResolution(
          client,
          criticalAppointmentIds,
        );
      await this.recordAudit(
        client,
        admin,
        'LEAVE_REQUEST_APPROVED',
        'LEAVE_REQUEST',
        id,
        {
          replacementDoctorId: replacementDoctor?.id ?? null,
          affectedSessionCount: affected.length,
          criticalSessionCount: criticalAppointmentIds.length,
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
    const exception = await this.repository.findScheduleException(id);
    if (!exception) throw new NotFoundException('Schedule exception not found');
    if (exception.status === ScheduleExceptionStatus.RESOLVED)
      throw new ConflictException('Schedule exception is already resolved');
    const proposal = exception.reassignments.find(
      (item) => item.status === ScheduleReassignmentStatus.PROPOSED,
    );
    if (!proposal || !proposal.toDoctorId)
      throw new ConflictException('No replacement doctor proposal exists');
    if (!exception.careSession.appointmentSlot)
      throw new ConflictException('Original appointment slot is unavailable');
    const slot = await this.repository.findAvailableReplacementSlot(
      input.toSlotId,
      proposal.toDoctorId,
      exception.careSession.appointmentSlot.startsAt,
      exception.careSession.appointmentSlot.endsAt,
    );
    if (!slot)
      throw new BadRequestException(
        'Replacement slot is unavailable or does not match the appointment time',
      );

    return this.repository.transaction(async (client) => {
      await this.repository.updateCareSessionSlot(
        client,
        exception.careSessionId,
        slot.id,
      );
      await client.appointment.update({
        where: { id: exception.careSession.appointmentId },
        data: { status: AppointmentStatus.CONFIRMED },
      });
      await this.repository.updateReassignment(client, proposal.id, {
        toSlotId: slot.id,
        status: ScheduleReassignmentStatus.CONFIRMED,
        confirmedBy: admin.id,
        confirmedAt: new Date(),
      });
      await this.repository.updateScheduleException(client, id, {
        status: ScheduleExceptionStatus.RESOLVED,
        resolution: ScheduleExceptionResolution.REASSIGNED,
        resolvedBy: admin.id,
        resolvedAt: new Date(),
      });
      await this.recordAudit(
        client,
        admin,
        'SCHEDULE_EXCEPTION_REASSIGNED',
        'SCHEDULE_EXCEPTION',
        id,
        { toSlotId: slot.id, toDoctorId: proposal.toDoctorId },
      );
      return {
        exceptionId: id,
        status: ScheduleExceptionStatus.RESOLVED,
        toSlotId: slot.id,
      };
    });
  }

  async markExceptionForReschedule(
    id: string,
    input: ResolveScheduleExceptionDto,
    admin: CurrentUserDto,
  ) {
    const exception = await this.repository.findScheduleException(id);
    if (!exception) throw new NotFoundException('Schedule exception not found');
    return this.repository.transaction(async (client) => {
      const result = await this.repository.updateScheduleException(client, id, {
        status: ScheduleExceptionStatus.RESCHEDULE_REQUIRED,
        resolution: ScheduleExceptionResolution.RESCHEDULED,
        reason: input.reason.trim(),
        resolvedBy: admin.id,
        resolvedAt: new Date(),
      });
      await this.recordAudit(
        client,
        admin,
        'SCHEDULE_EXCEPTION_RESCHEDULE_REQUIRED',
        'SCHEDULE_EXCEPTION',
        id,
        { status: ScheduleExceptionStatus.RESCHEDULE_REQUIRED },
      );
      return result;
    });
  }

  async cancelScheduleException(
    id: string,
    input: ResolveScheduleExceptionDto,
    admin: CurrentUserDto,
  ) {
    await this.getScheduleException(id);
    return this.repository.transaction(async (client) => {
      const result = await this.repository.updateScheduleException(client, id, {
        status: ScheduleExceptionStatus.CANCELLED,
        resolution: ScheduleExceptionResolution.CANCELLED,
        reason: input.reason.trim(),
        resolvedBy: admin.id,
        resolvedAt: new Date(),
      });
      await this.recordAudit(
        client,
        admin,
        'SCHEDULE_EXCEPTION_CANCELLED',
        'SCHEDULE_EXCEPTION',
        id,
        { status: ScheduleExceptionStatus.CANCELLED },
      );
      return result;
    });
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
