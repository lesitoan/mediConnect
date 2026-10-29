import { Injectable } from '@nestjs/common';
import { Prisma } from '../../generated/prisma/client';
import { PrismaService } from '../database/services/prisma.service';
import {
  CareSessionStatus,
  StaffWorkScheduleStatus,
} from '../../generated/prisma/enums';
import { sqlTable } from '../database/utils/sql-table';

type DatabaseClient = PrismaService | Prisma.TransactionClient;

const LEAVE_REQUEST_INCLUDE = {
  staffUser: { include: { role: true } },
  doctor: { include: { specialty: true, user: true } },
  reviewedByUser: true,
  scheduleLinks: { include: { staffWorkSchedule: true } },
  exceptions: {
    include: {
      careSession: { include: { appointment: true, appointmentSlot: true } },
      originalDoctor: { include: { specialty: true, user: true } },
      reassignments: true,
    },
  },
} as const;

@Injectable()
export class SchedulesRepository {
  constructor(private readonly prisma: PrismaService) {}

  findStaffUser(userId: string) {
    return this.prisma.user.findUnique({
      where: { id: userId },
      include: { role: true, doctor: { include: { specialty: true } } },
    });
  }

  createWorkSchedule(
    input: Prisma.StaffWorkScheduleUncheckedCreateInput,
    client: DatabaseClient = this.prisma,
  ) {
    return client.staffWorkSchedule.create({ data: input });
  }

  findWorkSchedules(where: Prisma.StaffWorkScheduleWhereInput) {
    return this.prisma.staffWorkSchedule.findMany({
      where,
      orderBy: [{ startsAt: 'asc' }, { staffUserId: 'asc' }],
      include: { staffUser: true },
    });
  }

  findWorkSchedule(id: string) {
    return this.prisma.staffWorkSchedule.findUnique({
      where: { id },
      include: {
        staffUser: { include: { role: true, doctor: true } },
      },
    });
  }

  findDoctorSchedule(
    client: DatabaseClient,
    doctorId: string,
    startsAt: Date,
    endsAt: Date,
  ) {
    return client.doctorSchedule.findFirst({
      where: { doctorId, startsAt, endsAt },
    });
  }

  createDoctorSchedule(
    client: DatabaseClient,
    data: Prisma.DoctorScheduleUncheckedCreateInput,
  ) {
    return client.doctorSchedule.create({ data });
  }

  createAppointmentSlots(
    client: DatabaseClient,
    data: Prisma.AppointmentSlotCreateManyInput[],
  ) {
    return client.appointmentSlot.createMany({ data, skipDuplicates: true });
  }

  updateWorkSchedule(
    id: string,
    data: Prisma.StaffWorkScheduleUncheckedUpdateInput,
  ) {
    return this.prisma.staffWorkSchedule.update({ where: { id }, data });
  }

  findLeaveRequests(where: Prisma.LeaveRequestWhereInput) {
    return this.prisma.leaveRequest.findMany({
      where,
      orderBy: [{ priority: 'desc' }, { createdAt: 'asc' }],
      include: LEAVE_REQUEST_INCLUDE,
    });
  }

  findLeaveRequest(id: string, client: DatabaseClient = this.prisma) {
    return client.leaveRequest.findUnique({
      where: { id },
      include: LEAVE_REQUEST_INCLUDE,
    });
  }

  createLeaveRequest(
    client: DatabaseClient,
    data: Prisma.LeaveRequestUncheckedCreateInput,
  ) {
    return client.leaveRequest.create({ data, include: LEAVE_REQUEST_INCLUDE });
  }

  createLeaveRequestSchedules(
    client: DatabaseClient,
    data: Prisma.LeaveRequestScheduleCreateManyInput[],
  ) {
    return client.leaveRequestSchedule.createMany({
      data,
      skipDuplicates: true,
    });
  }

  updateLeaveRequest(
    client: DatabaseClient,
    id: string,
    data: Prisma.LeaveRequestUncheckedUpdateInput,
  ) {
    return client.leaveRequest.update({
      where: { id },
      data,
      include: LEAVE_REQUEST_INCLUDE,
    });
  }

  findOverlappingWorkSchedules(
    staffUserId: string,
    startsAt: Date,
    endsAt: Date,
  ) {
    return this.prisma.staffWorkSchedule.findMany({
      where: {
        staffUserId,
        startsAt: { lt: endsAt },
        endsAt: { gt: startsAt },
        status: {
          in: [
            StaffWorkScheduleStatus.DRAFT,
            StaffWorkScheduleStatus.PUBLISHED,
          ],
        },
      },
    });
  }

  findAffectedCareSessions(
    doctorId: string,
    startsAt: Date,
    endsAt: Date,
    client: DatabaseClient = this.prisma,
  ) {
    return client.careSession.findMany({
      where: {
        appointmentSlot: {
          startsAt: { lt: endsAt },
          endsAt: { gt: startsAt },
          doctorSchedule: { doctorId },
        },
        status: {
          notIn: [
            CareSessionStatus.COMPLETED,
            CareSessionStatus.CANCELLED,
            CareSessionStatus.NO_SHOW,
          ],
        },
      },
      include: {
        appointment: true,
        appointmentSlot: true,
        specialty: true,
      },
      orderBy: { appointmentSlot: { startsAt: 'asc' } },
    });
  }

  findReplacementDoctor(
    doctorId: string,
    specialtyId: string,
    startsAt: Date,
    endsAt: Date,
  ) {
    return this.prisma.doctor.findFirst({
      where: {
        isActive: true,
        specialtyId,
        id: { not: doctorId },
        user: { status: 'ACTIVE', deletedAt: null },
        schedules: {
          some: {
            status: 'PUBLISHED',
            startsAt: { lt: endsAt },
            endsAt: { gt: startsAt },
          },
        },
      },
      include: { user: true, specialty: true },
    });
  }

  findReplacementDoctors(
    doctorId: string,
    specialtyId: string,
    startsAt: Date,
    endsAt: Date,
  ) {
    return this.prisma.doctor.findMany({
      where: {
        isActive: true,
        specialtyId,
        id: { not: doctorId },
        user: { status: 'ACTIVE', deletedAt: null },
        schedules: {
          some: {
            status: 'PUBLISHED',
            startsAt: { lt: endsAt },
            endsAt: { gt: startsAt },
          },
        },
      },
      include: { user: true, specialty: true },
      orderBy: { doctorCode: 'asc' },
    });
  }

  findDoctor(id: string) {
    return this.prisma.doctor.findUnique({
      where: { id },
      include: { specialty: true, user: true },
    });
  }

  findDoctorScheduleOverlap(doctorId: string, startsAt: Date, endsAt: Date) {
    return this.prisma.doctorSchedule.count({
      where: {
        doctorId,
        status: 'PUBLISHED',
        startsAt: { lt: endsAt },
        endsAt: { gt: startsAt },
      },
    });
  }

  createScheduleException(
    client: DatabaseClient,
    data: Prisma.ScheduleExceptionUncheckedCreateInput,
  ) {
    return client.scheduleException.create({ data });
  }

  createScheduleReassignment(
    client: DatabaseClient,
    data: Prisma.ScheduleReassignmentUncheckedCreateInput,
  ) {
    return client.scheduleReassignment.create({ data });
  }

  findScheduleException(id: string) {
    return this.prisma.scheduleException.findUnique({
      where: { id },
      include: {
        leaveRequest: true,
        careSession: { include: { appointment: true, appointmentSlot: true } },
        reassignments: true,
      },
    });
  }

  findScheduleExceptions(where: Prisma.ScheduleExceptionWhereInput = {}) {
    return this.prisma.scheduleException.findMany({
      where,
      orderBy: { createdAt: 'asc' },
      include: {
        leaveRequest: true,
        careSession: { include: { appointment: true, appointmentSlot: true } },
        reassignments: true,
      },
    });
  }

  updateScheduleException(
    client: DatabaseClient,
    id: string,
    data: Prisma.ScheduleExceptionUncheckedUpdateInput,
  ) {
    return client.scheduleException.update({ where: { id }, data });
  }

  updateReassignment(
    client: DatabaseClient,
    id: string,
    data: Prisma.ScheduleReassignmentUncheckedUpdateInput,
  ) {
    return client.scheduleReassignment.update({ where: { id }, data });
  }

  findReassignment(id: string, client: DatabaseClient = this.prisma) {
    return client.scheduleReassignment.findUnique({
      where: { id },
      include: { exception: true, fromSlot: true, toDoctor: true },
    });
  }

  findAvailableReplacementSlot(
    slotId: string,
    doctorId: string,
    startsAt: Date,
    endsAt: Date,
  ) {
    return this.prisma.appointmentSlot.findFirst({
      where: {
        id: slotId,
        startsAt,
        endsAt,
        doctorSchedule: { doctorId, status: 'PUBLISHED' },
        careSessions: {
          none: {
            status: {
              notIn: [CareSessionStatus.CANCELLED, CareSessionStatus.NO_SHOW],
            },
          },
        },
      },
    });
  }

  async markDoctorSchedulesAbsent(
    client: DatabaseClient,
    doctorId: string,
    startsAt: Date,
    endsAt: Date,
  ) {
    return client.doctorSchedule.updateMany({
      where: {
        doctorId,
        startsAt: { lt: endsAt },
        endsAt: { gt: startsAt },
        status: { in: ['DRAFT', 'PUBLISHED'] },
      },
      data: { status: 'ABSENT' },
    });
  }

  markStaffSchedulesAbsent(client: DatabaseClient, scheduleIds: string[]) {
    return client.staffWorkSchedule.updateMany({
      where: { id: { in: scheduleIds } },
      data: { status: StaffWorkScheduleStatus.ABSENT },
    });
  }

  markAppointmentsPendingResolution(
    client: DatabaseClient,
    appointmentIds: string[],
  ) {
    return client.appointment.updateMany({
      where: { id: { in: appointmentIds } },
      data: { status: 'PENDING_RESOLUTION' },
    });
  }

  updateCareSessionSlot(client: DatabaseClient, id: string, slotId: string) {
    return client.careSession.update({
      where: { id },
      data: { appointmentSlotId: slotId },
    });
  }

  async findAvailability(input: {
    from: Date;
    until: Date;
    now: Date;
    startHour: number;
    endHour: number;
    query: {
      doctorId?: string;
      specialtyId?: string;
      limit: number;
      page: number;
    };
  }) {
    type SlotResult = {
      id: string;
      startsAt: string;
      endsAt: string;
      doctor: {
        id: string;
        fullName: string;
        specialty: { id: string; name: string; roomCode: string };
      };
    };

    const [result] = await this.prisma.$queryRaw<
      { items: SlotResult[]; total: number }[]
    >(Prisma.sql`
      WITH available AS (
        SELECT s.id, s.starts_at AS "startsAt", s.ends_at AS "endsAt",
          jsonb_build_object('id', d.id, 'fullName', u.full_name, 'specialty',
            jsonb_build_object('id', sp.id, 'name', sp.name, 'roomCode', sp.room_code)) AS doctor
        FROM ${sqlTable(this.prisma.schemaName, 'appointment_slots')} s
        JOIN ${sqlTable(this.prisma.schemaName, 'doctor_schedules')} ds ON ds.id = s.doctor_schedule_id
        JOIN ${sqlTable(this.prisma.schemaName, 'doctors')} d ON d.id = ds.doctor_id
        JOIN ${sqlTable(this.prisma.schemaName, 'users')} u ON u.id = d.user_id
        JOIN ${sqlTable(this.prisma.schemaName, 'specialties')} sp ON sp.id = d.specialty_id
        WHERE s.starts_at >= ${input.from} AND s.starts_at < ${input.until} AND s.starts_at > ${input.now}
          AND s.starts_at >= ds.starts_at AND s.ends_at <= ds.ends_at
          AND s.is_blocked = false AND ds.status = 'PUBLISHED'
          AND d.is_active = true AND sp.is_active = true AND u.status = 'ACTIVE' AND u.deleted_at IS NULL
          ${input.query.specialtyId ? Prisma.sql`AND sp.id = ${input.query.specialtyId}::uuid` : Prisma.empty}
          ${input.query.doctorId ? Prisma.sql`AND d.id = ${input.query.doctorId}::uuid` : Prisma.empty}
          AND EXTRACT(HOUR FROM s.starts_at AT TIME ZONE 'Asia/Ho_Chi_Minh') >= ${input.startHour}
          AND EXTRACT(HOUR FROM s.starts_at AT TIME ZONE 'Asia/Ho_Chi_Minh') < ${input.endHour}
          AND NOT EXISTS (SELECT 1 FROM ${sqlTable(this.prisma.schemaName, 'leave_requests')} l WHERE l.doctor_id = d.id
            AND l.status = 'APPROVED' AND l.starts_at < s.ends_at AND l.ends_at > s.starts_at)
          AND NOT EXISTS (SELECT 1 FROM ${sqlTable(this.prisma.schemaName, 'care_sessions')} cs
            JOIN ${sqlTable(this.prisma.schemaName, 'appointments')} a ON a.id = cs.appointment_id
            WHERE cs.appointment_slot_id = s.id AND cs.status NOT IN ('CANCELLED', 'NO_SHOW') AND a.status <> 'CANCELLED')
      ), paged AS (
        SELECT * FROM available ORDER BY "startsAt", id LIMIT ${input.query.limit} OFFSET ${(input.query.page - 1) * input.query.limit}
      )
      SELECT (SELECT count(*)::int FROM available) AS total,
        COALESCE((SELECT jsonb_agg(to_jsonb(paged) ORDER BY "startsAt", id) FROM paged), '[]'::jsonb) AS items
    `);
    if (!result) throw new Error('Availability query returned no result');
    return result;
  }

  transaction<T>(callback: (client: Prisma.TransactionClient) => Promise<T>) {
    return this.prisma.$transaction(callback);
  }
}
