import { ServiceUnavailableException } from '@nestjs/common';
import { compare } from 'bcrypt';
import type { Prisma } from '../../../generated/prisma/client';
import type { PrismaService } from '../../database/services/prisma.service';
import type { UsersRepository } from '../users.repository';
import { UsersService } from './users.service';
import type { AuditLogsService } from '../../audit-logs/audit-logs.service';
import { RoleEnum } from '../constants/roles.constant';

describe('Staff account creation', () => {
  const tx = {
    role: { findUnique: jest.fn() },
    user: {
      create: jest.fn().mockResolvedValue({ id: 'doctor-user' }),
      findMany: jest.fn(),
    },
    $queryRaw: jest.fn().mockResolvedValue([]),
  };
  const service = new UsersService(
    {} as UsersRepository,
    {} as PrismaService,
    {} as AuditLogsService,
  );

  beforeEach(() => {
    jest.clearAllMocks();
    tx.user.findMany.mockResolvedValue([]);
    tx.role.findUnique.mockResolvedValue({
      id: 'doctor-role',
      status: 'ACTIVE',
      deletedAt: null,
    });
  });

  it('creates an active doctor account using the full name and a hashed default password', async () => {
    await expect(
      service.createStaffAccount(tx as unknown as Prisma.TransactionClient, {
        fullName: 'Bác sĩ A',
        role: RoleEnum.DOCTOR,
        phone: '+84901234567',
      }),
    ).resolves.toEqual({ id: 'doctor-user' });
    const calls = tx.user.create.mock.calls as unknown as Array<
      [{ data: { passwordHash: string } }]
    >;
    const data = calls[0][0].data;
    expect(data).toMatchObject({
      fullName: 'Bác sĩ A',
      email: 'bacsia@example.invalid',
      phone: '+84901234567',
      roleId: 'doctor-role',
      status: 'ACTIVE',
    });
    expect(data.passwordHash).not.toBe('123456');
    await expect(compare('123456', data.passwordHash)).resolves.toBe(true);
  });

  it('does not create an account if the doctor role is unavailable', async () => {
    tx.role.findUnique.mockResolvedValueOnce({
      id: 'doctor-role',
      status: 'INACTIVE',
      deletedAt: null,
    });
    await expect(
      service.createStaffAccount(tx as unknown as Prisma.TransactionClient, {
        fullName: 'Bác sĩ A',
        role: RoleEnum.DOCTOR,
      }),
    ).rejects.toThrow(ServiceUnavailableException);
    expect(tx.user.create).not.toHaveBeenCalled();
  });

  it('keeps the full Vietnamese name and adds a suffix when the generated email exists', async () => {
    tx.user.findMany.mockResolvedValue([
      { email: 'dothianh@example.invalid' },
      { email: 'dothianh.2@example.invalid' },
    ]);
    await service.createStaffAccount(
      tx as unknown as Prisma.TransactionClient,
      { fullName: 'Đỗ Thị Ánh', role: RoleEnum.RECEPTIONIST },
    );
    expect(tx.user.create).toHaveBeenLastCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          email: 'dothianh.3@example.invalid',
          fullName: 'Đỗ Thị Ánh',
        }) as unknown,
      }),
    );
    expect(tx.$queryRaw).toHaveBeenCalled();
  });
});
