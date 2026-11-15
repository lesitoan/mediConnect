import { BadRequestException } from '@nestjs/common';
import type { AuditLogsService } from '../audit-logs/audit-logs.service';
import { SchedulesRepository } from './schedules.repository';
import { SchedulesService } from './schedules.service';

describe('Work schedule matrix', () => {
  const repository = {
    findActiveClinicStaff: jest.fn(),
    findApprovedLeaveRequests: jest.fn(),
    findWorkSchedules: jest.fn(),
    findBookedAppointmentSlots: jest.fn(),
  };
  const service = new SchedulesService(
    repository as unknown as SchedulesRepository,
    {} as AuditLogsService,
  );
  const query = { from: '2026-11-15', to: '2026-11-21' };
  const doctor = (id: string) => ({
    id,
    fullName: id,
    role: { name: 'DOCTOR' },
    doctor: {
      id: `doctor-${id}`,
      doctorCode: id,
      specialty: { name: 'Nội khoa' },
    },
  });
  const schedule = (staffUserId: string, startHour = '08', endHour = '12') => ({
    staffUserId,
    staffType: 'DOCTOR',
    startsAt: new Date(`2026-11-16T${startHour}:00:00+07:00`),
    endsAt: new Date(`2026-11-16T${endHour}:00:00+07:00`),
    dayOfWeek: 1,
    effectiveFrom: new Date('2026-11-01T00:00:00Z'),
    effectiveTo: null,
  });
  const slot = (doctorId: string, startsAt: string, endsAt: string) => ({
    startsAt: new Date(`${startsAt}+07:00`),
    endsAt: new Date(`${endsAt}+07:00`),
    doctorSchedule: { doctorId },
  });

  beforeEach(() => {
    jest.resetAllMocks();
    repository.findActiveClinicStaff.mockResolvedValue([
      doctor('a'),
      doctor('b'),
    ]);
    repository.findApprovedLeaveRequests.mockResolvedValue([]);
    repository.findWorkSchedules.mockResolvedValue([
      schedule('a'),
      schedule('a', '13', '18'),
      schedule('b'),
    ]);
    repository.findBookedAppointmentSlots.mockResolvedValue([]);
  });

  it('counts booked slots by doctor and shift boundaries in clinic time', async () => {
    repository.findBookedAppointmentSlots.mockResolvedValue([
      slot('doctor-a', '2026-11-16T08:00:00', '2026-11-16T08:30:00'),
      slot('doctor-a', '2026-11-16T11:30:00', '2026-11-16T12:00:00'),
      slot('doctor-a', '2026-11-16T13:00:00', '2026-11-16T13:30:00'),
      slot('doctor-b', '2026-11-16T08:00:00', '2026-11-16T08:30:00'),
      slot('doctor-a', '2026-11-16T07:30:00', '2026-11-16T08:00:00'),
      slot('doctor-a', '2026-11-16T11:45:00', '2026-11-16T12:15:00'),
      slot('doctor-a', '2026-11-16T12:00:00', '2026-11-16T12:30:00'),
      slot('doctor-a', '2026-11-17T08:00:00', '2026-11-17T08:30:00'),
    ]);
    repository.findApprovedLeaveRequests.mockResolvedValue([
      {
        staffUserId: 'a',
        doctorId: 'doctor-a',
        startsAt: new Date('2026-11-16T13:00:00+07:00'),
        endsAt: new Date('2026-11-16T18:00:00+07:00'),
      },
    ]);

    const result = await service.getWorkScheduleMatrix(query);

    expect(result.dates).toHaveLength(7);
    expect(result.dates[0]).toBe('2026-11-15');
    expect(result.dates[6]).toBe('2026-11-21');
    expect(result.staff[0].shifts).toEqual([
      expect.objectContaining({
        date: '2026-11-16',
        key: 'MORNING',
        startsAt: '2026-11-16T01:00:00.000Z',
        slotCount: 2,
        slotCapacity: 8,
        status: 'PUBLISHED',
      }),
      expect.objectContaining({
        key: 'AFTERNOON',
        slotCount: 1,
        status: 'ABSENT',
      }),
    ]);
    expect(result.staff[1].shifts[0].slotCount).toBe(1);
    expect(repository.findBookedAppointmentSlots).toHaveBeenCalledTimes(1);
    expect(repository.findBookedAppointmentSlots).toHaveBeenCalledWith(
      ['doctor-a', 'doctor-b'],
      new Date('2026-11-14T17:00:00Z'),
      new Date('2026-11-21T17:00:00Z'),
    );
  });

  it('keeps booking reads constant for a matrix with hundreds of shifts', async () => {
    const staff = Array.from({ length: 67 }, (_, index) => doctor(`${index}`));
    repository.findActiveClinicStaff.mockResolvedValue(staff);
    repository.findWorkSchedules.mockResolvedValue(
      staff.flatMap((user) =>
        Array.from({ length: 6 }, (_, index) => [
          { ...schedule(user.id), dayOfWeek: index + 1 },
          { ...schedule(user.id, '13', '18'), dayOfWeek: index + 1 },
        ]).flat(),
      ),
    );

    const result = await service.getWorkScheduleMatrix(query);

    expect(result.staff.flatMap((user) => user.shifts)).toHaveLength(804);
    expect(repository.findBookedAppointmentSlots).toHaveBeenCalledTimes(1);
  });

  it('caps occupied slots at the shift capacity', async () => {
    repository.findBookedAppointmentSlots.mockResolvedValue(
      Array.from({ length: 10 }, () =>
        slot('doctor-a', '2026-11-16T08:00:00', '2026-11-16T08:30:00'),
      ),
    );
    const result = await service.getWorkScheduleMatrix(query);
    expect(result.staff[0].shifts[0].slotCount).toBe(8);
  });

  it('keeps receptionist shifts at zero capacity', async () => {
    repository.findActiveClinicStaff.mockResolvedValue([
      {
        id: 'receptionist',
        fullName: 'Lễ tân',
        role: { name: 'RECEPTIONIST' },
        doctor: null,
      },
    ]);
    repository.findWorkSchedules.mockResolvedValue([
      { ...schedule('receptionist'), staffType: 'RECEPTIONIST' },
    ]);
    const result = await service.getWorkScheduleMatrix(query);
    expect(result.staff[0].shifts[0]).toEqual(
      expect.objectContaining({ slotCount: 0, slotCapacity: 0 }),
    );
  });

  it.each([
    { from: '2026-11-21', to: '2026-11-15' },
    { from: '2026-11-01', to: '2026-12-02' },
  ])('rejects invalid ranges before reading bookings: %j', async (range) => {
    await expect(service.getWorkScheduleMatrix(range)).rejects.toThrow(
      BadRequestException,
    );
    expect(repository.findActiveClinicStaff).not.toHaveBeenCalled();
    expect(repository.findBookedAppointmentSlots).not.toHaveBeenCalled();
  });
});
