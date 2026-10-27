import { Injectable, UnauthorizedException } from '@nestjs/common';
import type { Prisma } from '../../../generated/prisma/client';
import { PrismaService } from '../../database/services/prisma.service';

@Injectable()
export class UserSessionsService {
  constructor(private readonly prisma: PrismaService) {}

  create(
    tx: Prisma.TransactionClient,
    data: Prisma.AuthSessionUncheckedCreateInput,
  ) {
    return tx.authSession.create({ data });
  }

  findById(tx: Prisma.TransactionClient, id: string) {
    return tx.authSession.findUnique({ where: { id } });
  }

  async assertActive(id: string, userId: string): Promise<void> {
    const session = await this.prisma.authSession.findUnique({ where: { id } });
    if (
      !session ||
      session.userId !== userId ||
      session.revokedAt ||
      session.expiresAt.getTime() <= Date.now()
    ) {
      throw new UnauthorizedException('Invalid or expired session');
    }
  }

  rotate(
    tx: Prisma.TransactionClient,
    id: string,
    previousHash: string,
    nextHash: string,
  ) {
    return tx.authSession.updateMany({
      where: {
        id,
        refreshTokenHash: previousHash,
        revokedAt: null,
        expiresAt: { gt: new Date() },
      },
      data: { refreshTokenHash: nextHash, lastActiveAt: new Date() },
    });
  }

  revoke(
    tx: Prisma.TransactionClient,
    userId: string,
    reason: string,
    id?: string,
  ) {
    return tx.authSession.updateMany({
      where: { userId, ...(id ? { id } : {}), revokedAt: null },
      data: { revokedAt: new Date(), revocationReason: reason },
    });
  }

  async listActive(userId: string, currentId: string) {
    const sessions = await this.prisma.authSession.findMany({
      where: { userId, revokedAt: null, expiresAt: { gt: new Date() } },
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        clientType: true,
        deviceName: true,
        userAgent: true,
        ipAddress: true,
        createdAt: true,
        lastActiveAt: true,
        expiresAt: true,
      },
    });
    return sessions.map((session) => ({
      ...session,
      isCurrent: session.id === currentId,
    }));
  }
}
