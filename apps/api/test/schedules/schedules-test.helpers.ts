import {
  LeaveRequestType,
  StaffType,
  UserRole,
  UserStatus,
} from '../../src/generated/prisma/enums';
import type { AuditLogsService } from '../../src/modules/audit-logs/audit-logs.service';
import type { SchedulesRepository } from '../../src/modules/schedules/schedules.repository';
import { SchedulesService } from '../../src/modules/schedules/schedules.service';
import type { CurrentUserDto } from '../../src/modules/users/dto/responses/current-user.dto';

export const NOW = new Date('2026-11-02T08:00:00+07:00');
export const USER_ID = '11111111-1111-4111-8111-111111111111';
export const OTHER_USER_ID = '22222222-2222-4222-8222-222222222222';
export const DOCTOR_ID = '33333333-3333-4333-8333-333333333333';
export const REPLACEMENT_ID = '44444444-4444-4444-8444-444444444444';
export const SCHEDULE_ID = '55555555-5555-4555-8555-555555555555';
export const REQUEST_ID = '66666666-6666-4666-8666-666666666666';
export const SPECIALTY_ID = '77777777-7777-4777-8777-777777777777';

export const DOCTOR: CurrentUserDto = {
  id: USER_ID,
  name: 'Bác sĩ An',
  email: 'an@example.invalid',
  phone: '+84901234567',
  avatar: null,
  roleId: '88888888-8888-4888-8888-888888888888',
  role: UserRole.DOCTOR,
  status: UserStatus.ACTIVE,
  permissions: ['LEAVE_REQUESTS_CREATE'],
  createdAt: NOW,
};

export const ADMIN: CurrentUserDto = {
  ...DOCTOR,
  id: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
  name: 'Quản trị viên A',
  role: UserRole.ADMIN,
  permissions: ['LEAVE_REQUESTS_REVIEW', 'SCHEDULES_MANAGE'],
};

export function leaveInput() {
  return {
    requestType: LeaveRequestType.PLANNED_LEAVE,
    startsAt: '2026-11-04T08:00:00+07:00',
    endsAt: '2026-11-04T12:00:00+07:00',
    reason: 'Cần nghỉ để giải quyết việc gia đình',
  };
}

export function workSchedule() {
  return {
    id: SCHEDULE_ID,
    staffUserId: USER_ID,
    staffType: StaffType.DOCTOR,
    startsAt: new Date('2026-11-04T08:00:00+07:00'),
    endsAt: new Date('2026-11-04T12:00:00+07:00'),
    dayOfWeek: 3,
    effectiveFrom: new Date('2026-11-02T00:00:00+07:00'),
    effectiveTo: null,
    isRecurring: true,
    scheduleType: 'REGULAR',
    status: 'PUBLISHED',
    slotDurationMinutes: 30,
    createdBy: ADMIN.id,
    updatedAt: NOW,
  };
}

export function createSchedulesHarness() {
  const schedule = workSchedule();
  const request = {
    id: REQUEST_ID,
    staffUserId: USER_ID,
    doctorId: DOCTOR_ID,
    requestType: LeaveRequestType.PLANNED_LEAVE,
    priority: 'NORMAL',
    status: 'PENDING',
    startsAt: schedule.startsAt,
    endsAt: schedule.endsAt,
    reason: leaveInput().reason,
    doctor: { id: DOCTOR_ID, specialtyId: SPECIALTY_ID },
    scheduleLinks: [
      { staffWorkScheduleId: SCHEDULE_ID, staffWorkSchedule: schedule },
    ],
    reviewedBy: null,
    reviewedAt: null,
  };
  const client = {};
  const repository = {
    transaction: jest.fn((action: (tx: typeof client) => Promise<unknown>) =>
      action(client),
    ),
    findStaffUser: jest.fn().mockResolvedValue({
      id: USER_ID,
      role: { name: StaffType.DOCTOR },
      status: UserStatus.ACTIVE,
      deletedAt: null,
      doctor: { id: DOCTOR_ID },
    }),
    findOverlappingWorkSchedules: jest.fn().mockResolvedValue([schedule]),
    createLeaveRequest: jest.fn().mockResolvedValue(request),
    createLeaveRequestSchedules: jest.fn().mockResolvedValue({ count: 1 }),
    findLeaveRequest: jest.fn().mockResolvedValue(request),
    updateLeaveRequest: jest.fn().mockResolvedValue(request),
    findAffectedCareSessions: jest.fn().mockResolvedValue([]),
    findDoctor: jest.fn().mockResolvedValue({
      id: REPLACEMENT_ID,
      specialtyId: SPECIALTY_ID,
      isActive: true,
    }),
    findDoctorScheduleOverlap: jest.fn().mockResolvedValue(1),
    markStaffSchedulesAbsent: jest.fn().mockResolvedValue({ count: 1 }),
    markDoctorSchedulesAbsent: jest.fn().mockResolvedValue({ count: 1 }),
    createScheduleException: jest
      .fn()
      .mockResolvedValue({ id: '99999999-9999-4999-8999-999999999999' }),
    createScheduleReassignment: jest
      .fn()
      .mockResolvedValue({ id: 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb' }),
    markAppointmentsPendingResolution: jest
      .fn()
      .mockResolvedValue({ count: 1 }),
  };
  const audit = { record: jest.fn().mockResolvedValue(undefined) };
  const service = new SchedulesService(
    repository as unknown as SchedulesRepository,
    audit as unknown as AuditLogsService,
  );
  return { service, repository, audit, client, request, schedule };
}
