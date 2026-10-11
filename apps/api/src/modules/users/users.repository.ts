import { Injectable, ServiceUnavailableException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import {
  PermissionStatusEnum,
  RoleStatusEnum,
  UserStatus,
} from '../../generated/prisma/enums';
import { RoleEnum } from './constants/roles.constant';

const AUTHORIZATION_INCLUDE = {
  role: {
    include: {
      infoPermission: {
        where: {
          deletedAt: null,
          permission: { status: PermissionStatusEnum.ACTIVE, deletedAt: null },
        },
        include: { permission: true },
      },
    },
  },
} as const;

@Injectable()
export class UsersRepository {
  constructor(private readonly prisma: PrismaService) {}

  findByContact(contact: { email?: string; phone?: string }) {
    return this.prisma.user.findUnique({
      where: contact.email
        ? { email: contact.email }
        : { phone: contact.phone! },
      include: AUTHORIZATION_INCLUDE,
    });
  }

  findById(id: string) {
    return this.prisma.user.findUnique({
      where: { id },
      include: AUTHORIZATION_INCLUDE,
    });
  }

  async createPatient(input: {
    email?: string;
    phone?: string;
    name: string;
    passwordHash: string;
  }) {
    const role = await this.prisma.role.findUnique({
      where: { name: RoleEnum.PATIENT },
    });
    if (!role || role.status !== RoleStatusEnum.ACTIVE || role.deletedAt) {
      throw new ServiceUnavailableException('Patient role is unavailable');
    }
    return this.prisma.user.create({
      data: {
        fullName: input.name,
        email: input.email,
        phone: input.phone,
        passwordHash: input.passwordHash,
        roleId: role.id,
        status: UserStatus.PENDING_VERIFICATION,
      },
      include: AUTHORIZATION_INCLUDE,
    });
  }
}

export type AuthenticationUser = NonNullable<
  Awaited<ReturnType<UsersRepository['findById']>>
>;
