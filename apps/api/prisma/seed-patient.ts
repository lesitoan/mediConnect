import 'dotenv/config';
import assert from 'node:assert/strict';
import { hash } from 'bcrypt';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient, Prisma } from '../src/generated/prisma/client';
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

const DEMO_APPOINTMENT_CODES = [
  'PAT-APPT-CANCEL',
  'PAT-APPT-PAID',
  'PAT-APPT-LIMIT',
  'PAT-APPT-CHANGE',
] as const;

async function seedDemoAppointments(
  transaction: Prisma.TransactionClient,
  patientId: string,
  userId: string,
) {
  const doctorSchedule = await transaction.doctorSchedule.findFirst({
    where: {
      status: 'PUBLISHED',
      doctor: { isActive: true },
    },
    orderBy: { startsAt: 'asc' },
    select: { id: true, doctor: { select: { specialtyId: true } } },
  });
  if (!doctorSchedule) {
    console.warn(
      'Skipped patient appointment fixtures: no published doctor schedule was found.',
    );
    return;
  }

  for (const appointmentCode of DEMO_APPOINTMENT_CODES) {
    const existing = await transaction.appointment.findUnique({
      where: { appointmentCode },
      select: {
        id: true,
        careSessions: { select: { id: true, consultation: { select: { id: true } } } },
        invoices: { select: { id: true } },
      },
    });
    if (existing) {
      for (const session of existing.careSessions) {
        if (session.consultation)
          await transaction.review.deleteMany({
            where: { consultationId: session.consultation.id },
          });
        if (session.consultation)
          await transaction.consultation.delete({
            where: { id: session.consultation.id },
          });
      }
      for (const invoice of existing.invoices) {
        await transaction.paymentTransaction.deleteMany({
          where: { invoiceId: invoice.id },
        });
        await transaction.invoice.delete({ where: { id: invoice.id } });
      }
      await transaction.careSession.deleteMany({
        where: { appointmentId: existing.id },
      });
      await transaction.appointment.delete({ where: { id: existing.id } });
    }
  }

  const now = new Date();
  const fixtures = [
    {
      code: 'PAT-APPT-CANCEL',
      offsetHours: -48,
      appointmentStatus: 'CANCELLED' as const,
      sessionStatus: 'CANCELLED' as const,
      rescheduleCount: 0,
    },
    {
      code: 'PAT-APPT-PAID',
      offsetHours: -24,
      appointmentStatus: 'CONFIRMED' as const,
      sessionStatus: 'COMPLETED' as const,
      rescheduleCount: 0,
    },
    {
      code: 'PAT-APPT-LIMIT',
      offsetHours: 72,
      appointmentStatus: 'CONFIRMED' as const,
      sessionStatus: 'SCHEDULED' as const,
      rescheduleCount: 2,
    },
    {
      code: 'PAT-APPT-CHANGE',
      offsetHours: 96,
      appointmentStatus: 'CONFIRMED' as const,
      sessionStatus: 'SCHEDULED' as const,
      rescheduleCount: 0,
    },
  ];

  for (const fixture of fixtures) {
    const startsAt = new Date(now.getTime() + fixture.offsetHours * 3600000);
    const appointmentSlot = await transaction.appointmentSlot.create({
      data: {
        doctorScheduleId: doctorSchedule.id,
        startsAt,
        endsAt: new Date(startsAt.getTime() + 30 * 60000),
      },
    });
    const appointment = await transaction.appointment.create({
      data: {
        appointmentCode: fixture.code,
        patientId,
        bookingSource: 'PATIENT',
        status: fixture.appointmentStatus,
        rescheduleCount: fixture.rescheduleCount,
        createdBy: userId,
        reason: 'Dữ liệu mẫu phiên khám cho bệnh nhân kiểm thử',
        ...(fixture.appointmentStatus === 'CANCELLED'
          ? {
              cancellationReason: 'Dữ liệu mẫu lịch đã hủy',
              cancelledBy: userId,
              cancelledAt: now,
            }
          : {}),
      },
    });
    const careSession = await transaction.careSession.create({
      data: {
        appointmentId: appointment.id,
        appointmentSlotId: appointmentSlot.id,
        specialtyId: doctorSchedule.doctor.specialtyId,
        status: fixture.sessionStatus,
      },
    });

    if (fixture.sessionStatus === 'COMPLETED') {
      const completedAt = new Date(startsAt.getTime() + 30 * 60000);
      const consultation = await transaction.consultation.create({
        data: {
          careSessionId: careSession.id,
          startedAt: startsAt,
          completedAt,
          lockedAt: completedAt,
          clinicalNotes: 'Dữ liệu mẫu phiên khám đã hoàn tất.',
        },
      });
      const invoice = await transaction.invoice.create({
        data: {
          invoiceCode: 'PAT-INVOICE-PAID',
          appointmentId: appointment.id,
          consultationId: consultation.id,
          totalAmount: 450000,
          chargeDetails: [{ name: 'Phí khám chuyên khoa', amount: 450000 }],
          status: 'OPEN',
        },
      });
      await transaction.paymentTransaction.create({
        data: {
          invoiceId: invoice.id,
          provider: 'COUNTER',
          idempotencyKey: 'PAT-PAYMENT-PAID',
          transactionType: 'PAYMENT',
          amount: 450000,
          status: 'SUCCESS',
          occurredAt: completedAt,
          reconciliationNote: 'Dữ liệu mẫu đã thanh toán.',
        },
      });
    }
  }
}

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

      await seedDemoAppointments(transaction, patient.id, user.id);
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
