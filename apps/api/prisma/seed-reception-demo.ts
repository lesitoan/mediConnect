import 'dotenv/config';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../src/modules/database/services/prisma.service';
import { SchedulesService } from '../src/modules/schedules/schedules.service';
import { SchedulesRepository } from '../src/modules/schedules/schedules.repository';
import { AuditLogsService } from '../src/modules/audit-logs/audit-logs.service';
import type { CurrentUserDto } from '../src/modules/users/dto/responses/current-user.dto';

const DEMO_SCHEDULE_TYPE = 'SHIFT' as const;
const DEMO_DOCTOR_CODES = ['SEED-GEN-01', 'SEED-GEN-02', 'SEED-SUR-01'];
const DEMO_PATIENT_PREFIX = 'REC-DEMO-';
const DEMO_APPOINTMENT_PREFIX = 'MDC-REC-';
const SLOT_DURATION_MINUTES = 15;
const MORNING_START_HOUR = 7;
const MORNING_START_MINUTE = 30;
const MORNING_END_HOUR = 12;

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

function clinicMinutes(value: Date): number {
  const parts = new Intl.DateTimeFormat('en-GB', {
    timeZone: 'Asia/Ho_Chi_Minh',
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23',
  }).formatToParts(value);
  const hour = Number(parts.find(({ type }) => type === 'hour')?.value ?? 0);
  const minute = Number(
    parts.find(({ type }) => type === 'minute')?.value ?? 0,
  );
  return hour * 60 + minute;
}

function clinicDate(value: string): Date {
  return new Date(`${value}T00:00:00Z`);
}

function addDays(value: Date, amount: number): Date {
  const result = new Date(value);
  result.setDate(result.getDate() + amount);
  return result;
}

function withTime(value: Date, hour: number, minute: number): Date {
  const result = new Date(value);
  result.setHours(hour, minute, 0, 0);
  return result;
}

function dayOfWeek(value: Date): number {
  const day = value.getDay();
  return day === 0 ? 7 : day;
}

function adminUser(id: string, name: string): CurrentUserDto {
  return {
    id,
    name,
    email: null,
    phone: null,
    avatar: null,
    roleId: '',
    role: 'ADMIN',
    status: 'ACTIVE',
    permissions: [],
    createdAt: new Date(),
  };
}

async function createPublishedSchedule(
  schedules: SchedulesService,
  prisma: PrismaService,
  doctorUserId: string,
  admin: CurrentUserDto,
  effectiveFrom: Date,
  effectiveTo: Date,
  day: Date,
  startsAt: Date,
  endsAt: Date,
) {
  const existing = await prisma.staffWorkSchedule.findFirst({
    where: {
      staffUserId: doctorUserId,
      staffType: 'DOCTOR',
      scheduleType: DEMO_SCHEDULE_TYPE,
      startsAt,
      endsAt,
      effectiveFrom,
      effectiveTo,
      createdBy: admin.id,
    },
  });
  if (existing) return existing;
  const schedule = await schedules.createWorkSchedule(
    {
      staffUserId: doctorUserId,
      staffType: 'DOCTOR',
      dayOfWeek: dayOfWeek(day),
      startsAt: startsAt.toISOString(),
      endsAt: endsAt.toISOString(),
      effectiveFrom: effectiveFrom.toISOString(),
      effectiveTo: effectiveTo.toISOString(),
      scheduleType: DEMO_SCHEDULE_TYPE,
      slotDurationMinutes: SLOT_DURATION_MINUTES,
    },
    admin,
  );
  await schedules.publishWorkSchedule(schedule.id, admin);
  return schedule;
}

async function cleanup(
  prisma: PrismaService,
  doctorUserIds: string[],
  adminId: string,
) {
  const demoPatients = await prisma.patient.findMany({
    where: { patientCode: { startsWith: DEMO_PATIENT_PREFIX } },
    select: { id: true, userId: true },
  });
  const demoPatientUserIds = demoPatients.flatMap(({ userId }) =>
    userId ? [userId] : [],
  );
  const demoAppointments = await prisma.appointment.findMany({
    where: {
      appointmentCode: { startsWith: DEMO_APPOINTMENT_PREFIX },
    },
    select: { id: true },
  });
  const demoSessions = await prisma.careSession.findMany({
    where: { appointmentId: { in: demoAppointments.map(({ id }) => id) } },
    select: { id: true },
  });
  const schedules = await prisma.staffWorkSchedule.findMany({
    where: {
      staffUserId: { in: doctorUserIds },
      staffType: 'DOCTOR',
      scheduleType: DEMO_SCHEDULE_TYPE,
      createdBy: adminId,
    },
    select: { id: true },
  });
  const doctorSchedules = await prisma.doctorSchedule.findMany({
    where: {
      createdBy: adminId,
      scheduleType: DEMO_SCHEDULE_TYPE,
      doctor: { userId: { in: doctorUserIds } },
    },
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
    if (doctorSchedules.length) {
      await tx.appointmentSlot.deleteMany({
        where: {
          doctorScheduleId: { in: doctorSchedules.map(({ id }) => id) },
        },
      });
      await tx.doctorSchedule.deleteMany({
        where: { id: { in: doctorSchedules.map(({ id }) => id) } },
      });
    }
    if (schedules.length)
      await tx.staffWorkSchedule.deleteMany({
        where: { id: { in: schedules.map(({ id }) => id) } },
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

async function seedAppointments(
  prisma: PrismaService,
  adminId: string,
  doctorCodes: string[],
) {
  const doctors = await prisma.doctor.findMany({
    where: { doctorCode: { in: doctorCodes } },
    select: {
      id: true,
      userId: true,
      specialtyId: true,
      user: { select: { fullName: true } },
    },
  });
  const patientRole = await prisma.role.findUniqueOrThrow({
    where: { name: 'PATIENT' },
  });
  const patients = [];
  for (let index = 1; index <= 4; index += 1) {
    const email = `reception-demo-${index}@example.invalid`;
    const patientCode = `${DEMO_PATIENT_PREFIX}${String(index).padStart(2, '0')}`;
    const user = await prisma.user.upsert({
      where: { email },
      create: {
        email,
        fullName: `Bệnh nhân demo tiếp nhận ${index}`,
        status: 'ACTIVE',
        roleId: patientRole.id,
      },
      update: { status: 'ACTIVE', roleId: patientRole.id },
    });
    const patient = await prisma.patient.upsert({
      where: { userId: user.id },
      create: {
        userId: user.id,
        patientCode,
        fullName: `Bệnh nhân demo tiếp nhận ${index}`,
        phone: `09000000${String(index).padStart(2, '0')}`,
        gender: index % 2 ? 'MALE' : 'FEMALE',
        dateOfBirth: new Date(`${1980 + index}-01-01T00:00:00+07:00`),
      },
      update: { patientCode, fullName: `Bệnh nhân demo tiếp nhận ${index}` },
    });
    patients.push(patient);
  }
  const now = new Date();
  const today = clinicDate(clinicDateString(now));
  const futureSlots = await prisma.appointmentSlot.findMany({
    where: {
      startsAt: { gt: now },
      isBlocked: false,
      doctorSchedule: {
        status: 'PUBLISHED',
        scheduleType: DEMO_SCHEDULE_TYPE,
        doctor: { userId: { in: doctors.map(({ userId }) => userId) } },
      },
    },
    orderBy: { startsAt: 'asc' },
    include: { doctorSchedule: { include: { doctor: true } } },
  });
  const pastSlots = await prisma.appointmentSlot.findMany({
    where: {
      startsAt: { lt: now },
      doctorSchedule: {
        status: 'PUBLISHED',
        scheduleType: DEMO_SCHEDULE_TYPE,
        doctor: { userId: { in: doctors.map(({ userId }) => userId) } },
      },
    },
    orderBy: { startsAt: 'desc' },
    include: { doctorSchedule: { include: { doctor: true } } },
  });
  const todayFuture =
    futureSlots.find(
      (slot) => clinicDateString(slot.startsAt) === clinicDateString(today),
    ) ?? futureSlots[0];
  const todayPast = pastSlots.find(
    (slot) => clinicDateString(slot.startsAt) === clinicDateString(today),
  );
  const usedSlots = new Set<string>();
  const createAppointment = async (
    code: string,
    patientId: string,
    slotId: string,
    reason: string | null,
    status: 'CONFIRMED' | 'CANCELLED',
    sessionStatus: 'SCHEDULED' | 'CHECKED_IN' | 'CANCELLED',
    queueNumber: number | null,
  ) => {
    const existing = await prisma.appointment.findUnique({
      where: { appointmentCode: code },
      select: { id: true },
    });
    if (existing) return;
    if (usedSlots.has(slotId)) return;
    usedSlots.add(slotId);
    const slot = await prisma.appointmentSlot.findUniqueOrThrow({
      where: { id: slotId },
      include: { doctorSchedule: { include: { doctor: true } } },
    });
    await prisma.appointment.create({
      data: {
        appointmentCode: code,
        patientId,
        bookingSource: 'RECEPTIONIST',
        status,
        createdBy: adminId,
        reason,
        careSessions: {
          create: {
            appointmentSlotId: slot.id,
            specialtyId: slot.doctorSchedule.doctor.specialtyId,
            status: sessionStatus,
            checkedInAt: sessionStatus === 'CHECKED_IN' ? new Date() : null,
            checkedInBy: sessionStatus === 'CHECKED_IN' ? adminId : null,
            queueDate: sessionStatus === 'CHECKED_IN' ? today : null,
            queueNumber,
            queuePosition: queueNumber,
          },
        },
      },
    });
  };
  if (todayFuture)
    await createAppointment(
      `${DEMO_APPOINTMENT_PREFIX}001`,
      patients[0].id,
      todayFuture.id,
      'Khám demo chờ check-in',
      'CONFIRMED',
      'SCHEDULED',
      null,
    );
  if (todayPast)
    await createAppointment(
      `${DEMO_APPOINTMENT_PREFIX}002`,
      patients[1].id,
      todayPast.id,
      'Khám demo trễ hẹn',
      'CONFIRMED',
      'SCHEDULED',
      null,
    );
  const checkedInSlot = futureSlots.find((slot) => !usedSlots.has(slot.id));
  if (checkedInSlot)
    await createAppointment(
      `${DEMO_APPOINTMENT_PREFIX}003`,
      patients[2].id,
      checkedInSlot.id,
      null,
      'CONFIRMED',
      'CHECKED_IN',
      900,
    );
  const cancelledSlot = futureSlots.find((slot) => !usedSlots.has(slot.id));
  if (cancelledSlot)
    await createAppointment(
      `${DEMO_APPOINTMENT_PREFIX}004`,
      patients[3].id,
      cancelledSlot.id,
      'Lịch demo đã hủy',
      'CANCELLED',
      'CANCELLED',
      null,
    );
}

async function main() {
  const shouldCleanup = process.argv.includes('--cleanup');
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) throw new Error('DATABASE_URL is required');
  const config = {
    getOrThrow<T>(): T {
      return connectionString as T;
    },
  } as unknown as ConfigService;
  const prisma = new PrismaService(config);
  await prisma.$connect();
  const schedules = new SchedulesService(
    new SchedulesRepository(prisma),
    new AuditLogsService(prisma),
  );
  try {
    const admin = await prisma.user.findFirstOrThrow({
      where: { email: 'admin01@example.invalid' },
    });
    const doctors = await prisma.doctor.findMany({
      where: { doctorCode: { in: DEMO_DOCTOR_CODES } },
      select: { id: true, userId: true, doctorCode: true },
      orderBy: { doctorCode: 'asc' },
    });
    if (doctors.length !== DEMO_DOCTOR_CODES.length)
      throw new Error('Required demo doctors are missing.');
    if (shouldCleanup) {
      await cleanup(
        prisma,
        doctors.map(({ userId }) => userId),
        admin.id,
      );
      console.log('Reception demo data cleaned.');
      return;
    }
    const now = new Date();
    const today = clinicDate(clinicDateString(now));
    const endDate = addDays(today, 7);
    const includeToday = clinicMinutes(now) < MORNING_END_HOUR * 60;
    const actor = adminUser(admin.id, admin.fullName);
    for (const doctor of doctors) {
      for (let offset = includeToday ? 0 : 1; offset <= 7; offset += 1) {
        const date = addDays(today, offset);
        const anchor = addDays(
          new Date('2026-01-05T00:00:00Z'),
          dayOfWeek(date) - 1,
        );
        await createPublishedSchedule(
          schedules,
          prisma,
          doctor.userId,
          actor,
          date,
          date,
          date,
          withTime(anchor, MORNING_START_HOUR, MORNING_START_MINUTE),
          withTime(anchor, MORNING_END_HOUR, 0),
        );
      }
    }
    await seedAppointments(prisma, admin.id, DEMO_DOCTOR_CODES);
    console.log(
      includeToday
        ? `Reception demo data is ready from today through ${clinicDateString(endDate)}.`
        : `Morning shift today has ended; demo slots are ready from tomorrow through ${clinicDateString(endDate)}.`,
    );
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((error: unknown) => {
  console.error(error);
  process.exitCode = 1;
});