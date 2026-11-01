import 'dotenv/config';
import assert from 'node:assert/strict';
import { hash } from 'bcrypt';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '../src/generated/prisma/client';
import { RoleEnum } from '../src/modules/users/constants/roles.constant';
import { seedRbac } from './seed-rbac';

// Fictional coursework accounts with a shared demo password; never seed these in production.
const DOCTOR_PROFILE = {
  email: 'doctor01@example.invalid',
  code: 'STAFF-DEMO-01',
  licenseNumber: 'DEMO-STAFF-01',
  specialty: {
    code: 'SPEC-STAFF-DEMO',
    name: 'Chuyên khoa demo',
    roomCode: 'D001',
  },
} as const;

export const STAFF_ACCOUNTS = [
  {
    email: 'admin01@example.invalid',
    fullName: 'Quản trị viên demo 01',
    role: RoleEnum.ADMIN,
  },
  {
    email: 'admin02@example.invalid',
    fullName: 'Quản trị viên demo 02',
    role: RoleEnum.ADMIN,
  },
  {
    email: 'receptionist01@example.invalid',
    fullName: 'Lễ tân demo 01',
    role: RoleEnum.RECEPTIONIST,
  },
  {
    email: 'receptionist02@example.invalid',
    fullName: 'Lễ tân demo 02',
    role: RoleEnum.RECEPTIONIST,
  },
  {
    email: DOCTOR_PROFILE.email,
    fullName: 'Bác sĩ demo 01',
    role: RoleEnum.DOCTOR,
  },
] as const;

export async function seedStaff(prisma: PrismaClient): Promise<void> {
  assert.notEqual(
    process.env.NODE_ENV,
    'production',
    'Tài khoản demo chỉ dùng cho đồ án/dev/test.',
  );
  assert.equal(STAFF_ACCOUNTS.length, 5);
  assert.equal(new Set(STAFF_ACCOUNTS.map(({ email }) => email)).size, 5);
  const passwordHash = await hash('123456', 12);
  const now = new Date();
  await prisma.$transaction(
    async (transaction) => {
      await seedRbac(transaction);
      for (const entry of STAFF_ACCOUNTS) {
        const role = await transaction.role.findUniqueOrThrow({
          where: { name: entry.role },
        });
        assert.ok(
          role.status === 'ACTIVE' && role.deletedAt === null,
          `Vai trò ${entry.role} đang bị vô hiệu hóa.`,
        );
        const user = await transaction.user.upsert({
          where: { email: entry.email },
          create: {
            email: entry.email,
            fullName: entry.fullName,
            roleId: role.id,
            passwordHash,
            passwordChangedAt: now,
            status: 'ACTIVE',
            emailVerifiedAt: now,
          },
          update: {},
        });
        assert.equal(
          user.roleId,
          role.id,
          `Email ${entry.email} đã thuộc vai trò khác.`,
        );
        // Only initialize a passwordless pending account; reruns preserve passwords and locks.
        await transaction.user.updateMany({
          where: {
            id: user.id,
            status: 'PENDING_VERIFICATION',
            passwordHash: null,
            passwordChangedAt: null,
            deletedAt: null,
            authIdentities: { none: {} },
            authSessions: { none: {} },
          },
          data: {
            passwordHash,
            passwordChangedAt: now,
            status: 'ACTIVE',
            emailVerifiedAt: now,
          },
        });
      }

      const doctorUser = await transaction.user.findUniqueOrThrow({
        where: { email: DOCTOR_PROFILE.email },
      });
      const specialty = await transaction.specialty.upsert({
        where: { code: DOCTOR_PROFILE.specialty.code },
        create: {
          ...DOCTOR_PROFILE.specialty,
          description: 'Chuyên khoa dùng cho tài khoản bác sĩ demo.',
        },
        update: {},
      });
      assert.equal(
        specialty.name,
        DOCTOR_PROFILE.specialty.name,
        'Mã chuyên khoa demo đã được dùng cho chuyên khoa khác.',
      );
      assert.equal(
        specialty.roomCode,
        DOCTOR_PROFILE.specialty.roomCode,
        'Chuyên khoa demo đã được gán phòng khác.',
      );
      await transaction.doctor.upsert({
        where: { userId: doctorUser.id },
        create: {
          userId: doctorUser.id,
          specialtyId: specialty.id,
          doctorCode: DOCTOR_PROFILE.code,
          licenseNumber: DOCTOR_PROFILE.licenseNumber,
          qualification: 'Bác sĩ demo',
          isActive: true,
        },
        update: {},
      });
    },
    { timeout: 30000 },
  );
}

async function main(): Promise<void> {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) throw new Error('DATABASE_URL is required');
  const schema =
    new URL(connectionString).searchParams.get('schema') || 'public';
  const prisma = new PrismaClient({
    adapter: new PrismaPg(
      { connectionString, connectionTimeoutMillis: 5000 },
      { schema },
    ),
  });
  try {
    await seedStaff(prisma);
    console.log(
      'Đã seed tài khoản demo (ACTIVE, email đã xác minh). Mật khẩu tài khoản mới: 123456. Mật khẩu đã đổi được giữ nguyên.',
    );
    console.log('Admin: admin01@example.invalid, admin02@example.invalid');
    console.log('Bác sĩ: doctor01@example.invalid');
    console.log(
      'Lễ tân: receptionist01@example.invalid, receptionist02@example.invalid',
    );
  } finally {
    await prisma.$disconnect();
  }
}

if (require.main === module) {
  main().catch((error: unknown) => {
    console.error(error instanceof Error ? error.message : 'Staff seed failed');
    process.exitCode = 1;
  });
}
