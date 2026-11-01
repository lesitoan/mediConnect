import 'dotenv/config';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '../src/generated/prisma/client';
import { clinicDate, clinicDateString } from '../src/common/utils/clinic-date';

const DEMO_PATIENT_PREFIX = 'Q-DEMO-P-';
const DEMO_APPOINTMENT_PREFIX = 'Q-DEMO-A-';
const DEMO_USER_EMAIL_PREFIX = 'q-demo-p-';
const LEGACY_DEMO_USER_EMAIL_PREFIX = 'queue-demo-patient-';
const DEMO_DOCTOR_CODES = ['SEED-GEN-01'] as const;
const DEMO_QUEUE = [
  {
    doctorCode: 'SEED-GEN-01',
    status: 'WAITING',
    priorityType: 'APPOINTMENT_ON_TIME',
  },
  {
    doctorCode: 'SEED-GEN-01',
    status: 'CHECKED_IN',
    priorityType: 'REFERRAL',
  },
  {
    doctorCode: 'SEED-GEN-01',
    status: 'WAITING',
    priorityType: 'RETURNING_LAB',
  },
  {
    doctorCode: 'SEED-GEN-01',
    status: 'SKIPPED',
    priorityType: 'APPOINTMENT_LATE',
    skippedAgoSeconds: 300,
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
    status: 'COMPLETED',
    priorityType: 'APPOINTMENT_ON_TIME',
  },
  {
    doctorCode: 'SEED-GEN-01',
    status: 'NO_SHOW',
    priorityType: 'APPOINTMENT_ON_TIME',
    skipCount: 3,
    skippedAgoSeconds: 600,
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
  const patients: Array<{ id: string; userId: string | null }> =
    await prisma.patient.findMany({
      where: { patientCode: { startsWith: DEMO_PATIENT_PREFIX } },
      select: { id: true, userId: true },
    });
  const orphanedDemoUsers: Array<{ id: string }> = await prisma.user.findMany({
    where: {
      OR: [
        { email: { startsWith: DEMO_USER_EMAIL_PREFIX } },
        { email: { startsWith: LEGACY_DEMO_USER_EMAIL_PREFIX } },
      ],
    },
    select: { id: true },
  });
  await prisma.$transaction(async (tx) => {
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
    if (patients.length)
      await tx.patient.deleteMany({
        where: { id: { in: patients.map(({ id }) => id) } },
      });
    const userIds = Array.from(
      new Set([
        ...patients.flatMap(({ userId }) => (userId ? [userId] : [])),
        ...orphanedDemoUsers.map(({ id }) => id),
      ]),
    );
    if (userIds.length)
      await tx.user.deleteMany({ where: { id: { in: userIds } } });
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
    take: 3,
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
      'Cần ba bác sĩ có lịch đã công bố để tạo dữ liệu demo hợp lệ.',
    );
  const patientRole = await prisma.role.findUnique({
    where: { name: 'PATIENT' },
  });
  if (!patientRole) throw new Error('Không tìm thấy role bệnh nhân.');
  const now = new Date();
  const queueDate = clinicDate(clinicDateString(now));
  const queueNumbers = new Map<string, number>();
  const doctorsByCode = new Map(
    doctors.map((doctor) => [doctor.doctorCode, doctor]),
  );
  for (const doctor of doctors) {
    if (queueNumbers.has(doctor.id)) continue;
    const maximum = await prisma.careSession.aggregate({
      where: {
        appointmentSlot: { doctorSchedule: { doctorId: doctor.id } },
        queueDate,
      },
      _max: { queueNumber: true },
    });
    queueNumbers.set(doctor.id, (maximum._max.queueNumber ?? 0) + 1);
  }
  for (const [index, item] of DEMO_QUEUE.entries()) {
    const doctor = doctorsByCode.get(item.doctorCode);
    if (!doctor || !doctor.schedules[0])
      throw new Error('Không tìm thấy lịch bác sĩ để tạo lượt demo.');
    const queueNumber = queueNumbers.get(doctor.id);
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
        skipCount:
          'skipCount' in item
            ? item.skipCount
            : item.status === 'SKIPPED'
              ? 1
              : 0,
        calledAt:
          'calledAgoSeconds' in item
            ? new Date(now.getTime() - item.calledAgoSeconds * 1000)
            : null,
        skippedAt:
          'skippedAgoSeconds' in item
            ? new Date(now.getTime() - item.skippedAgoSeconds * 1000)
            : null,
      },
    });
    if (item.status === 'IN_CONSULTATION')
      await prisma.consultation.create({
        data: {
          careSessionId: careSession.id,
          startedAt: now,
          clinicalNotes: 'Bản nháp khám lâm sàng demo.',
          prescription: [],
        },
      });
    if (item.status === 'COMPLETED')
      await prisma.consultation.create({
        data: {
          careSessionId: careSession.id,
          startedAt: new Date(now.getTime() - 30 * 60_000),
          completedAt: new Date(now.getTime() - 5 * 60_000),
          lockedAt: new Date(now.getTime() - 5 * 60_000),
          clinicalNotes: 'Phiên khám demo đã hoàn tất.',
        },
      });
    queueNumbers.set(doctor.id, queueNumber + 1);
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
