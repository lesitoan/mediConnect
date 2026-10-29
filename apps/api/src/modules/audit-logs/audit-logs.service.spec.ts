import {
  BadRequestException,
  ServiceUnavailableException,
  UnprocessableEntityException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { plainToInstance } from 'class-transformer';
import { validateSync } from 'class-validator';
import { AuditLogResult, UserRole } from '../../generated/prisma/client';
import type { Prisma } from '../../generated/prisma/client';
import type { PrismaService } from '../database/services/prisma.service';
import {
  PERMISSIONS_KEY,
  ROLES_KEY,
} from '../authentication/constants/authentication.constant';
import { PermissionEnum } from '../authentication/constants/permissions.constant';
import { RoleEnum } from '../users/constants/roles.constant';
import { AdminAuditLogsController } from './admin-audit-logs.controller';
import {
  AuditLogFilterDto,
  AuditLogQueryDto,
} from './dto/admin/audit-log-filter.dto';
import { AuditLogsService } from './audit-logs.service';

describe('Audit logs', () => {
  const actor = {
    type: 'USER' as const,
    id: '11111111-1111-4111-8111-111111111111',
    name: 'Admin',
    role: UserRole.ADMIN,
  };
  const event = {
    actor,
    actionCode: 'TEST_UPDATE',
    module: 'TEST',
    targetType: 'TEST',
    targetId: '1',
    result: AuditLogResult.SUCCESS,
  };
  const tx = { auditLog: { create: jest.fn() } };
  const prisma = {
    auditLog: {
      create: jest.fn(),
      findMany: jest.fn(),
      count: jest.fn(),
      findUnique: jest.fn(),
      groupBy: jest.fn(),
    },
    $transaction: jest.fn(),
  };
  const service = new AuditLogsService(prisma as unknown as PrismaService);

  beforeEach(() => jest.resetAllMocks());

  it('uses the caller transaction and rejects sensitive snapshots', async () => {
    await service.record(
      { ...event, before: { status: 'OLD' }, after: { status: 'NEW' } },
      tx as unknown as Prisma.TransactionClient,
    );
    expect(tx.auditLog.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          actorUserId: actor.id,
          beforeSnapshot: { status: 'OLD' },
          afterSnapshot: { status: 'NEW' },
        }) as unknown,
      }),
    );
    expect(prisma.auditLog.create).not.toHaveBeenCalled();
    await expect(
      service.record({ ...event, after: { accessToken: 'secret' } }),
    ).rejects.toThrow(BadRequestException);
    expect(prisma.auditLog.create).not.toHaveBeenCalled();
  });

  it('validates filters and converts date boundaries using Vietnam time', async () => {
    expect(
      validateSync(
        plainToInstance(AuditLogQueryDto, { startDate: '2026-02-30' }),
      ).length,
    ).toBeGreaterThan(0);
    const query = plainToInstance(AuditLogQueryDto, {
      startDate: '2026-10-01',
      endDate: '2026-10-01',
      page: '1',
      limit: '10',
    });
    expect(validateSync(query)).toHaveLength(0);
    prisma.auditLog.findMany.mockReturnValue('find');
    prisma.auditLog.count.mockReturnValue('count');
    prisma.$transaction.mockResolvedValue([[], 0]);
    await service.list(query);
    expect(prisma.auditLog.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          occurredAt: {
            gte: new Date('2026-09-30T17:00:00Z'),
            lt: new Date('2026-10-01T17:00:00Z'),
          },
        }) as unknown,
      }),
    );
    await expect(
      service.list(
        plainToInstance(AuditLogQueryDto, { startDate: '2026-10-01' }),
      ),
    ).rejects.toThrow(BadRequestException);
  });

  it('returns real actor and action options using stable actor IDs', async () => {
    prisma.auditLog.groupBy
      .mockResolvedValueOnce([
        {
          actorType: 'USER',
          actorUserId: actor.id,
          actorDisplayName: 'Tên mới',
        },
        {
          actorType: 'USER',
          actorUserId: actor.id,
          actorDisplayName: 'Tên cũ',
        },
        { actorType: 'SYSTEM', actorUserId: null, actorDisplayName: null },
      ])
      .mockResolvedValueOnce([{ actionCode: 'DOCTOR_UPDATE' }]);
    await expect(
      service.filterOptions({ startDate: '2026-10-01', endDate: '2026-10-02' }),
    ).resolves.toEqual({
      actors: [
        { value: `USER:${actor.id}`, label: 'Tên mới' },
        { value: 'SYSTEM', label: 'Hệ thống' },
      ],
      actions: [{ value: 'DOCTOR_UPDATE', label: 'Cập nhật hồ sơ bác sĩ' }],
    });
  });

  it('records system failures with a stable event key and a sanitized reason', async () => {
    await service.record({
      ...event,
      actor: { type: 'SYSTEM' },
      result: AuditLogResult.FAILED,
      reason: 'Task could not complete',
      idempotencyKey: 'task-attempt-1',
    });
    expect(prisma.auditLog.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          actorType: 'SYSTEM',
          source: 'SYSTEM',
          result: 'FAILED',
          reason: 'Task could not complete',
          idempotencyKey: 'task-attempt-1',
        }) as unknown,
      }),
    );
  });

  it('searches visible action and system labels while keeping exact filters and the date range', async () => {
    prisma.auditLog.findMany.mockResolvedValue([]);
    prisma.auditLog.count.mockResolvedValue(0);
    prisma.$transaction.mockResolvedValue([[], 0]);
    await service.list(
      plainToInstance(AuditLogQueryDto, {
        search: 'TẠO HỒ SƠ BÁC SĨ',
        actionCode: 'DOCTOR_CREATE',
      }),
    );
    expect(prisma.auditLog.findMany).toHaveBeenLastCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          actionCode: 'DOCTOR_CREATE',
          occurredAt: expect.anything() as unknown,
          OR: expect.arrayContaining([
            { actionCode: { in: ['DOCTOR_CREATE'] } },
          ]) as unknown,
        }) as unknown,
      }),
    );
    await service.list(
      plainToInstance(AuditLogQueryDto, { search: 'Hệ thống' }),
    );
    expect(prisma.auditLog.findMany).toHaveBeenLastCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          OR: expect.arrayContaining([
            { actorType: 'SYSTEM', actorDisplayName: null },
          ]) as unknown,
        }) as unknown,
      }),
    );
  });

  it('returns the same action label in list, detail and filter options', async () => {
    const item = { id: 'event-id', actionCode: 'ACCOUNT_RESET_CREDENTIALS' };
    prisma.auditLog.findUnique.mockResolvedValue(item);
    await expect(service.get('event-id')).resolves.toMatchObject({
      actionLabel: 'Đặt lại mật khẩu',
    });
    prisma.$transaction.mockResolvedValue([[item], 1]);
    await expect(service.list(new AuditLogQueryDto())).resolves.toMatchObject({
      items: [{ actionLabel: 'Đặt lại mật khẩu' }],
    });
  });

  it('exports escaped data, records the export, and refuses to send it if audit fails', async () => {
    prisma.auditLog.findMany.mockResolvedValue([
      {
        id: 'id',
        occurredAt: new Date('2026-10-01T01:00:00Z'),
        actorType: 'USER',
        actorUserId: actor.id,
        actorDisplayName: '=1+1',
        actorRole: 'ADMIN',
        actionCode: 'TEST',
        module: 'TEST',
        targetType: 'TEST',
        targetId: null,
        result: 'SUCCESS',
      },
    ]);
    const filter = plainToInstance(AuditLogFilterDto, {
      startDate: '2026-10-01',
      endDate: '2026-10-01',
      search: '  TEST  ',
    });
    expect(validateSync(filter)).toHaveLength(0);
    const file = await service.export(filter, actor);
    expect(file.toString('utf8')).toContain(`"'=1+1"`);
    expect(prisma.auditLog.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          OR: expect.arrayContaining([
            { actionCode: { contains: 'TEST', mode: 'insensitive' } },
          ]) as unknown,
        }) as unknown,
      }),
    );
    expect(prisma.auditLog.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          actionCode: 'EXPORT_AUDIT_LOG',
          afterSnapshot: expect.objectContaining({
            count: 1,
            search: 'TEST',
          }) as unknown,
        }) as unknown,
      }),
    );
    prisma.auditLog.create.mockRejectedValueOnce(
      new Error('database unavailable'),
    );
    await expect(service.export(filter, actor)).rejects.toThrow(
      ServiceUnavailableException,
    );
    prisma.auditLog.findMany.mockResolvedValueOnce([]);
    await expect(service.export(filter, actor)).rejects.toThrow(
      UnprocessableEntityException,
    );
  });

  it.each([
    ['list', [PermissionEnum.AUDIT_LOGS_READ]],
    ['filterOptions', [PermissionEnum.AUDIT_LOGS_READ]],
    ['get', [PermissionEnum.AUDIT_LOGS_READ]],
    [
      'export',
      [PermissionEnum.AUDIT_LOGS_READ, PermissionEnum.AUDIT_LOGS_EXPORT],
    ],
  ] as const)(
    '%s requires admin and its permissions',
    (method, permissions) => {
      const reflector = new Reflector();
      expect(
        reflector.get(ROLES_KEY, AdminAuditLogsController.prototype[method]),
      ).toEqual([RoleEnum.ADMIN]);
      expect(
        reflector.get(
          PERMISSIONS_KEY,
          AdminAuditLogsController.prototype[method],
        ),
      ).toEqual(permissions);
    },
  );
});
