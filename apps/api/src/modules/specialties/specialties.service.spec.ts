import { ConflictException, NotFoundException } from '@nestjs/common';
import type { PrismaService } from '../database/services/prisma.service';
import type { AuditLogsService } from '../audit-logs/audit-logs.service';
import type { CurrentUserDto } from '../users/dto/responses/current-user.dto';
import { SpecialtiesService } from './specialties.service';
import { SpecialtyQueryDto } from './dto/specialty-query.dto';

describe('Specialty catalog', () => {
  const id = '11111111-1111-4111-8111-111111111111';
  const actor = {
    id: '22222222-2222-4222-8222-222222222222',
    name: 'Admin',
  } as CurrentUserDto;
  const record = {
    id,
    code: 'CARD',
    name: 'Cardiology',
    roomCode: 'P01',
    description: null,
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  };
  const tx = {
    $queryRaw: jest.fn(),
    specialty: {
      findMany: jest.fn(),
      count: jest.fn(),
      findFirst: jest.fn(),
      findUniqueOrThrow: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    },
    doctor: { findFirst: jest.fn() },
  };
  const audit = { record: jest.fn() };
  const prisma = {
    schemaName: 'public',
    specialty: tx.specialty,
    $transaction: (
      arg: Promise<unknown>[] | ((client: typeof tx) => unknown),
    ) => (Array.isArray(arg) ? Promise.all(arg) : arg(tx)),
  } as unknown as PrismaService;
  const service = new SpecialtiesService(
    prisma,
    audit as unknown as AuditLogsService,
  );

  beforeEach(() => {
    jest.resetAllMocks();
    tx.$queryRaw.mockResolvedValue([{ id, isActive: true }]);
    tx.specialty.findUniqueOrThrow.mockResolvedValue(record);
    tx.specialty.create.mockResolvedValue(record);
    tx.specialty.update.mockResolvedValue(record);
    tx.specialty.findMany.mockResolvedValue([record]);
    tx.specialty.count.mockResolvedValue(1);
    tx.doctor.findFirst.mockResolvedValue(null);
    audit.record.mockResolvedValue(undefined);
  });

  it('filters public searches to active specialties and hides inactive detail', async () => {
    const query = Object.assign(new SpecialtyQueryDto(), { search: 'card' });
    const result = await service.list(query, false);
    expect(result.pagination.totalItems).toBe(1);
    expect(tx.specialty.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ isActive: true }) as unknown,
      }),
    );
    tx.specialty.findFirst.mockResolvedValue(null);
    await expect(service.get(id, false)).rejects.toThrow(NotFoundException);
    expect(tx.specialty.findFirst).toHaveBeenCalledWith(
      expect.objectContaining({ where: { id, isActive: true } }),
    );
    await service.list(query, true);
    const calls = tx.specialty.findMany.mock.calls as unknown as Array<
      [{ where: object }]
    >;
    expect(calls[1][0].where).not.toHaveProperty('isActive');
  });

  it('blocks pausing when any doctor could resume after a finite pause', async () => {
    tx.doctor.findFirst.mockResolvedValue({ id: 'doctor' });
    await expect(service.setStatus(id, false, actor)).rejects.toThrow(
      ConflictException,
    );
    expect(tx.doctor.findFirst).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          specialtyId: id,
          isActive: true,
          leaveRequests: {
            none: {
              source: 'ADMIN_PAUSE',
              status: 'APPROVED',
              startsAt: { lte: expect.any(Date) as unknown },
              endsAt: null,
            },
          },
        }) as unknown,
      }),
    );
    expect(tx.specialty.update).not.toHaveBeenCalled();
    expect(audit.record).not.toHaveBeenCalled();
  });

  it('pauses after all doctors are inactive or indefinitely paused, then audits in the same transaction', async () => {
    tx.specialty.update.mockResolvedValue({ ...record, isActive: false });
    await expect(service.setStatus(id, false, actor)).resolves.toMatchObject({
      isActive: false,
    });
    expect(tx.$queryRaw).toHaveBeenCalledTimes(1);
    expect(tx.specialty.update).toHaveBeenCalledWith(
      expect.objectContaining({ where: { id }, data: { isActive: false } }),
    );
    expect(audit.record).toHaveBeenCalledWith(
      expect.objectContaining({
        actionCode: 'SPECIALTY_DEACTIVATE',
        before: { isActive: true },
        after: { isActive: false },
      }),
      tx,
    );
  });

  it('reactivates a specialty and treats repeated status requests as no-ops', async () => {
    tx.$queryRaw.mockResolvedValueOnce([{ id, isActive: false }]);
    await service.setStatus(id, true, actor);
    expect(audit.record).toHaveBeenCalledWith(
      expect.objectContaining({ actionCode: 'SPECIALTY_ACTIVATE' }),
      tx,
    );
    jest.clearAllMocks();
    tx.$queryRaw.mockResolvedValueOnce([{ id, isActive: true }]);
    await service.setStatus(id, true, actor);
    expect(tx.specialty.update).not.toHaveBeenCalled();
    expect(audit.record).not.toHaveBeenCalled();
  });

  it('records creation and only changed fields; it propagates audit failures', async () => {
    await service.create(
      { code: 'CARD', name: 'Cardiology', roomCode: 'P01' },
      actor,
    );
    expect(audit.record).toHaveBeenCalledWith(
      expect.objectContaining({ actionCode: 'SPECIALTY_CREATE', targetId: id }),
      tx,
    );
    tx.specialty.update.mockResolvedValueOnce({
      ...record,
      name: 'Heart',
      description: 'long description',
    });
    await service.update(
      id,
      { name: 'Heart', description: 'long description' },
      actor,
    );
    expect(audit.record).toHaveBeenLastCalledWith(
      expect.objectContaining({
        actionCode: 'SPECIALTY_UPDATE',
        before: { name: 'Cardiology', descriptionChanged: false },
        after: { name: 'Heart', descriptionChanged: true },
      }),
      tx,
    );
    audit.record.mockRejectedValueOnce(new Error('audit unavailable'));
    await expect(service.setStatus(id, false, actor)).rejects.toThrow(
      'audit unavailable',
    );
  });

  it('does not write or audit an unchanged update', async () => {
    await service.update(id, { name: 'Cardiology' }, actor);
    expect(tx.specialty.update).not.toHaveBeenCalled();
    expect(audit.record).not.toHaveBeenCalled();
  });
});
