import { ForbiddenException, UnauthorizedException } from '@nestjs/common';
import { AuditLogsService } from '../../audit-logs/audit-logs.service';
import { PrismaService } from '../../database/services/prisma.service';
import { UsersRepository } from '../users.repository';
import { UsersService } from './users.service';
import { MeUsersService } from './me-users.service';
import { PatientsService } from '../../patients/patients.service';

describe('Self-service account updates', () => {
  const id = '11111111-1111-4111-8111-111111111111';
  const tx = {
    $queryRaw: jest.fn().mockResolvedValue([]),
    user: { findUnique: jest.fn(), update: jest.fn() },
    patient: { findUnique: jest.fn(), update: jest.fn() },
  };
  const db = {
    schemaName: 'public',
    $transaction: jest.fn((action: (client: typeof tx) => unknown) =>
      action(tx),
    ),
  };
  const audit = { record: jest.fn() };
  const prisma = db as unknown as PrismaService;
  const accounts = new UsersService(
    new UsersRepository(prisma),
    prisma,
    audit as unknown as AuditLogsService,
  );

  const patients = { updateMine: jest.fn() };
  const service = new MeUsersService(
    accounts,
    patients as unknown as PatientsService,
  );

  beforeEach(() => {
    jest.clearAllMocks();
    tx.user.findUnique.mockResolvedValue({
      id,
      fullName: 'Tên cũ',
      email: 'patient@example.invalid',
      phone: '+84901234567',
      status: 'ACTIVE',
      deletedAt: null,
      roleId: 'patient-role',
      createdAt: new Date(),
      role: {
        name: 'PATIENT',
        status: 'ACTIVE',
        deletedAt: null,
        infoPermission: [
          {
            deletedAt: null,
            permission: {
              name: 'USERS_UPDATE_ME',
              status: 'ACTIVE',
              deletedAt: null,
            },
          },
        ],
      },
    });
    tx.patient.findUnique.mockResolvedValue({
      id: 'patient-profile',
      fullName: 'Tên cũ',
      phone: '+84901234567',
    });
  });

  it('updates the account and linked patient name with one transactional audit', async () => {
    await expect(
      service.update({ fullName: 'Tên mới' }, id),
    ).resolves.toMatchObject({
      id,
      name: 'Tên mới',
      email: 'patient@example.invalid',
    });
    expect(tx.user.update).toHaveBeenCalledWith({
      where: { id },
      data: { fullName: 'Tên mới' },
    });
    expect(tx.patient.update).toHaveBeenCalledWith({
      where: { id: 'patient-profile' },
      data: { fullName: 'Tên mới' },
    });
    expect(audit.record).toHaveBeenCalledWith(
      expect.objectContaining({
        targetId: id,
        actionCode: 'USER_UPDATE',
        before: { fullName: 'Tên cũ' },
        after: { fullName: 'Tên mới' },
      }),
      tx,
    );
    expect(db.$transaction).toHaveBeenCalledTimes(1);
  });

  it('does not write or audit a no-op update', async () => {
    await service.update({ fullName: 'Tên cũ' }, id);
    expect(tx.user.update).not.toHaveBeenCalled();
    expect(audit.record).not.toHaveBeenCalled();
  });

  it('repairs a stale patient name when the submitted account name is unchanged', async () => {
    tx.patient.findUnique.mockResolvedValueOnce({
      id: 'patient-profile',
      fullName: 'Tên hồ sơ cũ',
      phone: '+84901234567',
    });
    await expect(
      service.update({ fullName: 'Tên cũ' }, id),
    ).resolves.toMatchObject({ name: 'Tên cũ' });
    expect(tx.patient.update).toHaveBeenCalledWith({
      where: { id: 'patient-profile' },
      data: { fullName: 'Tên cũ' },
    });
    expect(tx.user.update).not.toHaveBeenCalled();
    expect(audit.record).toHaveBeenCalledWith(
      expect.objectContaining({
        actionCode: 'USER_UPDATE',
        targetId: id,
        after: { patientNameSynchronized: true },
      }),
      tx,
    );
  });

  it('accepts patient-only fields without updating or clearing the account name', async () => {
    patients.updateMine.mockResolvedValueOnce({ address: 'Địa chỉ mới' });
    await expect(
      service.update({ address: 'Địa chỉ mới' }, id),
    ).resolves.toMatchObject({
      name: 'Tên cũ',
      patientProfile: { address: 'Địa chỉ mới' },
    });
    expect(patients.updateMine).toHaveBeenCalledWith(
      { address: 'Địa chỉ mới' },
      expect.objectContaining({ id, name: 'Tên cũ' }),
      tx,
    );
    expect(tx.user.update).not.toHaveBeenCalled();
    expect(audit.record).not.toHaveBeenCalled();
  });

  it('rejects an empty update without opening a transaction', async () => {
    await expect(async () => service.update({}, id)).rejects.toThrow(
      'Chưa có thông tin cập nhật.',
    );
    expect(db.$transaction).not.toHaveBeenCalled();
  });

  it('rechecks account status after taking the account lock', async () => {
    tx.user.findUnique.mockResolvedValueOnce({
      status: 'LOCKED',
      deletedAt: null,
    });
    await expect(
      service.update({ fullName: 'Tên mới' }, id),
    ).rejects.toBeInstanceOf(UnauthorizedException);
    expect(tx.$queryRaw).toHaveBeenCalledTimes(1);
    expect(tx.user.update).not.toHaveBeenCalled();
  });

  it('rechecks permissions inside the transaction', async () => {
    const user: unknown = await tx.user.findUnique();
    tx.user.findUnique.mockResolvedValueOnce({
      ...(user as object),
      role: {
        name: 'PATIENT',
        status: 'ACTIVE',
        deletedAt: null,
        infoPermission: [],
      },
    });
    await expect(
      service.update({ fullName: 'Tên mới' }, id),
    ).rejects.toBeInstanceOf(ForbiddenException);
    expect(tx.user.update).not.toHaveBeenCalled();
  });

  it('propagates audit failure so Prisma rolls back the transaction', async () => {
    audit.record.mockRejectedValueOnce(new Error('audit unavailable'));
    await expect(service.update({ fullName: 'Tên mới' }, id)).rejects.toThrow(
      'audit unavailable',
    );
  });
});
