import 'reflect-metadata';
import { LeaveRequestStatus, UserRole } from '../../generated/prisma/enums';
import type { AuditLogsService } from '../audit-logs/audit-logs.service';
import type { CurrentUserDto } from '../users/dto/responses/current-user.dto';
import { AvailabilityQueryDto } from './dto/availability-query.dto';
import { WorkScheduleQueryDto } from './dto/admin/work-schedule-query.dto';
import { SchedulesRepository } from './schedules.repository';
import { SchedulesService } from './schedules.service';

describe('SchedulesService default clinic flow', () => {
  const doctorId = '11111111-1111-4111-8111-111111111111';
  const staffUserId = '22222222-2222-4222-8222-222222222222';
  const admin = {
    id: '33333333-3333-4333-8333-333333333333',
    name: 'Admin',
    role: UserRole.ADMIN,
  } as CurrentUserDto;
  const transactionClient = {
    $queryRaw: jest.fn(),
    doctorSchedule: { update: jest.fn() },
    leaveRequest: { findUnique: jest.fn() },
  };
  const repository = {
    findActiveDoctors: jest.fn(),
    findActiveClinicStaff: jest.fn(),
    findActiveLeaveRequests: jest.fn(),
    transaction: jest.fn(
      (callback: (client: typeof transactionClient) => unknown) =>
        callback(transactionClient),
    ),
    lockDoctorScheduleMaterialization: jest.fn(),
    findDoctorSchedule: jest.fn(),
    createDoctorSchedule: jest.fn(),
    findDoctorSlotStarts: jest.fn(),
    createAppointmentSlots: jest.fn(),
    findAvailability: jest.fn(),
    findLeaveRequest: jest.fn(),
    findAffectedCareSessions: jest.fn(),
    createScheduleException: jest.fn(),
    markAppointmentsPendingResolution: jest.fn(),
    updateLeaveRequest: jest.fn(),
    markDoctorSchedulesAbsent: jest.fn(),
  } as unknown as jest.Mocked<SchedulesRepository>;
  const audit = { record: jest.fn().mockResolvedValue(undefined) };
  const service = new SchedulesService(
    repository,
    audit as unknown as AuditLogsService,
  );

  beforeEach(() => {
    jest.resetAllMocks();
    jest.useFakeTimers();
    jest.setSystemTime(new Date('2026-11-01T10:00:00+07:00'));
    repository.transaction.mockImplementation(
      (callback) => callback(transactionClient as never) as never,
    );
    repository.findActiveDoctors.mockResolvedValue([
      { id: doctorId, userId: staffUserId },
    ] as never);
    repository.lockDoctorScheduleMaterialization.mockResolvedValue(
      undefined as never,
    );
    repository.findDoctorSchedule.mockResolvedValue(null);
    repository.createDoctorSchedule.mockImplementation(
      (_client, input) =>
        ({ id: `schedule-${new Date(input.startsAt).getHours()}` }) as never,
    );
    repository.findDoctorSlotStarts.mockResolvedValue([]);
    repository.createAppointmentSlots.mockResolvedValue({ count: 18 });
    repository.findAvailability.mockResolvedValue({ total: 0, items: [] });
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('creates default 30-minute slots for both daily clinic shifts on demand', async () => {
    const query = Object.assign(new AvailabilityQueryDto(), {
      dateFrom: '2026-11-02',
      dateTo: '2026-11-02',
      page: 1,
      limit: 50,
    });

    await service.availability(query);

    expect(repository.createDoctorSchedule.mock.calls).toHaveLength(2);
    expect(repository.createAppointmentSlots.mock.calls).toHaveLength(2);
    const createCalls = repository.createAppointmentSlots.mock.calls;
    expect(createCalls[0][1]).toHaveLength(8);
    expect(createCalls[1][1]).toHaveLength(10);
    expect(createCalls[0][1][0]).toMatchObject({
      startsAt: new Date('2026-11-02T08:00:00+07:00'),
      endsAt: new Date('2026-11-02T08:30:00+07:00'),
    });
    expect(createCalls[1][1][0]).toMatchObject({
      startsAt: new Date('2026-11-02T13:00:00+07:00'),
      endsAt: new Date('2026-11-02T13:30:00+07:00'),
    });
  });

  it('materializes the afternoon shift when the morning shift is absent', async () => {
    repository.findDoctorSchedule
      .mockResolvedValueOnce({
        id: 'absent-morning',
        status: 'ABSENT',
      } as never)
      .mockResolvedValueOnce(null);
    const query = Object.assign(new AvailabilityQueryDto(), {
      dateFrom: '2026-11-02',
      dateTo: '2026-11-02',
      page: 1,
      limit: 50,
    });

    await service.availability(query);

    expect(repository.createDoctorSchedule.mock.calls).toHaveLength(1);
    expect(repository.createAppointmentSlots.mock.calls).toHaveLength(1);
    expect(repository.createAppointmentSlots.mock.calls[0][1]).toHaveLength(10);
    expect(repository.createAppointmentSlots.mock.calls[0][1][0]).toMatchObject(
      {
        startsAt: new Date('2026-11-02T13:00:00+07:00'),
        endsAt: new Date('2026-11-02T13:30:00+07:00'),
      },
    );
  });

  it('shows both default shifts each day and marks only approved overlapping shifts absent', async () => {
    repository.findActiveClinicStaff.mockResolvedValue([
      {
        id: staffUserId,
        fullName: 'Bác sĩ thử nghiệm',
        role: { name: 'DOCTOR' },
        doctor: {
          id: doctorId,
          doctorCode: 'DOC-01',
          specialty: { name: 'Nội khoa' },
        },
      },
    ] as never);
    repository.findActiveLeaveRequests.mockResolvedValue([
      {
        staffUserId,
        doctorId,
        startsAt: new Date('2026-11-03T01:00:00.000Z'),
        endsAt: new Date('2026-11-03T05:00:00.000Z'),
        status: LeaveRequestStatus.APPROVED,
      },
    ] as never);
    const query = Object.assign(new WorkScheduleQueryDto(), {
      from: '2026-11-02',
      to: '2026-11-08',
    });

    const result = await service.getWorkScheduleMatrix(query);

    expect(result.dates).toHaveLength(7);
    expect(result.staff[0].shifts).toHaveLength(14);
    expect(
      result.staff[0].shifts.filter((shift) => shift.status === 'ABSENT'),
    ).toHaveLength(1);
    expect(
      result.staff[0].shifts.find(
        (shift) => shift.date === '2026-11-03' && shift.key === 'MORNING',
      )?.status,
    ).toBe('ABSENT');
  });

  it('keeps doctor leave resolving until every affected patient handles the appointment', async () => {
    const leaveRequest = {
      id: '44444444-4444-4444-8444-444444444444',
      doctorId,
      staffUserId,
      startsAt: new Date('2026-11-02T01:00:00+07:00'),
      endsAt: new Date('2026-11-02T05:00:00+07:00'),
      status: LeaveRequestStatus.PENDING,
      doctor: { specialtyId: '55555555-5555-4555-8555-555555555555' },
      scheduleLinks: [],
      exceptions: [],
    };
    const resolvingRequest = {
      ...leaveRequest,
      status: LeaveRequestStatus.RESOLVING,
    };
    repository.findLeaveRequest
      .mockResolvedValueOnce(leaveRequest as never)
      .mockResolvedValueOnce(leaveRequest as never)
      .mockResolvedValueOnce(resolvingRequest as never);
    repository.findAffectedCareSessions.mockResolvedValue([
      {
        id: '66666666-6666-4666-8666-666666666666',
        appointmentId: '77777777-7777-4777-8777-777777777777',
        appointmentSlotId: '88888888-8888-4888-8888-888888888888',
        status: 'SCHEDULED',
      },
    ] as never);
    repository.createScheduleException.mockResolvedValue({
      id: 'exception-1',
    } as never);
    repository.markAppointmentsPendingResolution.mockResolvedValue({
      count: 1,
    } as never);
    repository.updateLeaveRequest.mockResolvedValue(resolvingRequest as never);

    const result = await service.approveLeaveRequest(
      leaveRequest.id,
      {},
      admin,
    );

    expect(result).toMatchObject({ status: LeaveRequestStatus.RESOLVING });
    expect(
      repository.markAppointmentsPendingResolution.mock.calls,
    ).toHaveLength(1);
    expect(repository.markDoctorSchedulesAbsent.mock.calls).toHaveLength(0);
    expect(audit.record.mock.calls[0]).toEqual([
      expect.objectContaining({
        actionCode: 'LEAVE_REQUEST_RESOLUTION_STARTED',
      }),
      transactionClient,
    ]);
  });
});
