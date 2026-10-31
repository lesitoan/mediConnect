import { Injectable, ServiceUnavailableException } from '@nestjs/common';
import { randomBytes } from 'node:crypto';
import { PrismaService } from '../database/services/prisma.service';
import {
  PatientGender,
  PermissionStatusEnum,
  RoleStatusEnum,
  UserStatus,
} from '../../generated/prisma/enums';
import { RoleEnum } from './constants/roles.constant';
import type { Prisma } from '../../generated/prisma/client';

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

  findById(id: string, db: Prisma.TransactionClient = this.prisma) {
    return db.user.findUnique({
      where: { id },
      include: AUTHORIZATION_INCLUDE,
    });
  }

  async createPatient(
    input: {
      email?: string;
      phone: string;
      name: string;
      passwordHash: string;
      dateOfBirth?: string;
      gender?: PatientGender;
    },
    tx: Prisma.TransactionClient,
  ) {
    const role = await tx.role.findUnique({
      where: { name: RoleEnum.PATIENT },
    });
    if (!role || role.status !== RoleStatusEnum.ACTIVE || role.deletedAt) {
      throw new ServiceUnavailableException('Patient role is unavailable');
    }
    return tx.user.create({
      data: {
        fullName: input.name,
        email: input.email,
        phone: input.phone,
        passwordHash: input.passwordHash,
        roleId: role.id,
        status: UserStatus.PENDING_VERIFICATION,
        patient: {
          create: {
            patientCode: `MC-${randomBytes(8).toString('hex').toUpperCase()}`,
            fullName: input.name,
            phone: input.phone,
            email: input.email,
            ...(input.dateOfBirth
              ? { dateOfBirth: new Date(input.dateOfBirth) }
              : {}),
            gender: input.gender,
          },
        },
      },
      include: AUTHORIZATION_INCLUDE,
    });
  }
}

export type AuthenticationUser = NonNullable<
  Awaited<ReturnType<UsersRepository['findById']>>
>;
