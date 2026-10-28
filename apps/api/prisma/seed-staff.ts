import 'dotenv/config';
import assert from 'node:assert/strict';
import { hash } from 'bcrypt';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '../src/generated/prisma/client';
import { RoleEnum } from '../src/modules/users/constants/roles.constant';
import { seedRbac } from './seed-rbac';

// Fictional coursework accounts with a shared demo password; never seed these in production.
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
] as const;

export async function seedStaff(prisma: PrismaClient): Promise<void> {
  assert.notEqual(
    process.env.NODE_ENV,
    'production',
    'Tài khoản demo chỉ dùng cho đồ án/dev/test.',
  );
  assert.equal(STAFF_ACCOUNTS.length, 4);
  assert.equal(new Set(STAFF_ACCOUNTS.map(({ email }) => email)).size, 4);
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
      'Đã seed 2 admin và 2 lễ tân giả lập. Tài khoản mới ACTIVE, đã xác minh email, mật khẩu demo: 123456. Mật khẩu đã đổi được giữ nguyên.',
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
