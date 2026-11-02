import 'dotenv/config';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '../src/generated/prisma/client';
import { clinicDate } from '../src/common/utils/clinic-date';

const DEMO_PATIENT_PREFIX = 'Q-DEMO-P-';
const DEMO_APPOINTMENT_PREFIX = 'Q-DEMO-A-';
const DEMO_USER_EMAIL_PREFIX = 'q-demo-p-';
const DEMO_DOCTOR_CODES = ['SEED-GEN-01', 'SEED-GEN-02'] as const;
const DEMO_QUEUE = [
  {
    doctorCode: 'SEED-GEN-01',
    status: 'WAITING',
    priorityType: 'APPOINTMENT_ON_TIME',
  },
  {
    doctorCode: 'SEED-GEN-01',
    status: 'WAITING',
    priorityType: 'WALK_IN',
  },
  {
    doctorCode: 'SEED-GEN-01',
    status: 'WAITING',
    priorityType: 'RETURNING_LAB',
  },
  {
    doctorCode: 'SEED-GEN-01',
    status: 'WAITING',
    priorityType: 'APPOINTMENT_LATE',
  },
  {
    doctorCode: 'SEED-GEN-01',
    status: 'WAITING',
    priorityType: 'REFERRAL',
  },
  {
    doctorCode: 'SEED-GEN-01',
    status: 'CALLED',
    priorityType: 'WALK_IN',
    calledAgoSeconds: 60,
  },
  {
    doctorCode: 'SEED-GEN-01',
    status: 'IN_CONSULTATION',
    priorityType: 'APPOINTMENT_ON_TIME',
  },
  {
    doctorCode: 'SEED-GEN-01',
    status: 'PAUSED',
    priorityType: 'APPOINTMENT_ON_TIME',
  },
  {
    doctorCode: 'SEED-GEN-01',
    status: 'WAITING_LAB',
    priorityType: 'APPOINTMENT_ON_TIME',
  },
  {
    doctorCode: 'SEED-GEN-01',
    status: 'COMPLETED',
    priorityType: 'APPOINTMENT_ON_TIME',
  },
  {
    doctorCode: 'SEED-GEN-02',
    status: 'WAITING',
    priorityType: 'APPOINTMENT_ON_TIME',
  },
] as const;

function assertLocalDatabase(connectionString: string): void {
  const hostname = new URL(connectionString).hostname;
  if (
    process.env.NODE_ENV === 'production' ||
    !['localhost', '127.0.0.1', '::1'].includes(hostname)
  )
    throw new Error('Queue demo seed chỉ được chạy trên PostgreSQL local.');
}

async function cleanup(prisma: PrismaClient): Promise<void> {
  const appointments = await prisma.appointment.findMany({
    where: { appointmentCode: { startsWith: DEMO_APPOINTMENT_PREFIX } },
    select: {
      id: true,
      careSessions: { select: { id: true, appointmentSlotId: true } },
    },
  });
  const appointmentIds = appointments.map(({ id }) => id);
  const sessionIds = appointments.flatMap(({ careSessions }) =>
    careSessions.map(({ id }) => id),
  );
  const slotIds = appointments.flatMap(({ careSessions }) =>
    careSessions.map(({ appointmentSlotId }) => appointmentSlotId),
  );
  const consultations = await prisma.consultation.findMany({
    where: { careSessionId: { in: sessionIds } },
    select: { id: true },
  });
  const consultationIds = consultations.map(({ id }) => id);
  const referrals = await prisma.internalReferral.findMany({
    where: { sourceConsultationId: { in: consultationIds } },
    include: {
      targetCareSession: {
        select: {
          appointment: { select: { appointmentCode: true } },
        },
      },
    },
  });
  if (
    referrals.some(
      ({ targetCareSession }) =>
        targetCareSession &&
        !targetCareSession.appointment.appointmentCode.startsWith(
          DEMO_APPOINTMENT_PREFIX,
        ),
    )
  )
    throw new Error(
      'Q-DEMO referrals target non-demo sessions; cleanup stopped to preserve external visits.',
    );
  await prisma.$transaction(async (tx) => {
    if (sessionIds.length)
      await tx.careSession.updateMany({
        where: { id: { in: sessionIds } },
        data: { incomingReferralId: null },
      });
    if (consultationIds.length)
      await tx.patientMedicalRecord.deleteMany({
        where: { confirmedInConsultationId: { in: consultationIds } },
      });
    if (consultationIds.length)
      await tx.internalReferral.deleteMany({
        where: { sourceConsultationId: { in: consultationIds } },
      });
    if (consultationIds.length)
      await tx.diagnosis.deleteMany({
        where: { consultationId: { in: consultationIds } },
      });
    if (consultationIds.length)
      await tx.review.deleteMany({
        where: { consultationId: { in: consultationIds } },
      });
    if (consultationIds.length)
      await tx.invoice.deleteMany({
        where: { consultationId: { in: consultationIds } },
      });
    if (appointmentIds.length)
      await tx.invoice.deleteMany({
        where: { appointmentId: { in: appointmentIds } },
      });
    if (sessionIds.length)
      await tx.consultation.deleteMany({
        where: { careSessionId: { in: sessionIds } },
      });
    if (sessionIds.length)
      await tx.careSession.deleteMany({ where: { id: { in: sessionIds } } });
    if (appointmentIds.length)
      await tx.appointment.deleteMany({
        where: { id: { in: appointmentIds } },
      });
    if (slotIds.length)
      await tx.appointmentSlot.deleteMany({ where: { id: { in: slotIds } } });
  });
}

async function seed(prisma: PrismaClient): Promise<void> {
  const adminAccount = await prisma.user.findUnique({
    where: { email: 'admin01@example.invalid' },
    select: { id: true },
  });
  const admin =
    adminAccount ??
    (await prisma.user.findFirst({
      where: { status: 'ACTIVE', role: { name: 'ADMIN' } },
      orderBy: [{ createdAt: 'asc' }, { id: 'asc' }],
      select: { id: true },
    }));
  if (!admin) throw new Error('Không tìm thấy tài khoản ADMIN đang hoạt động.');
  const doctors = await prisma.doctor.findMany({
    where: {
      doctorCode: { in: [...DEMO_DOCTOR_CODES] },
      isActive: true,
      user: { status: 'ACTIVE' },
      schedules: { some: { status: 'PUBLISHED' } },
    },
    orderBy: { doctorCode: 'asc' },
    select: {
      id: true,
      doctorCode: true,
      specialtyId: true,
      schedules: {
        where: { status: 'PUBLISHED' },
        orderBy: { startsAt: 'asc' },
        take: 1,
        select: { id: true },
      },
    },
  });
  if (
    doctors.length !== DEMO_DOCTOR_CODES.length ||
    doctors.some((doctor) => !doctor.schedules[0])
  )
    throw new Error(
      'Seed-gen-01 and seed-gen-02 must have published schedules.',
    );
  const patientRole = await prisma.role.findUnique({
    where: { name: 'PATIENT' },
  });
  if (!patientRole) throw new Error('Không tìm thấy role bệnh nhân.');
  const now = new Date();
  const queueDate = clinicDate();
  const queueNumbers = new Map<string, number>();
  const doctorsByCode = new Map(
    doctors.map((doctor) => [doctor.doctorCode, doctor]),
  );
  for (const doctor of doctors) {
    if (queueNumbers.has(doctor.specialtyId)) continue;
    const maximum = await prisma.careSession.aggregate({
      where: {
        specialtyId: doctor.specialtyId,
        queueDate,
      },
      _max: { queueNumber: true },
    });
    queueNumbers.set(doctor.specialtyId, (maximum._max.queueNumber ?? 0) + 1);
  }
  for (const [index, item] of DEMO_QUEUE.entries()) {
    const doctor = doctorsByCode.get(item.doctorCode);
    if (!doctor || !doctor.schedules[0])
      throw new Error('Không tìm thấy lịch bác sĩ để tạo lượt demo.');
    const queueNumber = queueNumbers.get(doctor.specialtyId);
    if (queueNumber === undefined)
      throw new Error('Không thể cấp STT demo theo chuyên khoa.');
    const patientCode = `${DEMO_PATIENT_PREFIX}${String(index + 1).padStart(2, '0')}`;
    const email = `${DEMO_USER_EMAIL_PREFIX}${String(index + 1).padStart(2, '0')}@example.invalid`;
    const fullName = `Bệnh nhân demo hàng chờ ${index + 1}`;
    const user = await prisma.user.upsert({
      where: { email },
      create: { email, fullName, status: 'ACTIVE', roleId: patientRole.id },
      update: { fullName, status: 'ACTIVE', roleId: patientRole.id },
      select: { id: true },
    });
    const patient = await prisma.patient.upsert({
      where: { userId: user.id },
      create: {
        userId: user.id,
        patientCode,
        fullName,
        phone: `09000000${String(index + 20).padStart(2, '0')}`,
        dateOfBirth: new Date('1990-01-01T00:00:00.000Z'),
        gender: index % 2 === 0 ? 'FEMALE' : 'MALE',
      },
      update: { patientCode, fullName },
      select: { id: true },
    });
    const startsAt = new Date(now.getTime() + (index + 1) * 60_000);
    const appointmentSlot = await prisma.appointmentSlot.create({
      data: {
        doctorScheduleId: doctor.schedules[0].id,
        startsAt,
        endsAt: new Date(startsAt.getTime() + 15 * 60_000),
      },
      select: { id: true },
    });
    const appointment = await prisma.appointment.create({
      data: {
        appointmentCode: `${DEMO_APPOINTMENT_PREFIX}${String(index + 1).padStart(3, '0')}`,
        patientId: patient.id,
        bookingSource: 'RECEPTIONIST',
        status: 'CONFIRMED',
        createdBy: admin.id,
        reason: `Q-DEMO complaint ${String(index + 1).padStart(2, '0')}`,
      },
      select: { id: true },
    });
    const careSession = await prisma.careSession.create({
      data: {
        appointmentId: appointment.id,
        appointmentSlotId: appointmentSlot.id,
        specialtyId: doctor.specialtyId,
        status: item.status,
        checkedInAt: now,
        checkedInBy: admin.id,
        queueDate,
        queueNumber,
        queuePosition: queueNumber,
        priorityType: item.priorityType,
        skipCount: 0,
        calledAt:
          'calledAgoSeconds' in item
            ? new Date(now.getTime() - item.calledAgoSeconds * 1000)
            : null,
        skippedAt: null,
      },
    });
    const hasConsultation =
      item.status === 'IN_CONSULTATION' ||
      item.status === 'PAUSED' ||
      item.status === 'WAITING_LAB' ||
      item.status === 'COMPLETED';
    if (hasConsultation) {
      const isCompleted = item.status === 'COMPLETED';
      const completedAt = isCompleted
        ? new Date(now.getTime() - 5 * 60_000)
        : null;
      await prisma.consultation.create({
        data: {
          careSessionId: careSession.id,
          startedAt: isCompleted ? new Date(now.getTime() - 30 * 60_000) : now,
          completedAt,
          lockedAt: completedAt,
          clinicalNotes: `Q-DEMO clinical note ${String(index + 1).padStart(2, '0')}`,
          prescription: [],
          labOrderNotes:
            item.status === 'WAITING_LAB'
              ? JSON.stringify({
                  orders: [
                    {
                      service: 'Q-DEMO CBC',
                      purpose: 'Q-DEMO test',
                      instructions: 'Q-DEMO instruction',
                    },
                  ],
                  reason: 'Q-DEMO test',
                  notes: '',
                  results: [],
                  orderedAt: now.toISOString(),
                })
              : item.status === 'PAUSED'
                ? JSON.stringify({
                    pauseEvents: [
                      {
                        action: 'PAUSED',
                        reason: 'Q-DEMO seeded pause',
                        occurredAt: now.toISOString(),
                        actorId: admin.id,
                      },
                    ],
                  })
                : null,
          diagnoses: {
            create: {
              diagnosisCode: 'Z00',
              diagnosisName: 'Q-DEMO general assessment',
              isPrimary: true,
              notes: 'Q-DEMO seeded primary diagnosis',
            },
          },
        },
      });
    }
    queueNumbers.set(doctor.specialtyId, queueNumber + 1);
  }
}

async function main(): Promise<void> {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) throw new Error('DATABASE_URL is required');
  assertLocalDatabase(connectionString);
  const schema =
    new URL(connectionString).searchParams.get('schema') || 'public';
  const prisma = new PrismaClient({
    adapter: new PrismaPg(
      { connectionString, connectionTimeoutMillis: 5000 },
      { schema },
    ),
  });
  await prisma.$connect();
  try {
    if (process.argv.includes('--cleanup')) {
      await cleanup(prisma);
      console.log('Queue demo data cleaned.');
    } else {
      await cleanup(prisma);
      await seed(prisma);
      console.log('Queue demo data is ready.');
    }
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : 'Queue seed failed.');
  process.exitCode = 1;
});
