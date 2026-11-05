import 'dotenv/config';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '../src/generated/prisma/client';
import { RoleEnum } from '../src/modules/users/constants/roles.constant';
import { getCurrentTime } from '../src/common/utils/e2e-clock';

const DAYS_TO_SEED = 8;
const DAYS_BEFORE_E2E_NOW = 1;
const SLOT_DURATION_MINUTES = 30;
const START_MINUTES = 8 * 60;
const END_MINUTES = 18 * 60;
const CLINIC_TIME_ZONE = 'Asia/Ho_Chi_Minh';
const CLINIC_UTC_OFFSET_HOURS = 7;

type ClinicDate = {
  year: number;
  month: number;
  day: number;
};

function getLocalDatabaseUrl(): string {
  if (process.env.NODE_ENV === 'production') {
    throw new Error('Local test schedules cannot be seeded in production.');
  }

  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) throw new Error('DATABASE_URL is required.');

  const databaseUrl = new URL(connectionString);
  const localHosts = new Set(['localhost', '127.0.0.1', '[::1]', '::1']);
  if (!localHosts.has(databaseUrl.hostname)) {
    throw new Error(
      'Test schedules can only be seeded into a local PostgreSQL database.',
    );
  }

  return connectionString;
}

function getClinicDate(date: Date): ClinicDate {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: CLINIC_TIME_ZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(date);
  const getPart = (type: 'year' | 'month' | 'day') => {
    const value = parts.find((part) => part.type === type)?.value;
    if (!value) throw new Error(`Could not determine clinic date ${type}.`);
    return Number(value);
  };

  return {
    year: getPart('year'),
    month: getPart('month'),
    day: getPart('day'),
  };
}

function addDays(date: ClinicDate, days: number): ClinicDate {
  const result = new Date(Date.UTC(date.year, date.month - 1, date.day + days));
  return {
    year: result.getUTCFullYear(),
    month: result.getUTCMonth() + 1,
    day: result.getUTCDate(),
  };
}

function toClinicTime(date: ClinicDate, minutes: number): Date {
  const hour = Math.floor(minutes / 60);
  const minute = minutes % 60;
  return new Date(
    Date.UTC(
      date.year,
      date.month - 1,
      date.day,
      hour - CLINIC_UTC_OFFSET_HOURS,
      minute,
    ),
  );
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
    const doctors = await prisma.doctor.findMany({
      where: {
        isActive: true,
        specialty: { isActive: true },
        user: { status: 'ACTIVE', deletedAt: null },
      },
      select: {
        id: true,
        userId: true,
        specialty: { select: { name: true } },
      },
    });
    if (doctors.length === 0) {
      throw new Error(
        'No active doctors found. Seed local clinic data before schedules.',
      );
    }

    const admin = await prisma.user.findFirst({
      where: {
        status: 'ACTIVE',
        deletedAt: null,
        role: { name: RoleEnum.ADMIN },
      },
      select: { id: true },
    });
    const createdBy = admin?.id ?? doctors[0].userId;
    const firstDate = addDays(
      getClinicDate(getCurrentTime()),
      -DAYS_BEFORE_E2E_NOW,
    );
    const publishedAt = getCurrentTime();
    let createdSchedules = 0;
    let createdSlots = 0;
    let skippedSchedules = 0;

    await prisma.$transaction(
      async (transaction) => {
        for (let dayOffset = 0; dayOffset < DAYS_TO_SEED; dayOffset += 1) {
          const date = addDays(firstDate, dayOffset);
          const startsAt = toClinicTime(date, START_MINUTES);
          const endsAt = toClinicTime(date, END_MINUTES);

          for (const doctor of doctors) {
            const existing = await transaction.doctorSchedule.findFirst({
              where: { doctorId: doctor.id, startsAt, endsAt },
            });
            if (
              existing &&
              (existing.status !== 'PUBLISHED' ||
                existing.slotDurationMinutes !== SLOT_DURATION_MINUTES)
            ) {
              skippedSchedules += 1;
              continue;
            }

            const schedule =
              existing ??
              (await transaction.doctorSchedule.create({
                data: {
                  doctorId: doctor.id,
                  startsAt,
                  endsAt,
                  scheduleType: 'REGULAR',
                  status: 'PUBLISHED',
                  slotDurationMinutes: SLOT_DURATION_MINUTES,
                  createdBy,
                  publishedAt,
                },
              }));
            if (!existing) createdSchedules += 1;

            const slots: {
              doctorScheduleId: string;
              startsAt: Date;
              endsAt: Date;
            }[] = [];
            for (
              let slotMinutes = START_MINUTES;
              slotMinutes < END_MINUTES;
              slotMinutes += SLOT_DURATION_MINUTES
            ) {
              slots.push({
                doctorScheduleId: schedule.id,
                startsAt: toClinicTime(date, slotMinutes),
                endsAt: toClinicTime(date, slotMinutes + SLOT_DURATION_MINUTES),
              });
            }
            const result = await transaction.appointmentSlot.createMany({
              data: slots,
              skipDuplicates: true,
            });
            createdSlots += result.count;
          }
        }
      },
      { timeout: 60000 },
    );

    const lastDate = addDays(firstDate, DAYS_TO_SEED - 1);
    console.log(
      `Local schedules ready for ${doctors.length} active doctors from ${firstDate.year}-${String(firstDate.month).padStart(2, '0')}-${String(firstDate.day).padStart(2, '0')} to ${lastDate.year}-${String(lastDate.month).padStart(2, '0')}-${String(lastDate.day).padStart(2, '0')}.`,
    );
    console.log(
      `Created ${createdSchedules} published schedules and ${createdSlots} 30-minute slots; skipped ${skippedSchedules} conflicting schedules.`,
    );
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((error: unknown) => {
  console.error(
    error instanceof Error ? error.message : 'Local schedule seed failed.',
  );
  process.exitCode = 1;
});
