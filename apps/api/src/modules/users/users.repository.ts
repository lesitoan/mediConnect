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
import { normalizePhone } from '../../common/utils/normalize-phone';

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
    if (contact.email) {
      return this.prisma.user.findUnique({
        where: { email: contact.email },
        include: AUTHORIZATION_INCLUDE,
      });
    }
    if (contact.phone) {
      const phone = normalizePhone(contact.phone) as string;
      const phonePatterns = new Set<string>();
      phonePatterns.add(phone);
      if (phone.startsWith('+84')) {
        phonePatterns.add('84' + phone.slice(2));
        phonePatterns.add('0' + phone.slice(2));
      } else if (phone.startsWith('84')) {
        phonePatterns.add('+' + phone);
        phonePatterns.add('0' + phone.slice(1));
      } else if (phone.startsWith('0')) {
        phonePatterns.add('+84' + phone.slice(1));
        phonePatterns.add('84' + phone.slice(1));
      }
      // Dùng findFirst thay cho findUnique khi query theo OR nhiều điều kiện
      return this.prisma.user.findFirst({
        where: {
          OR: Array.from(phonePatterns).map((p) => ({ phone: p })),
        },
        include: AUTHORIZATION_INCLUDE,
      });
    }
    // Trường hợp không có contact truyền vào, dùng findFirst với điều kiện rỗng
    return this.prisma.user.findFirst({
      where: {},
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