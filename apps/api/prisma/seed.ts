import 'dotenv/config';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '../src/generated/prisma/client';
import { RoleEnum } from '../src/modules/users/constants/roles.constant';
import { PermissionEnum } from '../src/modules/authentication/constants/permissions.constant';

async function seed(): Promise<void> {
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
    await prisma.$transaction(async (transaction) => {
      const permission = await transaction.permission.upsert({
        where: { name: PermissionEnum.USERS_READ_ME },
        create: {
          name: PermissionEnum.USERS_READ_ME,
          description: 'Read own account profile',
        },
        update: {},
      });
      for (const name of Object.values(RoleEnum)) {
        const role = await transaction.role.upsert({
          where: { name },
          create: { name, description: `${name} role` },
          update: {},
        });
        await transaction.infoPermission.upsert({
          where: {
            role_id_permission_id: {
              role_id: role.id,
              permission_id: permission.id,
            },
          },
          create: {
            role_id: role.id,
            permission_id: permission.id,
            description: `Read own account profile for ${name}`,
          },
          update: {},
        });
      }
    });
    console.log(
      'RBAC roles and default /me permissions are ready. No user or password was created.',
    );
  } finally {
    await prisma.$disconnect();
  }
}

seed().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : 'Seed failed');
  process.exitCode = 1;
});
