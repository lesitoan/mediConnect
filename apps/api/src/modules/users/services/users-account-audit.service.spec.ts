import type { Prisma } from '../../../generated/prisma/client';
import { PrismaService } from '../../database/services/prisma.service';
import { Test } from '@nestjs/testing';
import { UsersModule } from '../users.module';
import { AuditLogsService } from '../../audit-logs/audit-logs.service';
import type { UsersRepository } from '../users.repository';
import { UsersService } from './users.service';

describe('Account audit', () => {
  const tx = {
    user: { update: jest.fn(), findUniqueOrThrow: jest.fn() },
    authSession: { updateMany: jest.fn() },
    auditLog: { create: jest.fn() },
  };
  const prisma = {} as PrismaService;
  const service = new UsersService(
    {} as UsersRepository,
    prisma,
    new AuditLogsService(prisma),
  );
  const client = tx as unknown as Prisma.TransactionClient;

  beforeEach(() => {
    jest.resetAllMocks();
    tx.user.findUniqueOrThrow.mockResolvedValue({
      id: 'doctor-id',
      fullName: 'Bác sĩ A',
      role: { name: 'DOCTOR' },
    });
    tx.authSession.updateMany.mockResolvedValue({ count: 2 });
    tx.auditLog.create.mockResolvedValue({});
  });

  it('resolves account and audit services without a circular module dependency', async () => {
    const module = await Test.createTestingModule({ imports: [UsersModule] })
      .overrideProvider(PrismaService)
      .useValue({})
      .compile();
    expect(module.get(UsersService)).toBeInstanceOf(UsersService);
    expect(module.get(AuditLogsService)).toBeInstanceOf(AuditLogsService);
    await module.close();
  });

  it('audits a password reset using the verified owner and the same transaction without copying credentials', async () => {
    await service.resetPassword(
      client,
      'doctor-id',
      'private-hash',
      new Date(),
    );
    expect(tx.user.update).toHaveBeenCalledTimes(1);
    expect(tx.authSession.updateMany).toHaveBeenCalledTimes(1);
    expect(tx.auditLog.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          actorType: 'USER',
          actorUserId: 'doctor-id',
          actorRole: 'DOCTOR',
          actionCode: 'ACCOUNT_RESET_CREDENTIALS',
          targetId: 'doctor-id',
          afterSnapshot: { revokedSessions: 2 },
        }) as unknown,
      }),
    );
    expect(JSON.stringify(tx.auditLog.create.mock.calls)).not.toContain(
      'private-hash',
    );
  });

  it('audits OTP activation and lets audit failure roll back the caller transaction', async () => {
    await service.activateAccount(client, 'doctor-id', 'EMAIL', new Date());
    expect(tx.auditLog.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          actionCode: 'ACCOUNT_ACTIVATE',
        }) as unknown,
      }),
    );
    tx.auditLog.create.mockRejectedValueOnce(new Error('audit unavailable'));
    await expect(
      service.resetPassword(client, 'doctor-id', 'private-hash', new Date()),
    ).rejects.toThrow('audit unavailable');
  });

  it('attributes automatic session revocation to the system', async () => {
    await service.recordAccountEvent(
      client,
      'doctor-id',
      'ACCOUNT_REVOKE_REUSED_SESSION',
      { sessionId: 'session-id' },
      true,
    );
    expect(tx.auditLog.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          actorType: 'SYSTEM',
          targetId: 'doctor-id',
          afterSnapshot: { sessionId: 'session-id' },
        }) as unknown,
      }),
    );
  });

  it('audits pending registration as anonymous in the account creation transaction', async () => {
    const repository = {
      createPatient: jest.fn().mockResolvedValue({
        id: 'new-patient',
        status: 'PENDING_VERIFICATION',
      }),
    };
    const database = {
      $transaction: (fn: (client: typeof tx) => unknown) => fn(tx),
    } as unknown as PrismaService;
    const users = new UsersService(
      repository as unknown as UsersRepository,
      database,
      new AuditLogsService(database),
    );
    await users.createPatient({
      name: 'Patient',
      email: 'patient@example.invalid',
      phone: '+84901234567',
      passwordHash: 'private-hash',
    });
    expect(repository.createPatient).toHaveBeenCalledWith(
      expect.anything(),
      tx,
    );
    expect(tx.auditLog.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          actorType: 'ANONYMOUS',
          actionCode: 'ACCOUNT_REGISTER',
          targetId: 'new-patient',
          afterSnapshot: { status: 'PENDING_VERIFICATION' },
        }) as unknown,
      }),
    );
    expect(JSON.stringify(tx.auditLog.create.mock.calls)).not.toContain(
      'private-hash',
    );
  });
});
