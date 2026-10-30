import 'dotenv/config';
import { hash } from 'bcrypt';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '../src/generated/prisma/client';
import { PermissionEnum } from '../src/modules/authentication/constants/permissions.constant';
import { RoleEnum } from '../src/modules/users/constants/roles.constant';
import { seedRbac } from './seed-rbac';

const DEMO_PASSWORD = 'MediConnect123!';
const SLOT_DURATION_MINUTES = 30;
const SCHEDULE_DAYS = 90;

function atTime(date: Date, hour: number, minute = 0): Date {
  const result = new Date(date);
  result.setHours(hour, minute, 0, 0);
  return result;
}

function startOfToday(): Date {
  const result = new Date();
  result.setHours(0, 0, 0, 0);
  return result;
}

async function seed(): Promise<void> {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) throw new Error('DATABASE_URL is required');
  const schema = new URL(connectionString).searchParams.get('schema') || 'public';
  const prisma = new PrismaClient({
    adapter: new PrismaPg(
      { connectionString, connectionTimeoutMillis: 5000 },
      { schema },
    ),
  });

  try {
    await prisma.$transaction(seedRbac, { timeout: 30000 });
    if (process.env.SEED_DEMO_DATA === 'true') {
      if (process.env.NODE_ENV === 'production') {
        throw new Error('Demo data cannot be seeded in production');
      }
      const passwordHash = await hash(DEMO_PASSWORD, 10);
      await prisma.$transaction(async (transaction) => {
      const permissions = new Map<PermissionEnum, { id: string }>();
      for (const name of Object.values(PermissionEnum)) {
        const permission = await transaction.permission.upsert({
          where: { name },
          create: { name, description: `${name} permission` },
          update: {},
        });
        permissions.set(name, permission);
      }

      const rolePermissions: Record<string, PermissionEnum[]> = {
        [RoleEnum.PATIENT]: [PermissionEnum.USERS_READ_ME],
        [RoleEnum.DOCTOR]: [PermissionEnum.USERS_READ_ME, PermissionEnum.SCHEDULES_READ, PermissionEnum.LEAVE_REQUESTS_CREATE, PermissionEnum.LEAVE_REQUESTS_READ],
        [RoleEnum.RECEPTIONIST]: [PermissionEnum.USERS_READ_ME, PermissionEnum.SCHEDULES_READ, PermissionEnum.LEAVE_REQUESTS_CREATE, PermissionEnum.LEAVE_REQUESTS_READ],
        [RoleEnum.ADMIN]: Object.values(PermissionEnum),
      };
      const roles = new Map<string, { id: string }>();
      for (const name of Object.values(RoleEnum)) {
        const role = await transaction.role.upsert({
          where: { name },
          create: { name, description: `${name} role` },
          update: {},
        });
        roles.set(name, role);
        for (const permissionName of rolePermissions[name]) {
          const permission = permissions.get(permissionName);
          if (!permission) throw new Error(`Permission ${permissionName} missing`);
          await transaction.infoPermission.upsert({
            where: { role_id_permission_id: { role_id: role.id, permission_id: permission.id } },
            create: { role_id: role.id, permission_id: permission.id, description: `${permissionName} for ${name}` },
            update: {},
          });
        }
      }

      const adminRole = roles.get(RoleEnum.ADMIN);
      const doctorRole = roles.get(RoleEnum.DOCTOR);
      const receptionistRole = roles.get(RoleEnum.RECEPTIONIST);
      const patientRole = roles.get(RoleEnum.PATIENT);
      if (!adminRole || !doctorRole || !receptionistRole || !patientRole) throw new Error('Required roles are missing');

      const admin = await transaction.user.upsert({
        where: { email: 'admin@mediconnect.local' },
        create: { fullName: 'MediConnect Admin', email: 'admin@mediconnect.local', passwordHash, status: 'ACTIVE', emailVerifiedAt: new Date(), roleId: adminRole.id },
        update: { passwordHash, status: 'ACTIVE', roleId: adminRole.id },
      });

      const specialties = await Promise.all([
        ['CARDIOLOGY', 'Tim mạch', 'P201'],
        ['DERMATOLOGY', 'Da liễu', 'P202'],
        ['PEDIATRICS', 'Nhi khoa', 'P203'],
      ].map(([code, name, roomCode]) => transaction.specialty.upsert({
        where: { code }, create: { code, name, roomCode, isActive: true }, update: { name, roomCode, isActive: true },
      })));

      const doctorDefinitions = [
        { email: 'doctor.cardio@mediconnect.local', name: 'BS. Nguyễn Minh An', code: 'DOC-CARDIO-01', licenseNumber: 'DEMO-DOC-CARDIO-01', specialty: specialties[0] },
        { email: 'doctor.derma@mediconnect.local', name: 'BS. Trần Ngọc Mai', code: 'DOC-DERMA-01', licenseNumber: 'DEMO-DOC-DERMA-01', specialty: specialties[1] },
        { email: 'doctor.pedia@mediconnect.local', name: 'BS. Lê Hoàng Nam', code: 'DOC-PEDIA-01', licenseNumber: 'DEMO-DOC-PEDIA-01', specialty: specialties[2] },
      ];
      const doctors: Array<{ doctor: { id: string }; user: { id: string } }> = [];
      for (const definition of doctorDefinitions) {
        const user = await transaction.user.upsert({
          where: { email: definition.email },
          create: { fullName: definition.name, email: definition.email, passwordHash, status: 'ACTIVE', emailVerifiedAt: new Date(), roleId: doctorRole.id },
          update: { fullName: definition.name, passwordHash, status: 'ACTIVE', roleId: doctorRole.id },
        });
        const doctor = await transaction.doctor.upsert({
          where: { userId: user.id },
          create: { userId: user.id, specialtyId: definition.specialty.id, doctorCode: definition.code, licenseNumber: definition.licenseNumber, qualification: 'Bác sĩ chuyên khoa', isActive: true },
          update: { specialtyId: definition.specialty.id, doctorCode: definition.code, isActive: true },
        });
        doctors.push({ doctor, user });
      }

      const receptionist = await transaction.user.upsert({
        where: { email: 'receptionist@mediconnect.local' },
        create: { fullName: 'Lễ tân MediConnect', email: 'receptionist@mediconnect.local', passwordHash, status: 'ACTIVE', emailVerifiedAt: new Date(), roleId: receptionistRole.id },
        update: { passwordHash, status: 'ACTIVE', roleId: receptionistRole.id },
      });
      const patientUser = await transaction.user.upsert({
        where: { email: 'patient@mediconnect.local' },
        create: { fullName: 'Nguyễn Bảo Châu', email: 'patient@mediconnect.local', passwordHash, status: 'ACTIVE', emailVerifiedAt: new Date(), roleId: patientRole.id },
        update: { passwordHash, status: 'ACTIVE', roleId: patientRole.id },
      });
      await transaction.patient.upsert({
        where: { userId: patientUser.id },
        create: { userId: patientUser.id, patientCode: 'PAT-DEMO-001', fullName: 'Nguyễn Bảo Châu', gender: 'FEMALE', phone: '0900000001', email: 'patient@mediconnect.local' },
        update: { fullName: 'Nguyễn Bảo Châu', phone: '0900000001' },
      });

      const effectiveFrom = startOfToday();
      const staff = [...doctors.map(({ user }) => ({ user, staffType: 'DOCTOR' as const })), { user: receptionist, staffType: 'RECEPTIONIST' as const }];
      for (const item of staff) {
        for (let dayOfWeek = 1; dayOfWeek <= 7; dayOfWeek += 1) {
          for (const [startHour, endHour] of [[8, 12], [13, 18]]) {
            const startsAt = new Date(2026, 0, 5 + dayOfWeek - 1, startHour);
            const endsAt = new Date(2026, 0, 5 + dayOfWeek - 1, endHour);
            const existing = await transaction.staffWorkSchedule.findFirst({ where: { staffUserId: item.user.id, staffType: item.staffType, dayOfWeek, startsAt, endsAt } });
            if (existing) {
              await transaction.staffWorkSchedule.update({ where: { id: existing.id }, data: { status: 'PUBLISHED', effectiveFrom, publishedAt: new Date(), createdBy: admin.id } });
            } else {
              await transaction.staffWorkSchedule.create({
                data: { staffUserId: item.user.id, staffType: item.staffType, startsAt, endsAt, dayOfWeek, effectiveFrom, isRecurring: true, scheduleType: 'REGULAR', slotDurationMinutes: SLOT_DURATION_MINUTES, status: 'PUBLISHED', createdBy: admin.id, publishedAt: new Date() },
              });
            }
          }
        }
      }

      for (let offset = 0; offset < SCHEDULE_DAYS; offset += 1) {
        const date = new Date(effectiveFrom);
        date.setDate(date.getDate() + offset);
        for (const { doctor } of doctors) {
          for (const [startHour, endHour] of [[8, 12], [13, 18]]) {
            const startsAt = atTime(date, startHour);
            const endsAt = atTime(date, endHour);
            const existing = await transaction.doctorSchedule.findFirst({ where: { doctorId: doctor.id, startsAt, endsAt } });
            const schedule = existing ?? await transaction.doctorSchedule.create({ data: { doctorId: doctor.id, startsAt, endsAt, scheduleType: 'REGULAR', status: 'PUBLISHED', slotDurationMinutes: SLOT_DURATION_MINUTES, createdBy: admin.id, publishedAt: new Date() } });
            const slots = [];
            for (let cursor = new Date(startsAt); cursor < endsAt; cursor.setMinutes(cursor.getMinutes() + SLOT_DURATION_MINUTES)) {
              const slotStart = new Date(cursor);
              const slotEnd = new Date(cursor);
              slotEnd.setMinutes(slotEnd.getMinutes() + SLOT_DURATION_MINUTES);
              slots.push({ doctorScheduleId: schedule.id, startsAt: slotStart, endsAt: slotEnd });
            }
            await transaction.appointmentSlot.createMany({ data: slots, skipDuplicates: true });
          }
        }
      }
      });

      console.log(`Demo data is ready. Password for all demo accounts: ${DEMO_PASSWORD}`);
      console.log('Admin: admin@mediconnect.local');
      console.log('Doctor: doctor.cardio@mediconnect.local');
      console.log('Receptionist: receptionist@mediconnect.local');
      console.log('Patient: patient@mediconnect.local');
    } else {
      console.log(
        'SRS roles and permissions are ready. No user or password was created.',
      );
    }
  } finally {
    await prisma.$disconnect();
  }
}

seed().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : 'Seed failed');
  process.exitCode = 1;
});
