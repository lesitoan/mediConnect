import 'dotenv/config';
import assert from 'node:assert/strict';
import { hash } from 'bcrypt';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '../src/generated/prisma/client';
import { RoleEnum } from '../src/modules/users/constants/roles.constant';
import { seedRbac } from './seed-rbac';

const PATIENT_ACCOUNT = {
  email: 'patient-test@mediconnect.local',
  fullName: 'Bệnh nhân kiểm thử MediConnect',
  password: 'MediConnect123!',
  phone: '+84900000002',
  patientCode: 'PAT-LOCAL-TEST-001',
  dateOfBirth: new Date('1998-04-15T00:00:00.000Z'),
  address: 'Địa chỉ kiểm thử, Phường Bến Nghé, Quận 1, TP. Hồ Chí Minh',
  emergencyContactName: 'Người liên hệ kiểm thử',
  emergencyContactPhone: '+84900000003',
};

const PATIENT_HEALTH_RECORDS = [
  {
    id: '60c01a7b-8a5d-4c85-901d-23a9ce2b7831',
    recordType: 'ALLERGY' as const,
    name: 'Penicillin',
    description: 'Thông tin dị ứng được khai báo cho tài khoản kiểm thử.',
    reaction: 'Nổi mề đay sau khi sử dụng.',
    severity: 'MODERATE' as const,
  },
  {
    id: '60c01a7b-8a5d-4c85-901d-23a9ce2b7832',
    recordType: 'MEDICAL_HISTORY' as const,
    name: 'Trào ngược dạ dày - thực quản',
    description:
      'Tiền sử khai báo cho tài khoản kiểm thử; cần được bác sĩ xác nhận.',
    reaction: null,
    severity: null,
  },
];

function getLocalDatabaseUrl(): string {
  if (process.env.NODE_ENV === 'production') {
    throw new Error('Patient test accounts cannot be seeded in production.');
  }

  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) throw new Error('DATABASE_URL is required.');

  const databaseUrl = new URL(connectionString);
  const localHosts = new Set(['localhost', '127.0.0.1', '[::1]', '::1']);
  if (!localHosts.has(databaseUrl.hostname)) {
    throw new Error(
      'Patient test accounts can only be seeded into a local PostgreSQL database.',
    );
  }

  return connectionString;
}

async function main(): Promise<void> {
  const connectionString = getLocalDatabaseUrl();
  const schema =
    new URL(connectionString).searchParams.get('schema') || 'public';
  const prisma = new PrismaClient({
    adapter: new PrismaPg(
      { connectionString, connectionTimeoutMillis: 5000 },
      { schema },
    ),
  });

  try {
    const passwordHash = await hash(PATIENT_ACCOUNT.password, 12);
    await prisma.$transaction(async (transaction) => {
      await seedRbac(transaction);
      const patientRole = await transaction.role.findUniqueOrThrow({
        where: { name: RoleEnum.PATIENT },
      });
      assert.ok(
        patientRole.status === 'ACTIVE' && patientRole.deletedAt === null,
        'The patient role is disabled.',
      );

      const now = new Date();
      const user = await transaction.user.upsert({
        where: { email: PATIENT_ACCOUNT.email },
        create: {
          email: PATIENT_ACCOUNT.email,
          fullName: PATIENT_ACCOUNT.fullName,
          phone: PATIENT_ACCOUNT.phone,
          passwordHash,
          passwordChangedAt: now,
          emailVerifiedAt: now,
          status: 'ACTIVE',
          roleId: patientRole.id,
        },
        update: {
          fullName: PATIENT_ACCOUNT.fullName,
          phone: PATIENT_ACCOUNT.phone,
          passwordHash,
          passwordChangedAt: now,
          emailVerifiedAt: now,
          status: 'ACTIVE',
          deletedAt: null,
          roleId: patientRole.id,
        },
      });

      const patient = await transaction.patient.upsert({
        where: { userId: user.id },
        create: {
          userId: user.id,
          patientCode: PATIENT_ACCOUNT.patientCode,
          nationalId: null,
          fullName: PATIENT_ACCOUNT.fullName,
          dateOfBirth: PATIENT_ACCOUNT.dateOfBirth,
          gender: 'FEMALE',
          phone: PATIENT_ACCOUNT.phone,
          email: PATIENT_ACCOUNT.email,
          address: PATIENT_ACCOUNT.address,
          emergencyContactName: PATIENT_ACCOUNT.emergencyContactName,
          emergencyContactPhone: PATIENT_ACCOUNT.emergencyContactPhone,
        },
        update: {
          patientCode: PATIENT_ACCOUNT.patientCode,
          nationalId: null,
          fullName: PATIENT_ACCOUNT.fullName,
          dateOfBirth: PATIENT_ACCOUNT.dateOfBirth,
          gender: 'FEMALE',
          phone: PATIENT_ACCOUNT.phone,
          email: PATIENT_ACCOUNT.email,
          address: PATIENT_ACCOUNT.address,
          emergencyContactName: PATIENT_ACCOUNT.emergencyContactName,
          emergencyContactPhone: PATIENT_ACCOUNT.emergencyContactPhone,
        },
      });

      for (const record of PATIENT_HEALTH_RECORDS) {
        await transaction.patientMedicalRecord.upsert({
          where: { id: record.id },
          create: {
            ...record,
            patientId: patient.id,
            createdBy: user.id,
            status: 'PENDING_CONFIRMATION',
          },
          update: {
            ...record,
            patientId: patient.id,
            createdBy: user.id,
            confirmedBy: null,
            confirmedInConsultationId: null,
            confirmedAt: null,
            status: 'PENDING_CONFIRMATION',
          },
        });
      }
    });

    console.log(
      `Local patient test account ready. Email: ${PATIENT_ACCOUNT.email}; password: ${PATIENT_ACCOUNT.password}`,
    );
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((error: unknown) => {
  console.error(
    error instanceof Error ? error.message : 'Patient seed failed.',
  );
  process.exitCode = 1;
});
