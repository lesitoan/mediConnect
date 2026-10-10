import { Injectable, UnauthorizedException } from '@nestjs/common';
import type { Prisma } from '../../generated/prisma/client';
import { PrismaService } from '../../database/prisma.service';
import {
  PermissionStatusEnum,
  RoleStatusEnum,
  UserStatus,
} from '../../generated/prisma/enums';
import { CurrentUserDto } from './dto/current-user.dto';
import { UsersRepository, type AuthenticationUser } from './users.repository';

@Injectable()
export class UsersService {
  constructor(
    private readonly usersRepository: UsersRepository,
    private readonly prisma: PrismaService,
  ) {}

  findForAuthentication(contact: { email?: string; phone?: string }) {
    return this.usersRepository.findByContact(contact);
  }

  createPatient(input: {
    email?: string;
    phone?: string;
    name: string;
    passwordHash: string;
  }) {
    return this.usersRepository.createPatient(input);
  }

  isAllowedToAuthenticate(user: {
    status: UserStatus;
    deletedAt: Date | null;
    role: { status: RoleStatusEnum; deletedAt: Date | null } | null;
  }): boolean {
    return (
      user.status === UserStatus.ACTIVE &&
      user.deletedAt === null &&
      user.role?.status === RoleStatusEnum.ACTIVE &&
      user.role.deletedAt === null
    );
  }

  async getAuthenticatedUser(
    userId: string,
    issuedAt: number,
    credentialVersion?: unknown,
  ): Promise<CurrentUserDto> {
    const user = await this.usersRepository.findById(userId);
    if (!user || !this.isAllowedToAuthenticate(user))
      throw new UnauthorizedException('Account is unavailable');
    if (
      user.passwordChangedAt &&
      (credentialVersion !== undefined
        ? credentialVersion !== user.passwordChangedAt.toISOString()
        : issuedAt * 1000 <= user.passwordChangedAt.getTime())
    ) {
      throw new UnauthorizedException('Please sign in again');
    }
    return this.toCurrentUser(user);
  }

  // Serialize account lifecycle changes across API instances, using one short DB transaction.
  withLockedAccount<T>(
    userId: string,
    action: (tx: Prisma.TransactionClient) => Promise<T>,
  ): Promise<T> {
    return this.prisma.$transaction(async (tx) => {
      await tx.$queryRaw`SELECT id FROM users WHERE id = ${userId}::uuid FOR UPDATE`;
      return action(tx);
    });
  }

  async activateAccount(
    tx: Prisma.TransactionClient,
    userId: string,
    channel: 'EMAIL' | 'ZALO',
    now: Date,
  ): Promise<void> {
    await tx.user.update({
      where: { id: userId },
      data: {
        status: UserStatus.ACTIVE,
        ...(channel === 'EMAIL'
          ? { emailVerifiedAt: now }
          : { phoneVerifiedAt: now }),
      },
    });
  }

  async resetPassword(
    tx: Prisma.TransactionClient,
    userId: string,
    passwordHash: string,
    now: Date,
  ): Promise<void> {
    await tx.user.update({
      where: { id: userId },
      data: { passwordHash, passwordChangedAt: now },
    });
    await tx.authSession.updateMany({
      where: { userId, revokedAt: null },
      data: { revokedAt: now, revocationReason: 'PASSWORD_RESET' },
    });
  }

  toCurrentUser(user: AuthenticationUser): CurrentUserDto {
    return {
      id: user.id,
      name: user.fullName,
      email: user.email,
      phone: user.phone,
      avatar: null,
      roleId: user.roleId,
      role: user.role?.name ?? '',
      status: user.status,
      permissions: (user.role?.infoPermission ?? [])
        .filter(
          (entry) =>
            entry.deletedAt === null &&
            entry.permission.status === PermissionStatusEnum.ACTIVE &&
            entry.permission.deletedAt === null,
        )
        .map((entry) => entry.permission.name),
      createdAt: user.createdAt,
    };
  }
}
