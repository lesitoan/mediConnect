import {
  type ArgumentsHost,
  BadRequestException,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import type { Prisma } from '../../generated/prisma/client';
import type { PrismaService } from '../database/services/prisma.service';
import type { CurrentUserDto } from '../users/dto/responses/current-user.dto';
import { AuditLogsService } from '../audit-logs/audit-logs.service';
import { ProvidersService } from './providers.service';
import type { UsersService } from '../users/services/users.service';
import type { SpecialtiesService } from '../specialties/specialties.service';
import { PublicSearchQueryDto } from '../../common/dto/public-search-query.dto';
import {
  DoctorPauseConflictException,
  DoctorPauseConflictFilter,
} from './doctor-pause-conflict.exception';

describe('AI doctor lookups', () => {
  it('hides doctors with an active pause or an unavailable account role', async () => {
    const findMany = jest.fn().mockResolvedValue([]);
    const service = new ProvidersService(
      {
        doctor: { findMany, count: jest.fn().mockResolvedValue(0) },
      } as unknown as PrismaService,
      {} as AuditLogsService,
      {} as UsersService,
      {} as SpecialtiesService,
    );
    await service.search(new PublicSearchQueryDto());
    expect(findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          leaveRequests: {
            none: {
              source: 'ADMIN_PAUSE',
              status: 'APPROVED',
              startsAt: { lte: expect.any(Date) as unknown },
              OR: [
                { endsAt: null },
                { endsAt: { gt: expect.any(Date) as unknown } },
              ],
            },
          },
          user: {
            status: 'ACTIVE',
            deletedAt: null,
            role: { name: 'DOCTOR', status: 'ACTIVE', deletedAt: null },
          },
        }) as unknown,
      }),
    );
  });
});

describe('Doctor pause scheduling', () => {
  const doctorId = '11111111-1111-4111-8111-111111111111';
  const actor = {
    id: '22222222-2222-4222-8222-222222222222',
    name: 'Admin',
  } as CurrentUserDto;
  const pauses: {
    startsAt: Date;
    endsAt: Date | null;
    status: 'APPROVED' | 'CANCELLED' | 'PENDING';
  }[] = [];
  const tx = {
    $queryRaw: jest.fn().mockResolvedValue([{ id: doctorId }]),
    doctor: { findFirst: jest.fn().mockResolvedValue({ id: doctorId }) },
    leaveRequest: {
      findFirst: jest.fn(
        ({
          where,
        }: {
          where: {
            startsAt?: { lt: Date };
            OR: [{ endsAt: null }, { endsAt: { gt: Date } }];
          };
        }) =>
          Promise.resolve(
            pauses.find(
              (pause) =>
                pause.status === 'APPROVED' &&
                (!where.startsAt || pause.startsAt < where.startsAt.lt) &&
                (!pause.endsAt || pause.endsAt > where.OR[1].endsAt.gt),
            ) ?? null,
          ),
      ),
      create: jest.fn(
        ({ data }: { data: { startsAt: Date; endsAt: Date | null } }) => {
          const pause = { ...data, id: 'pause-1', status: 'APPROVED' as const };
          pauses.push(pause);
          return Promise.resolve(pause);
        },
      ),
    },
    careSession: { findMany: jest.fn().mockResolvedValue([]) },
  };
  const audit = { record: jest.fn().mockResolvedValue(undefined) };
  const prisma = {
    schemaName: 'public',
    $transaction: (action: (client: typeof tx) => unknown) => action(tx),
  } as unknown as PrismaService;
  const service = new ProvidersService(
    prisma,
    audit as unknown as AuditLogsService,
    {} as UsersService,
    {} as SpecialtiesService,
  );
  const client = tx as unknown as Prisma.TransactionClient;

  beforeEach(() => {
    pauses.length = 0;
    jest.clearAllMocks();
    jest
      .spyOn(Date, 'now')
      .mockReturnValue(new Date('2030-01-01T00:00:00Z').getTime());
  });
  afterEach(() => jest.restoreAllMocks());

  it('blocks booking only when the requested interval overlaps the planned pause', async () => {
    await service.createPause(
      doctorId,
      { startsAt: '2030-01-10T08:00:00Z', endsAt: '2030-01-10T17:00:00Z' },
      actor,
    );
    const check = (start: string, end: string) =>
      service.assertBookable(client, doctorId, new Date(start), new Date(end));
    await expect(
      check('2030-01-09T08:00:00Z', '2030-01-09T09:00:00Z'),
    ).resolves.toBeUndefined();
    await expect(
      check('2030-01-10T07:00:00Z', '2030-01-10T08:00:00Z'),
    ).resolves.toBeUndefined();
    await expect(
      check('2030-01-10T07:59:00Z', '2030-01-10T08:01:00Z'),
    ).rejects.toThrow(ConflictException);
    await expect(
      check('2030-01-10T16:59:00Z', '2030-01-10T17:01:00Z'),
    ).rejects.toThrow(ConflictException);
    await expect(
      check('2030-01-10T17:00:00Z', '2030-01-10T18:00:00Z'),
    ).resolves.toBeUndefined();
    expect(tx.leaveRequest.create.mock.calls[0][0].data).toMatchObject({
      source: 'ADMIN_PAUSE',
      status: 'APPROVED',
      reviewedBy: actor.id,
    });
  });

  it('reports current pause only from its scheduled start until its end', async () => {
    jest.useFakeTimers();
    try {
      const start = new Date('2030-01-10T08:00:00Z');
      const end = new Date('2030-01-10T17:00:00Z');
      const findFirst = jest.fn(
        ({
          select,
          where: doctorWhere,
        }: {
          select: {
            leaveRequests: {
              where: {
                source: string;
                status: string;
                startsAt: { lte: Date };
              };
            };
          };
          where: { leaveRequests?: { none: unknown } };
        }) => {
          const where = select.leaveRequests.where;
          const now = where.startsAt.lte;
          const isActive =
            where.source === 'ADMIN_PAUSE' &&
            where.status === 'APPROVED' &&
            start <= now &&
            now < end;
          if (isActive && doctorWhere.leaveRequests?.none)
            return Promise.resolve(null);
          return Promise.resolve({
            id: doctorId,
            isActive: true,
            leaveRequests: isActive ? [{ id: 'pause' }] : [],
          });
        },
      );
      const local = new ProvidersService(
        {
          doctor: { findFirst },
        } as unknown as PrismaService,
        audit as unknown as AuditLogsService,
        {} as UsersService,
        {} as SpecialtiesService,
      );
      jest.setSystemTime(new Date('2030-01-10T07:59:59Z'));
      expect(await local.get(doctorId, false)).toMatchObject({
        isPaused: false,
        isActive: true,
      });
      jest.setSystemTime(new Date('2030-01-10T08:00:00Z'));
      expect(await local.get(doctorId, true)).toMatchObject({
        isPaused: true,
        isActive: false,
      });
      await expect(local.get(doctorId, false)).rejects.toThrow(
        NotFoundException,
      );
      jest.setSystemTime(new Date('2030-01-10T17:00:00Z'));
      expect(await local.get(doctorId, false)).toMatchObject({
        isPaused: false,
        isActive: true,
      });
    } finally {
      jest.useRealTimers();
    }
  });

  it('supports indefinite pauses and ignores cancelled pauses', async () => {
    await service.createPause(
      doctorId,
      { startsAt: '2030-01-20T08:00:00Z' },
      actor,
    );
    const check = () =>
      service.assertBookable(
        client,
        doctorId,
        new Date('2031-01-01T08:00:00Z'),
        new Date('2031-01-01T09:00:00Z'),
      );
    await expect(check()).rejects.toThrow(ConflictException);
    pauses[0].status = 'CANCELLED';
    await expect(check()).resolves.toBeUndefined();
  });

  it('blocks an approved leave request, but not a pending request', async () => {
    pauses.push({
      startsAt: new Date('2030-01-10T08:00:00Z'),
      endsAt: new Date('2030-01-10T17:00:00Z'),
      status: 'PENDING',
    });
    const check = () =>
      service.assertBookable(
        client,
        doctorId,
        new Date('2030-01-10T09:00:00Z'),
        new Date('2030-01-10T10:00:00Z'),
      );
    await expect(check()).resolves.toBeUndefined();
    pauses[0].status = 'APPROVED';
    await expect(check()).rejects.toThrow(ConflictException);
  });

  it('rejects a pause when there are appointments to resolve and preserves those appointments', async () => {
    const session = (id: string) => ({
      id,
      status: 'SCHEDULED',
      appointment: {
        id: `appointment-${id}`,
        appointmentCode: `A-${id}`,
        status: 'CONFIRMED',
        patient: {
          id: `patient-${id}`,
          patientCode: `P-${id}`,
          fullName: 'Patient',
        },
      },
      appointmentSlot: {
        id: `slot-${id}`,
        startsAt: new Date('2030-01-10T09:00:00Z'),
        endsAt: new Date('2030-01-10T10:00:00Z'),
      },
    });
    tx.careSession.findMany.mockResolvedValueOnce([session('1'), session('2')]);
    const error = await service
      .createPause(doctorId, { startsAt: '2030-01-10T08:00:00Z' }, actor)
      .catch((caught: unknown) => caught);
    expect(error).toBeInstanceOf(DoctorPauseConflictException);
    expect((error as DoctorPauseConflictException).getResponse()).toMatchObject(
      {
        statusCode: 409,
        code: 'DOCTOR_PAUSE_APPOINTMENT_CONFLICT',
        affectedAppointments: [
          {
            careSessionId: '1',
            appointmentId: 'appointment-1',
            patient: { patientCode: 'P-1' },
          },
          {
            careSessionId: '2',
            appointmentId: 'appointment-2',
            patient: { patientCode: 'P-2' },
          },
        ],
      },
    );
    const response = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
      setHeader: jest.fn(),
    };
    const host = {
      switchToHttp: () => ({ getResponse: () => response }),
    } as unknown as ArgumentsHost;
    new DoctorPauseConflictFilter().catch(
      error as DoctorPauseConflictException,
      host,
    );
    expect(response.status).toHaveBeenCalledWith(409);
    expect(response.json).toHaveBeenCalledWith(
      (error as DoctorPauseConflictException).getResponse(),
    );
    expect(response.setHeader).toHaveBeenCalledWith(
      'Cache-Control',
      'no-store',
    );
    expect(tx.careSession.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          status: { notIn: ['CANCELLED', 'NO_SHOW'] },
          appointment: { status: { not: 'CANCELLED' } },
          appointmentSlot: {
            doctorSchedule: { doctorId },
            endsAt: { gt: new Date('2030-01-10T08:00:00Z') },
          },
        },
      }),
    );
    expect(tx.leaveRequest.create).not.toHaveBeenCalled();
    expect(audit.record).not.toHaveBeenCalled();
  });

  it('records the scheduled pause in the same transaction', async () => {
    await service.createPause(
      doctorId,
      { startsAt: '2030-01-10T08:00:00Z', endsAt: '2030-01-10T17:00:00Z' },
      actor,
    );
    expect(audit.record).toHaveBeenCalledWith(
      expect.objectContaining({
        actionCode: 'DOCTOR_PAUSE_SCHEDULE',
        targetId: doctorId,
        after: expect.objectContaining({
          pauseId: 'pause-1',
          startsAt: '2030-01-10T08:00:00.000Z',
          endsAt: '2030-01-10T17:00:00.000Z',
          status: 'APPROVED',
        }) as unknown,
      }),
      tx,
    );
  });

  it('uses exclusive slot boundaries for a finite pause', async () => {
    await service.createPause(
      doctorId,
      { startsAt: '2030-01-10T08:00:00Z', endsAt: '2030-01-10T17:00:00Z' },
      actor,
    );
    expect(tx.careSession.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          status: { notIn: ['CANCELLED', 'NO_SHOW'] },
          appointment: { status: { not: 'CANCELLED' } },
          appointmentSlot: {
            doctorSchedule: { doctorId },
            endsAt: { gt: new Date('2030-01-10T08:00:00Z') },
            startsAt: { lt: new Date('2030-01-10T17:00:00Z') },
          },
        },
      }),
    );
  });

  it('rejects overlapping plans and invalid dates without recording a new pause', async () => {
    await service.createPause(
      doctorId,
      { startsAt: '2030-01-10T08:00:00Z', endsAt: '2030-01-10T17:00:00Z' },
      actor,
    );
    await expect(
      service.createPause(
        doctorId,
        { startsAt: '2030-01-10T16:00:00Z', endsAt: '2030-01-10T18:00:00Z' },
        actor,
      ),
    ).rejects.toThrow(ConflictException);
    await expect(
      service.createPause(
        doctorId,
        { startsAt: '2029-12-31T00:00:00Z' },
        actor,
      ),
    ).rejects.toThrow(BadRequestException);
    await expect(
      service.createPause(
        doctorId,
        { startsAt: '2030-01-11T00:00:00Z', endsAt: '2030-01-11T00:00:00Z' },
        actor,
      ),
    ).rejects.toThrow(BadRequestException);
    expect(tx.leaveRequest.create).toHaveBeenCalledTimes(1);
  });
});

describe('Doctor mutation audit', () => {
  const actor = {
    id: '22222222-2222-4222-8222-222222222222',
    name: 'Admin',
  } as CurrentUserDto;
  const before = {
    id: 'doctor',
    userId: 'user',
    specialtyId: 'specialty',
    doctorCode: 'OLD',
    licenseNumber: 'license',
    academicTitle: null,
    qualification: 'old qualification',
    bio: 'old bio',
    avatarUrl: null,
  };
  const after = {
    ...before,
    doctorCode: 'NEW',
    bio: 'new bio',
    leaveRequests: [],
  };
  const pause = {
    id: 'pause',
    startsAt: new Date('2030-01-10T08:00:00Z'),
    endsAt: null,
    status: 'APPROVED',
  };
  const cancelled = {
    ...pause,
    status: 'CANCELLED',
    updatedAt: new Date('2030-01-11T08:00:00Z'),
  };
  const tx = {
    $queryRaw: jest.fn().mockResolvedValue([{ id: 'doctor' }]),
    user: { findFirst: jest.fn().mockResolvedValue({ id: 'user' }) },
    specialty: { findFirst: jest.fn().mockResolvedValue({ id: 'specialty' }) },
    doctorSchedule: {
      findFirst: jest.fn().mockResolvedValue({ id: 'future-schedule' }),
    },
    doctor: {
      create: jest.fn().mockResolvedValue(before),
      findFirst: jest
        .fn()
        .mockResolvedValue({ ...before, isActive: true, leaveRequests: [] }),
      findUnique: jest.fn().mockResolvedValue(before),
      findUniqueOrThrow: jest
        .fn()
        .mockResolvedValue({ specialtyId: 'specialty', isActive: true }),
      update: jest.fn().mockResolvedValue(after),
    },
    leaveRequest: {
      findFirst: jest.fn().mockResolvedValue(pause),
      update: jest.fn().mockResolvedValue(cancelled),
    },
    auditLog: { create: jest.fn().mockResolvedValue({}) },
  };
  const audit = { record: jest.fn().mockResolvedValue(undefined) };
  const users = {
    createStaffAccount: jest.fn().mockResolvedValue({ id: 'user' }),
    assertAdminPermissions: jest.fn().mockResolvedValue([]),
    withLockedAccount: (
      _id: string,
      action: (client: Prisma.TransactionClient) => unknown,
    ) => action(tx as unknown as Prisma.TransactionClient),
  };
  const specialties = {
    lock: jest.fn().mockResolvedValue({ id: 'specialty', isActive: true }),
  };
  const prisma = {
    schemaName: 'public',
    $transaction: (fn: (client: typeof tx) => unknown) => fn(tx),
  } as unknown as PrismaService;
  const service = new ProvidersService(
    prisma,
    audit as unknown as AuditLogsService,
    users as unknown as UsersService,
    specialties as unknown as SpecialtiesService,
  );

  beforeEach(() => jest.clearAllMocks());

  it('records doctor creation and profile changes through the shared writer', async () => {
    await service.create(
      {
        fullName: 'Doctor',
        phone: '+84901234567',
        specialtyId: 'specialty',
        doctorCode: 'OLD',
        licenseNumber: 'license',
      },
      actor,
    );
    expect(users.createStaffAccount).toHaveBeenCalledWith(tx, {
      fullName: 'Doctor',
      phone: '+84901234567',
      role: 'DOCTOR',
    });
    expect(tx.doctor.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          userId: 'user',
          specialtyId: 'specialty',
          doctorCode: 'OLD',
        }) as unknown,
      }),
    );
    expect(audit.record).toHaveBeenCalledWith(
      expect.objectContaining({
        actionCode: 'DOCTOR_CREATE',
        targetId: 'doctor',
        after: expect.objectContaining({
          userId: 'user',
          doctorCode: 'OLD',
          specialtyId: 'specialty',
        }) as unknown,
      }),
      tx,
    );
    await service.update(
      'doctor',
      { doctorCode: 'NEW', bio: 'new bio' },
      actor,
    );
    expect(audit.record).toHaveBeenLastCalledWith(
      expect.objectContaining({
        actionCode: 'DOCTOR_UPDATE',
        targetId: 'doctor',
        before: { doctorCode: 'OLD', bioChanged: false },
        after: { doctorCode: 'NEW', bioChanged: true },
      }),
      tx,
    );
  });

  it('treats an uppercase spelling of the current specialty UUID as no change even with future schedules', async () => {
    const current = {
      ...before,
      specialtyId: 'abcdefab-cdef-4abc-8abc-abcdefabcdef',
    };
    tx.doctor.findUnique.mockResolvedValueOnce(current);
    tx.doctor.findFirst.mockResolvedValueOnce({
      ...current,
      isActive: true,
      leaveRequests: [],
    });
    await expect(
      service.update(
        'doctor',
        { specialtyId: current.specialtyId.toUpperCase() },
        actor,
      ),
    ).resolves.toMatchObject({ specialtyId: current.specialtyId });
    expect(specialties.lock).not.toHaveBeenCalled();
    expect(tx.doctorSchedule.findFirst).not.toHaveBeenCalled();
    expect(tx.doctor.update).not.toHaveBeenCalled();
    expect(audit.record).not.toHaveBeenCalled();
  });

  it('records the exact pause and cancellation time', async () => {
    await service.cancelPause('doctor', 'pause', actor);
    expect(audit.record).toHaveBeenCalledWith(
      expect.objectContaining({
        actionCode: 'DOCTOR_PAUSE_CANCEL',
        targetId: 'doctor',
        before: {
          pauseId: 'pause',
          startsAt: '2030-01-10T08:00:00.000Z',
          endsAt: null,
          status: 'APPROVED',
        },
        after: {
          pauseId: 'pause',
          status: 'CANCELLED',
          cancelledAt: '2030-01-11T08:00:00.000Z',
        },
      }),
      tx,
    );
  });

  it('does not cancel or audit a pause that has already ended', async () => {
    const endsAt = new Date('2030-01-11T08:00:00Z');
    jest.spyOn(Date, 'now').mockReturnValue(endsAt.getTime());
    tx.leaveRequest.findFirst.mockResolvedValueOnce({ ...pause, endsAt });
    try {
      await expect(
        service.cancelPause('doctor', 'pause', actor),
      ).rejects.toThrow(ConflictException);
      expect(tx.leaveRequest.update).not.toHaveBeenCalled();
      expect(audit.record).not.toHaveBeenCalled();
    } finally {
      jest.restoreAllMocks();
    }
  });

  it('does not resume a doctor while their specialty is inactive', async () => {
    specialties.lock.mockResolvedValueOnce({
      id: 'specialty',
      isActive: false,
    });
    await expect(service.cancelPause('doctor', 'pause', actor)).rejects.toThrow(
      ConflictException,
    );
    expect(tx.leaveRequest.update).not.toHaveBeenCalled();
    expect(audit.record).not.toHaveBeenCalled();
  });

  it('propagates audit failure to the caller transaction', async () => {
    audit.record.mockRejectedValueOnce(new Error('audit unavailable'));
    await expect(service.cancelPause('doctor', 'pause', actor)).rejects.toThrow(
      'audit unavailable',
    );
  });

  it('propagates audit failure when creating an account and profile', async () => {
    audit.record.mockRejectedValueOnce(new Error('audit unavailable'));
    await expect(
      service.create(
        {
          fullName: 'Doctor',
          phone: '+84901234567',
          specialtyId: 'specialty',
          doctorCode: 'OLD',
          licenseNumber: 'license',
        },
        actor,
      ),
    ).rejects.toThrow('audit unavailable');
    expect(users.createStaffAccount).toHaveBeenCalledWith(
      tx,
      expect.objectContaining({ role: 'DOCTOR' }),
    );
    expect(audit.record).toHaveBeenCalledWith(expect.anything(), tx);
  });

  it('passes profile changes through the real audit writer', async () => {
    const integrated = new ProvidersService(
      prisma,
      new AuditLogsService(prisma),
      users as unknown as UsersService,
      specialties as unknown as SpecialtiesService,
    );
    await integrated.update(
      'doctor',
      { doctorCode: 'NEW', bio: 'new bio' },
      actor,
    );
    expect(tx.auditLog.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          actionCode: 'DOCTOR_UPDATE',
          beforeSnapshot: { doctorCode: 'OLD', bioChanged: false },
          afterSnapshot: { doctorCode: 'NEW', bioChanged: true },
        }) as unknown,
      }),
    );
  });

  it('locks the specialty before allocating the account email in the shared creation flow', async () => {
    await service.createWithAccount(tx as unknown as Prisma.TransactionClient, {
      fullName: 'Doctor',
      phone: '+84901234567',
      specialtyId: 'specialty',
      doctorCode: 'OLD',
      licenseNumber: 'license',
    });
    expect(specialties.lock.mock.invocationCallOrder[0]).toBeLessThan(
      users.createStaffAccount.mock.invocationCallOrder[0],
    );
  });

  it('returns the current profile without a write or audit when the input is unchanged', async () => {
    const result = await service.update(
      'doctor',
      { doctorCode: 'OLD', bio: 'old bio' },
      actor,
    );
    expect(result).toMatchObject({
      id: 'doctor',
      doctorCode: 'OLD',
      isPaused: false,
    });
    expect(tx.doctor.update).not.toHaveBeenCalled();
    expect(audit.record).not.toHaveBeenCalled();
    expect(tx.doctor.findFirst).toHaveBeenCalled();
  });
});
