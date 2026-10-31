import {
  BadRequestException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { PaginationDto } from '../../common/dto/pagination.dto';
import { PrismaService } from '../database/services/prisma.service';
import { CurrentUserDto } from '../users/dto/responses/current-user.dto';
import { MedicalRecordsService } from './medical-records.service';

describe('My medical records', () => {
  const actor = {
    id: '11111111-1111-4111-8111-111111111111',
    role: 'PATIENT',
    permissions: ['MEDICAL_RECORDS_READ_ME'],
  } as CurrentUserDto;
  const session = {
    id: 'session',
    status: 'COMPLETED',
    appointment: {
      id: 'appointment',
      appointmentCode: 'LH01',
      status: 'CONFIRMED',
      patient: {
        id: 'patient',
        patientCode: 'BN01',
        fullName: 'Nguyễn An',
        dateOfBirth: new Date('2000-01-01'),
        gender: 'MALE',
      },
    },
    specialty: { id: 'specialty', name: 'Nội khoa', roomCode: 'P01' },
    appointmentSlot: {
      id: 'slot',
      startsAt: new Date(),
      endsAt: new Date(),
      doctorSchedule: {
        doctor: { id: 'doctor', user: { fullName: 'Bác sĩ A' } },
      },
    },
  };
  const consultation = {
    id: 'consultation',
    careSessionId: session.id,
    startedAt: null,
    completedAt: null,
    followUpDate: new Date('2026-11-01'),
    careSession: session,
    diagnoses: [],
  };
  const db = {
    $transaction: jest.fn((queries: Promise<unknown>[]) =>
      Promise.all(queries),
    ),
    consultation: {
      findMany: jest.fn(),
      count: jest.fn(),
      findFirst: jest.fn(),
    },
    patientMedicalRecord: { findMany: jest.fn(), count: jest.fn() },
  };
  const service = new MedicalRecordsService(db as unknown as PrismaService);
  const ownPublished = {
    lockedAt: { not: null },
    careSession: {
      status: 'COMPLETED',
      appointment: { patient: { userId: actor.id } },
    },
  };

  beforeEach(() => {
    jest.clearAllMocks();
    db.consultation.findMany.mockResolvedValue([consultation]);
    db.consultation.count.mockResolvedValue(1);
    db.consultation.findFirst.mockResolvedValue(consultation);
    db.patientMedicalRecord.findMany.mockResolvedValue([]);
    db.patientMedicalRecord.count.mockResolvedValue(0);
  });

  it('scopes both list and count to the owner, completed status and publication lock', async () => {
    const response = await service.listConsultations(
      new PaginationDto(),
      actor,
    );
    expect(db.consultation.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: ownPublished }),
    );
    expect(db.consultation.count).toHaveBeenCalledWith({ where: ownPublished });
    expect(response.items[0]).toMatchObject({
      appointmentCode: 'LH01',
      startedAt: null,
      primaryDiagnosis: null,
      followUpDate: '2026-11-01',
      doctor: { id: 'doctor', fullName: 'Bác sĩ A' },
    });
    expect(response.items[0]).not.toHaveProperty('careSession');
    expect(db.$transaction).toHaveBeenCalledWith(expect.any(Array), {
      isolationLevel: 'RepeatableRead',
    });
  });

  it('filters by full inclusive UTC+7 days, paginates and orders newest first', async () => {
    await service.listConsultations(
      { page: 2, limit: 5, startDate: '2026-10-01', endDate: '2026-10-02' },
      actor,
    );
    expect(db.consultation.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          ...ownPublished,
          startedAt: {
            gte: new Date('2026-09-30T17:00:00Z'),
            lt: new Date('2026-10-02T17:00:00Z'),
          },
        },
        skip: 5,
        take: 5,
        orderBy: [
          { startedAt: { sort: 'desc', nulls: 'last' } },
          { id: 'desc' },
        ],
      }),
    );
  });

  it.each([
    { startDate: '2026-10-01' },
    { startDate: '2026-10-02', endDate: '2026-10-01' },
  ])('rejects an invalid range: %j', async (range) => {
    await expect(
      service.listConsultations({ ...new PaginationDto(), ...range }, actor),
    ).rejects.toBeInstanceOf(BadRequestException);
    expect(db.consultation.findMany).not.toHaveBeenCalled();
  });

  it('returns detail without account/contact/session internals', async () => {
    const detail = await service.getConsultation('consultation', actor);
    expect(db.consultation.findFirst).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { ...ownPublished, id: 'consultation' },
      }),
    );
    expect(detail).toMatchObject({
      room: 'P01',
      patient: { dateOfBirth: '2000-01-01' },
      followUpDate: '2026-11-01',
    });
    expect(detail).not.toHaveProperty('careSession');
    expect(detail).not.toHaveProperty('patient.user');
    expect(detail).not.toHaveProperty('slot.doctorSchedule');
  });

  it('returns the same 404 for a foreign, draft or missing consultation', async () => {
    db.consultation.findFirst.mockResolvedValueOnce(null);
    await expect(
      service.getConsultation('foreign-or-draft', actor),
    ).rejects.toBeInstanceOf(NotFoundException);
  });

  it('scopes history/allergy filters and count to the same authenticated patient', async () => {
    await service.listRecords(
      { ...new PaginationDto(), recordType: 'ALLERGY', status: 'CONFIRMED' },
      actor,
    );
    const where = {
      patient: { userId: actor.id },
      recordType: 'ALLERGY',
      status: 'CONFIRMED',
    };
    expect(db.patientMedicalRecord.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ where }),
    );
    expect(db.patientMedicalRecord.count).toHaveBeenCalledWith({ where });
  });

  it('returns an empty paginated list when no completed consultations exist', async () => {
    db.consultation.findMany.mockResolvedValueOnce([]);
    db.consultation.count.mockResolvedValueOnce(0);
    await expect(
      service.listConsultations(new PaginationDto(), actor),
    ).resolves.toMatchObject({
      items: [],
      pagination: { totalItems: 0, totalPages: 0 },
    });
  });

  it.each([
    { ...actor, role: 'ADMIN' },
    { ...actor, role: 'DOCTOR' },
    { ...actor, permissions: [] },
  ])('denies other roles or missing self-read permissions', async (user) => {
    await expect(
      service.listConsultations(new PaginationDto(), user),
    ).rejects.toBeInstanceOf(ForbiddenException);
    expect(db.consultation.findMany).not.toHaveBeenCalled();
  });
});
