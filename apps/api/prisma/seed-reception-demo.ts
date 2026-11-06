import 'dotenv/config';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../src/modules/database/services/prisma.service';
import { requireE2EClock } from '../src/common/utils/e2e-clock';

const DEMO_DOCTOR_CODES = ['SEED-GEN-01', 'SEED-GEN-02', 'SEED-SUR-01'];
const DEMO_PATIENT_PREFIX = 'REC-DEMO-';
const DEMO_APPOINTMENT_PREFIX = 'MDC-REC-';
const E2E_PATIENT_NAME_PREFIX = 'E2E-AUTOMATION-';
const E2E_PATIENT_PHONE_PREFIX = '09099999';
const E2E_APPOINTMENT_REASON_PREFIX = 'E2E-AUTO-';
const DEMO_PATIENTS = [
  {
    fullName: 'Lê Văn Cường',
    phone: '0901234567',
    dateOfBirth: new Date('2000-04-15T00:00:00+07:00'),
    gender: 'MALE' as const,
  },
  {
    fullName: 'Nguyễn Thị Mai',
    phone: '0912345678',
    dateOfBirth: new Date('1995-05-20T00:00:00+07:00'),
    gender: 'FEMALE' as const,
  },
  {
    fullName: 'Phạm Quốc Bảo',
    phone: '0987654321',
    dateOfBirth: new Date('1992-09-10T00:00:00+07:00'),
    gender: 'MALE' as const,
  },
  {
    fullName: 'Bệnh nhân demo tiếp nhận 4',
    phone: '0900000004',
    dateOfBirth: new Date('1984-01-01T00:00:00+07:00'),
    gender: 'FEMALE' as const,
  },
];

function clinicDateString(value: Date): string {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Ho_Chi_Minh',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(value);
  const values = Object.fromEntries(
    parts
      .filter(({ type }) => type !== 'literal')
      .map(({ type, value }) => [type, value]),
  );
  return `${values.year}-${values.month}-${values.day}`;
}

function clinicDate(value: string): Date {
  return new Date(`${value}T00:00:00Z`);
}

function addDays(value: Date, amount: number): Date {
  const result = new Date(value);
  result.setUTCDate(result.getUTCDate() + amount);
  return result;
}

function clinicDateTime(value: string, hour: number, minute: number): Date {
  return new Date(
    `${value}T${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}:00+07:00`,
  );
}

async function cleanup(prisma: PrismaService) {
  const demoPatients = await prisma.patient.findMany({
    where: {
      OR: [
        { patientCode: { startsWith: DEMO_PATIENT_PREFIX } },
        {
          fullName: { startsWith: E2E_PATIENT_NAME_PREFIX },
          phone: { startsWith: E2E_PATIENT_PHONE_PREFIX },
        },
      ],
    },
    select: { id: true, userId: true },
  });
  const demoPatientUserIds = demoPatients.flatMap(({ userId }) =>
    userId ? [userId] : [],
  );
  const demoAppointments = await prisma.appointment.findMany({
    where: {
      OR: [
        { appointmentCode: { startsWith: DEMO_APPOINTMENT_PREFIX } },
        { reason: { startsWith: E2E_APPOINTMENT_REASON_PREFIX } },
        ...(demoPatients.length
          ? [{ patientId: { in: demoPatients.map(({ id }) => id) } }]
          : []),
      ],
    },
    select: { id: true },
  });
  const demoSessions = await prisma.careSession.findMany({
    where: { appointmentId: { in: demoAppointments.map(({ id }) => id) } },
    select: { id: true },
  });
  await prisma.$transaction(async (tx) => {
    if (demoSessions.length)
      await tx.careSession.deleteMany({
        where: { id: { in: demoSessions.map(({ id }) => id) } },
      });
    if (demoAppointments.length)
      await tx.appointment.deleteMany({
        where: { id: { in: demoAppointments.map(({ id }) => id) } },
      });
    if (demoPatients.length)
      await tx.patient.deleteMany({
        where: { id: { in: demoPatients.map(({ id }) => id) } },
      });
    if (demoPatientUserIds.length)
      await tx.user.deleteMany({
        where: { id: { in: demoPatientUserIds } },
      });
  });
}

async function findAvailableSlot(
  prisma: PrismaService,
  doctorCode: string,
  date: string,
  startsAtOrAfter: Date,
) {
  const dateEnd = addDays(clinicDate(date), 1);
  const slot = await prisma.appointmentSlot.findFirst({
    where: {
      startsAt: { gte: startsAtOrAfter, lt: dateEnd },
      isBlocked: false,
      careSessions: { none: {} },
      doctorSchedule: {
        status: 'PUBLISHED',
        doctor: { doctorCode },
      },
    },
    include: { doctorSchedule: { include: { doctor: true } } },
    orderBy: { startsAt: 'asc' },
  });
  if (!slot) {
    throw new Error(
      `Không tìm thấy khung giờ trống từ ${startsAtOrAfter.toISOString()} cho ${doctorCode} trong ngày ${date}. Hãy chạy "npx.cmd tsx prisma\\seed-local-schedules.ts" và kiểm tra giờ hoạt động của phòng khám.`,
    );
  }
  return slot;
}

async function seedAppointments(prisma: PrismaService, adminId: string) {
  const patientRole = await prisma.role.findUniqueOrThrow({
    where: { name: 'PATIENT' },
  });
  const patients: Awaited<ReturnType<typeof prisma.patient.upsert>>[] = [];
  for (const [index, profile] of DEMO_PATIENTS.entries()) {
    const patientNumber = index + 1;
    const email = `reception-demo-${patientNumber}@example.invalid`;
    const patientCode = `${DEMO_PATIENT_PREFIX}${String(patientNumber).padStart(2, '0')}`;
    const user = await prisma.user.upsert({
      where: { email },
      create: {
        email,
        fullName: profile.fullName,
        status: 'ACTIVE',
        roleId: patientRole.id,
      },
      update: {
        fullName: profile.fullName,
        status: 'ACTIVE',
        roleId: patientRole.id,
      },
    });
    const patient = await prisma.patient.upsert({
      where: { userId: user.id },
      create: {
        userId: user.id,
        patientCode,
        fullName: profile.fullName,
        phone: profile.phone,
        gender: profile.gender,
        dateOfBirth: profile.dateOfBirth,
      },
      update: {
        patientCode,
        fullName: profile.fullName,
        phone: profile.phone,
        gender: profile.gender,
        dateOfBirth: profile.dateOfBirth,
      },
    });
    patients.push(patient);
  }
  const now = requireE2EClock();
  const today = clinicDateString(now);
  const tomorrow = clinicDateString(addDays(clinicDate(today), 1));
  const clinicOpening = clinicDateTime(today, 8, 0);
  const firstAppointmentSlot = await findAvailableSlot(
    prisma,
    'SEED-GEN-01',
    today,
    new Date(now.getTime() + 30 * 60_000),
  );
  const secondAppointmentSlot = await findAvailableSlot(
    prisma,
    'SEED-GEN-01',
    today,
    new Date(firstAppointmentSlot.startsAt.getTime() + 30 * 60_000),
  );
  const cancelledAppointmentSlot = await findAvailableSlot(
    prisma,
    'SEED-GEN-01',
    today,
    new Date(secondAppointmentSlot.startsAt.getTime() + 30 * 60_000),
  );
  const appointmentFixtures = [
    {
      code: `${DEMO_APPOINTMENT_PREFIX}01`,
      patient: patients[0],
      doctorCode: 'SEED-GEN-01',
      date: today,
      startsAtOrAfter: firstAppointmentSlot.startsAt,
      reason: 'Khám demo chờ check-in',
      status: 'CONFIRMED' as const,
      sessionStatus: 'SCHEDULED' as const,
      queueNumber: null,
    },
    {
      code: `${DEMO_APPOINTMENT_PREFIX}02`,
      patient: patients[1],
      doctorCode: 'SEED-GEN-01',
      date: today,
      startsAtOrAfter: secondAppointmentSlot.startsAt,
      reason: 'Khám demo tra cứu theo tên',
      status: 'CONFIRMED' as const,
      sessionStatus: 'SCHEDULED' as const,
      queueNumber: null,
    },
    {
      code: `${DEMO_APPOINTMENT_PREFIX}03`,
      patient: patients[2],
      doctorCode: 'SEED-GEN-01',
      date: today,
      startsAtOrAfter: cancelledAppointmentSlot.startsAt,
      reason: 'Lịch demo đã hủy',
      status: 'CANCELLED' as const,
      sessionStatus: 'CANCELLED' as const,
      queueNumber: null,
    },
    {
      code: `${DEMO_APPOINTMENT_PREFIX}04`,
      patient: patients[3],
      doctorCode: 'SEED-GEN-02',
      date: today,
      startsAtOrAfter: clinicOpening,
      reason: 'Lịch demo đã check-in',
      status: 'CONFIRMED' as const,
      sessionStatus: 'CHECKED_IN' as const,
      queueNumber: null,
    },
    {
      code: `${DEMO_APPOINTMENT_PREFIX}05`,
      patient: patients[1],
      doctorCode: 'SEED-GEN-01',
      date: tomorrow,
      startsAtOrAfter: clinicDateTime(tomorrow, 9, 0),
      reason: 'Khám demo ngày tiếp theo',
      status: 'CONFIRMED' as const,
      sessionStatus: 'SCHEDULED' as const,
      queueNumber: null,
    },
    {
      code: `${DEMO_APPOINTMENT_PREFIX}06`,
      patient: patients[2],
      doctorCode: 'SEED-GEN-01',
      date: today,
      startsAtOrAfter: clinicDateTime(today, 8, 0),
      reason: 'Lịch demo đã quá giờ',
      status: 'CONFIRMED' as const,
      sessionStatus: 'SCHEDULED' as const,
      queueNumber: null,
    },
    {
      code: `${DEMO_APPOINTMENT_PREFIX}07`,
      patient: patients[3],
      doctorCode: 'SEED-GEN-02',
      date: today,
      startsAtOrAfter: clinicDateTime(today, 8, 30),
      reason: 'Lịch demo đã hoàn thành',
      status: 'CONFIRMED' as const,
      sessionStatus: 'COMPLETED' as const,
      queueNumber: null,
    },
    {
      code: `${DEMO_APPOINTMENT_PREFIX}08`,
      patient: patients[0],
      doctorCode: 'SEED-GEN-01',
      date: today,
      startsAtOrAfter: clinicDateTime(today, 9, 0),
      reason: 'Lịch demo chờ xử lý',
      status: 'PENDING_RESOLUTION' as const,
      sessionStatus: 'SCHEDULED' as const,
      queueNumber: null,
    },
  ];

  for (const fixture of appointmentFixtures) {
    const slot = await findAvailableSlot(
      prisma,
      fixture.doctorCode,
      fixture.date,
      fixture.startsAtOrAfter,
    );

    let queueNumber: number | null = fixture.queueNumber;
    if (fixture.sessionStatus === 'CHECKED_IN') {
      const maximum = await prisma.careSession.aggregate({
        where: {
          specialtyId: slot.doctorSchedule.doctor.specialtyId,
          queueDate: clinicDate(today),
          queueNumber: { not: null },
        },
        _max: { queueNumber: true },
      });
      queueNumber = (maximum._max.queueNumber ?? 0) + 1;
    }

    await prisma.appointment.create({
      data: {
        appointmentCode: fixture.code,
        patientId: fixture.patient.id,
        bookingSource: 'RECEPTIONIST',
        status: fixture.status,
        createdBy: adminId,
        reason: fixture.reason,
        careSessions: {
          create: {
            appointmentSlotId: slot.id,
            specialtyId: slot.doctorSchedule.doctor.specialtyId,
            status: fixture.sessionStatus,
            checkedInAt: fixture.sessionStatus === 'CHECKED_IN' ? now : null,
            checkedInBy:
              fixture.sessionStatus === 'CHECKED_IN' ? adminId : null,
            queueDate:
              fixture.sessionStatus === 'CHECKED_IN' ? clinicDate(today) : null,
            queueNumber,
            queuePosition: queueNumber,
          },
        },
      },
    });
  }
}

function getLocalDatabaseUrl(): string {
  if (process.env.NODE_ENV === 'production') {
    throw new Error('Reception demo data cannot be seeded in production.');
  }

  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) throw new Error('DATABASE_URL is required');

  const hostname = new URL(connectionString).hostname;
  if (!['localhost', '127.0.0.1', '::1', '[::1]'].includes(hostname)) {
    throw new Error(
      'Reception demo data can only be seeded into a local PostgreSQL database.',
    );
  }

  return connectionString;
}

async function main() {
  const shouldCleanup = process.argv.includes('--cleanup');
  const connectionString = getLocalDatabaseUrl();
  if (!shouldCleanup) requireE2EClock();
  const config = {
    getOrThrow<T>(): T {
      return connectionString as T;
    },
  } as unknown as ConfigService;
  const prisma = new PrismaService(config);
  await prisma.$connect();
  try {
    if (shouldCleanup) {
      await cleanup(prisma);
      console.log('Reception demo data cleaned.');
      return;
    }
    const admin = await prisma.user.findFirstOrThrow({
      where: { email: 'admin01@example.invalid' },
    });
    const doctors = await prisma.doctor.findMany({
      where: { doctorCode: { in: DEMO_DOCTOR_CODES } },
      select: { userId: true },
    });
    if (doctors.length !== DEMO_DOCTOR_CODES.length)
      throw new Error('Required demo doctors are missing.');
    await cleanup(prisma);
    await seedAppointments(prisma, admin.id);
    console.log('Reception demo data is ready.');
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((error: unknown) => {
  console.error(error);
  process.exitCode = 1;
});
