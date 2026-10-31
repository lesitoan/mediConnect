import {
  BadRequestException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { AuditLogsService } from '../audit-logs/audit-logs.service';
import { PrismaService } from '../database/services/prisma.service';
import { CurrentUserDto } from '../users/dto/responses/current-user.dto';
import type { Prisma } from '../../generated/prisma/client';
import { PatientsService } from './patients.service';

describe('My patient profile', () => {
  const actor = {
    id: '11111111-1111-4111-8111-111111111111',
    role: 'PATIENT',
    name: 'Nguyễn An',
    permissions: ['PATIENTS_WRITE_ME'],
  } as CurrentUserDto;
  const profile = {
    id: '22222222-2222-4222-8222-222222222222',
    patientCode: 'BN01',
    dateOfBirth: new Date('2000-01-01'),
    gender: 'MALE',
    address: 'Địa chỉ cũ',
    emergencyContactName: null,
    emergencyContactPhone: null,
    user: {
      fullName: actor.name,
      email: 'patient@example.invalid',
      phone: '+84901234567',
    },
  };
  const tx = { patient: { findUnique: jest.fn(), update: jest.fn() } };
  const db = tx as unknown as PrismaService;
  const audit = { record: jest.fn() };
  const service = new PatientsService(db, audit as unknown as AuditLogsService);

  beforeEach(() => {
    jest.clearAllMocks();
    tx.patient.findUnique.mockResolvedValue(profile);
    tx.patient.update.mockResolvedValue(profile);
  });

  it('loads only the patient linked to the authenticated account and formats date-only fields', async () => {
    await expect(service.getMine(actor)).resolves.toMatchObject({
      patientCode: 'BN01',
      dateOfBirth: '2000-01-01',
      fullName: actor.name,
    });
    expect(tx.patient.findUnique).toHaveBeenCalledWith(
      expect.objectContaining({ where: { userId: actor.id } }),
    );
  });

  it('returns 404 if there is no linked profile, without creating or relinking one', async () => {
    tx.patient.findUnique.mockResolvedValueOnce(null);
    await expect(service.getMine(actor)).rejects.toBeInstanceOf(
      NotFoundException,
    );
    expect(tx.patient.update).not.toHaveBeenCalled();
  });

  it('updates nullable fields and audits only field names in the same transaction', async () => {
    await service.updateMine(
      {
        address: null,
        emergencyContactName: 'Người thân',
        dateOfBirth: '2001-02-03',
      },
      actor,
      tx as unknown as Prisma.TransactionClient,
    );
    expect(tx.patient.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: profile.id },
        data: {
          address: null,
          emergencyContactName: 'Người thân',
          dateOfBirth: new Date('2001-02-03T00:00:00Z'),
        },
      }),
    );
    expect(audit.record).toHaveBeenCalledWith(
      expect.objectContaining({
        actionCode: 'PATIENT_PROFILE_UPDATE',
        targetId: profile.id,
        after: {
          addressChanged: true,
          dateOfBirthChanged: true,
          emergencyContactNameChanged: true,
        },
      }),
      tx,
    );
    expect(JSON.stringify(audit.record.mock.calls)).not.toContain('Người thân');
  });

  it('does not update or audit unchanged fields', async () => {
    await service.updateMine(
      {
        dateOfBirth: '2000-01-01',
        address: 'Địa chỉ cũ',
        emergencyContactPhone: null,
      },
      actor,
      tx as unknown as Prisma.TransactionClient,
    );
    expect(tx.patient.update).not.toHaveBeenCalled();
    expect(audit.record).not.toHaveBeenCalled();
  });

  it('rejects empty input and a future birth date', async () => {
    await expect(async () =>
      service.updateMine({}, actor, tx as unknown as Prisma.TransactionClient),
    ).rejects.toBeInstanceOf(BadRequestException);
    await expect(async () =>
      service.updateMine(
        { dateOfBirth: '2999-01-01' },
        actor,
        tx as unknown as Prisma.TransactionClient,
      ),
    ).rejects.toBeInstanceOf(BadRequestException);
    expect(tx.patient.update).not.toHaveBeenCalled();
  });

  it('rejects staff demographic updates and missing patient-profile permissions', async () => {
    for (const user of [
      { ...actor, role: 'ADMIN' },
      { ...actor, permissions: [] },
    ]) {
      await expect(
        service.updateMine(
          { address: 'Địa chỉ mới' },
          user,
          tx as unknown as Prisma.TransactionClient,
        ),
      ).rejects.toBeInstanceOf(ForbiddenException);
    }
    expect(tx.patient.update).not.toHaveBeenCalled();
  });

  it('propagates audit failure to the transaction', async () => {
    audit.record.mockRejectedValueOnce(new Error('audit unavailable'));
    await expect(
      service.updateMine(
        { address: 'Địa chỉ mới' },
        actor,
        tx as unknown as Prisma.TransactionClient,
      ),
    ).rejects.toThrow('audit unavailable');
  });
});
