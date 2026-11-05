import 'dotenv/config';
import { hash } from 'bcrypt';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '../src/generated/prisma/client';
import { requireE2EClock } from '../src/common/utils/e2e-clock';

const FIXTURE_PREFIX = 'APPT-UC06-';
const PATIENT_CODES = [
  'PAT-LOCAL-TEST-001',
  'PAT-LOCAL-OTHER-001',
  'PAT-LOCAL-BUSY-001',
] as const;
const PATIENT_EMAILS = [
  process.env.E2E_PATIENT_EMAIL ?? 'patient-test@mediconnect.local',
  'patient-uc06-other@mediconnect.local',
  'patient-uc06-busy@mediconnect.local',
] as const;
const PATIENT_NAMES = [
  'Bệnh nhân kiểm thử MediConnect',
  'Bệnh nhân phụ UC06',
  'Bệnh nhân đặt kín slot UC06',
] as const;
const PATIENT_PASSWORD =
  process.env.E2E_PATIENT_PASSWORD ?? 'MediConnect123!';

function getLocalDatabaseUrl(): string {
  if (process.env.NODE_ENV === 'production')
    throw new Error(
      'UC06 appointment fixtures cannot be seeded in production.',
    );
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) throw new Error('DATABASE_URL is required.');
  const hostname = new URL(connectionString).hostname;
  if (!new Set(['localhost', '127.0.0.1', '::1', '[::1]']).has(hostname))
    throw new Error(
      'UC06 appointment fixtures require a local PostgreSQL database.',
    );
  return connectionString;
}

function clinicDateTime(date: string, hour: number, minute: number): Date {
  return new Date(
    `${date}T${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}:00+07:00`,
  );
}

async function disableLegacyFullDaySchedules(
  prisma: PrismaClient,
  doctorId: string,
): Promise<void> {
  for (const date of [
    '2026-11-09',
    '2026-11-10',
    '2026-11-12',
    '2026-11-13',
    '2026-11-14',
    '2026-11-15',
  ]) {
    const schedule = await prisma.doctorSchedule.findFirst({
      where: {
        doctorId,
        startsAt: clinicDateTime(date, 8, 0),
        endsAt: clinicDateTime(date, 18, 0),
      },
    });
    if (schedule && schedule.status !== 'ABSENT') {
      await prisma.doctorSchedule.update({
        where: { id: schedule.id },
        data: { status: 'ABSENT' },
      });
    }
  }
}

function getCaseId(): string | null {
  const argument = process.argv.find((value) => value.startsWith('--case='));
  const caseId = argument?.slice('--case='.length).trim().toUpperCase() || null;
  if (caseId && !/^UC06-(BOOK|CHANGE|CANCEL)-\d{3}$/.test(caseId))
    throw new Error(`Invalid UC06 testcase ID: ${caseId}`);
  return caseId;
}

async function ensureSlot(
  prisma: PrismaClient,
  doctorId: string,
  createdBy: string,
  now: Date,
  date: string,
  hour: number,
  minute: number,
) {
  const isMorningSlot = hour < 12;
  const scheduleStartsAt = clinicDateTime(date, isMorningSlot ? 8 : 13, 0);
  const scheduleEndsAt = clinicDateTime(date, isMorningSlot ? 12 : 18, 0);
  let schedule = await prisma.doctorSchedule.findFirst({
    where: { doctorId, startsAt: scheduleStartsAt, endsAt: scheduleEndsAt },
  });
  if (!schedule) {
    schedule = await prisma.doctorSchedule.create({
      data: {
        doctorId,
        startsAt: scheduleStartsAt,
        endsAt: scheduleEndsAt,
        scheduleType: 'REGULAR',
        status: 'PUBLISHED',
        slotDurationMinutes: 30,
        createdBy,
        publishedAt: now,
      },
    });
  } else if (schedule.status !== 'PUBLISHED') {
    schedule = await prisma.doctorSchedule.update({
      where: { id: schedule.id },
      data: { status: 'PUBLISHED', publishedAt: now },
    });
  }

  const startsAt = clinicDateTime(date, hour, minute);
  const endsAt = new Date(startsAt.getTime() + 30 * 60_000);
  const existingSlot = await prisma.appointmentSlot.findFirst({
    where: { doctorScheduleId: schedule.id, startsAt },
  });
  if (existingSlot) {
    if (existingSlot.isBlocked) {
      return prisma.appointmentSlot.update({
        where: { id: existingSlot.id },
        data: { isBlocked: false, blockReason: null },
      });
    }
    return existingSlot;
  }
  return prisma.appointmentSlot.create({
    data: { doctorScheduleId: schedule.id, startsAt, endsAt },
  });
}

async function cancelScheduleForDate(
  prisma: PrismaClient,
  doctorId: string,
  createdBy: string,
  now: Date,
  date: string,
): Promise<void> {
  for (const [startHour, endHour] of [
    [8, 12],
    [13, 18],
  ] as const) {
    const startsAt = clinicDateTime(date, startHour, 0);
    const endsAt = clinicDateTime(date, endHour, 0);
    const schedule = await prisma.doctorSchedule.findFirst({
      where: { doctorId, startsAt, endsAt },
    });
    if (schedule) {
      await prisma.doctorSchedule.update({
        where: { id: schedule.id },
        data: { status: 'ABSENT' },
      });
    } else {
      await prisma.doctorSchedule.create({
        data: {
          doctorId,
          startsAt,
          endsAt,
          scheduleType: 'REGULAR',
          status: 'ABSENT',
          slotDurationMinutes: 30,
          createdBy,
          publishedAt: now,
        },
      });
    }
  }
}

async function blockSlotsAfter(
  prisma: PrismaClient,
  doctorId: string,
  createdBy: string,
  now: Date,
  date: string,
  hour: number,
  minute: number,
): Promise<void> {
  const startsAt = clinicDateTime(date, 13, 0);
  const endsAt = clinicDateTime(date, 18, 0);
  let schedule = await prisma.doctorSchedule.findFirst({
    where: { doctorId, startsAt, endsAt },
  });
  if (!schedule) {
    schedule = await prisma.doctorSchedule.create({
      data: {
        doctorId,
        startsAt,
        endsAt,
        scheduleType: 'REGULAR',
        status: 'PUBLISHED',
        slotDurationMinutes: 30,
        createdBy,
        publishedAt: now,
      },
    });
  } else if (schedule.status !== 'PUBLISHED') {
    schedule = await prisma.doctorSchedule.update({
      where: { id: schedule.id },
      data: { status: 'PUBLISHED', publishedAt: now },
    });
  }

  const cutoff = clinicDateTime(date, hour, minute);
  for (
    let slotStart = new Date(cutoff.getTime() + 30 * 60_000);
    slotStart.getTime() + 30 * 60_000 <= endsAt.getTime();
    slotStart = new Date(slotStart.getTime() + 30 * 60_000)
  ) {
    const slot = await prisma.appointmentSlot.findFirst({
      where: { doctorScheduleId: schedule.id, startsAt: slotStart },
    });
    if (slot) {
      await prisma.appointmentSlot.update({
        where: { id: slot.id },
        data: {
          isBlocked: true,
          blockReason: 'UC06 latest-bookable-slot fixture',
        },
      });
    } else {
      await prisma.appointmentSlot.create({
        data: {
          doctorScheduleId: schedule.id,
          startsAt: slotStart,
          endsAt: new Date(slotStart.getTime() + 30 * 60_000),
          isBlocked: true,
          blockReason: 'UC06 latest-bookable-slot fixture',
        },
      });
    }
  }
}

async function createFixtureAppointment(
  prisma: PrismaClient,
  {
    appointmentCode,
    patientId,
    patientUserId,
    doctorId,
    specialtyId,
    createdBy,
    now,
    date,
    hour,
    minute,
    status = 'CONFIRMED',
    sessionStatus = 'SCHEDULED',
    rescheduleCount = 0,
  }: {
    appointmentCode: string;
    patientId: string;
    patientUserId: string;
    doctorId: string;
    specialtyId: string;
    createdBy: string;
    now: Date;
    date: string;
    hour: number;
    minute: number;
    status?: 'CONFIRMED' | 'CANCELLED';
    sessionStatus?:
      | 'SCHEDULED'
      | 'CHECKED_IN'
      | 'WAITING'
      | 'CALLED'
      | 'IN_CONSULTATION'
      | 'COMPLETED'
      | 'CANCELLED';
    rescheduleCount?: number;
  },
): Promise<void> {
  const slot = await ensureSlot(
    prisma,
    doctorId,
    createdBy,
    now,
    date,
    hour,
    minute,
  );
  await prisma.appointment.create({
    data: {
      appointmentCode,
      patientId,
      bookingSource: 'PATIENT',
      status,
      rescheduleCount,
      createdBy: patientUserId,
      ...(status === 'CANCELLED'
        ? {
            cancellationReason: 'UC06 cancelled-status fixture',
            cancelledBy: patientUserId,
            cancelledAt: now,
          }
        : {}),
      careSessions: {
        create: {
          appointmentSlotId: slot.id,
          specialtyId,
          status: sessionStatus,
          ...(sessionStatus === 'CHECKED_IN' ||
          sessionStatus === 'WAITING' ||
          sessionStatus === 'CALLED' ||
          sessionStatus === 'IN_CONSULTATION'
            ? {
                checkedInAt: now,
                checkedInBy: createdBy,
                queueDate: new Date(`${date}T00:00:00.000Z`),
                queueNumber: 1,
                queuePosition: 1,
                priorityType: 'APPOINTMENT_ON_TIME',
              }
            : {}),
          ...(sessionStatus === 'CALLED' ||
          sessionStatus === 'IN_CONSULTATION'
            ? { calledAt: now }
            : {}),
        },
      },
    },
  });
}

async function removeFixtureAppointments(
  prisma: PrismaClient,
  patientIds: string[],
): Promise<void> {
  const appointments = await prisma.appointment.findMany({
    where: {
      OR: [
        { appointmentCode: { startsWith: FIXTURE_PREFIX } },
        { patientId: { in: patientIds }, bookingSource: 'PATIENT' },
      ],
    },
    select: { id: true },
  });
  if (!appointments.length) return;
  const appointmentIds = appointments.map(({ id }) => id);
  const invoices = await prisma.invoice.findMany({
    where: { appointmentId: { in: appointmentIds } },
    select: { id: true },
  });
  await prisma.$transaction(async (transaction) => {
    if (invoices.length)
      await transaction.paymentTransaction.deleteMany({
        where: { invoiceId: { in: invoices.map(({ id }) => id) } },
      });
    await transaction.invoice.deleteMany({
      where: { id: { in: invoices.map(({ id }) => id) } },
    });
    await transaction.careSession.deleteMany({
      where: { appointmentId: { in: appointmentIds } },
    });
    await transaction.appointment.deleteMany({
      where: { id: { in: appointmentIds } },
    });
  });
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
    const now = requireE2EClock();
    const caseId = getCaseId();
    const passwordHash = await hash(PATIENT_PASSWORD, 12);
    const admin = await prisma.user.findFirst({
      where: { role: { name: 'ADMIN' }, status: 'ACTIVE', deletedAt: null },
      select: { id: true },
    });
    if (!admin)
      throw new Error(
        'Missing active admin. Run the existing RBAC/staff seed first.',
      );

    const generalSpecialty = await prisma.specialty.findFirst({
      where: { OR: [{ code: 'SPEC-GEN' }, { name: 'Nội tổng quát' }] },
    });
    if (!generalSpecialty)
      throw new Error('Missing SPEC-GEN. Run seed-clinic.ts first.');
    if (!generalSpecialty.isActive)
      await prisma.specialty.update({
        where: { id: generalSpecialty.id },
        data: { isActive: true },
      });

    const dermatologySpecialty = await prisma.specialty.findFirst({
      where: { OR: [{ code: 'SPEC-DER' }, { name: 'Da liễu' }] },
    });
    if (!dermatologySpecialty)
      throw new Error('Missing SPEC-DER. Run seed-clinic.ts first.');
    await prisma.specialty.update({
      where: { id: dermatologySpecialty.id },
      data: { isActive: caseId === 'UC06-BOOK-009' ? false : true },
    });

    const doctorRole = await prisma.role.findUnique({
      where: { name: 'DOCTOR' },
    });
    if (!doctorRole)
      throw new Error('Missing DOCTOR role. Run the existing RBAC seed first.');
    const activeDoctorUser = await prisma.user.upsert({
      where: { email: 'doctor-uc06@mediconnect.local' },
      create: {
        email: 'doctor-uc06@mediconnect.local',
        fullName: 'Bác sĩ kiểm thử UC06',
        passwordHash,
        passwordChangedAt: now,
        emailVerifiedAt: now,
        status: 'ACTIVE',
        roleId: doctorRole.id,
      },
      update: {
        fullName: 'Bác sĩ kiểm thử UC06',
        passwordHash,
        passwordChangedAt: now,
        emailVerifiedAt: now,
        status: 'ACTIVE',
        deletedAt: null,
        roleId: doctorRole.id,
      },
    });
    const activeDoctor = await prisma.doctor.upsert({
      where: { doctorCode: 'SEED-UC06-01' },
      create: {
        userId: activeDoctorUser.id,
        specialtyId: generalSpecialty.id,
        doctorCode: 'SEED-UC06-01',
        licenseNumber: 'UC06-DOCTOR-LICENSE',
        isActive: true,
      },
      update: {
        userId: activeDoctorUser.id,
        specialtyId: generalSpecialty.id,
        isActive: true,
      },
    });
    const inactiveDoctorUser = await prisma.user.upsert({
      where: { email: 'bs02.uc06@mediconnect.local' },
      create: {
        email: 'bs02.uc06@mediconnect.local',
        fullName: 'Trần Quốc Huy',
        passwordHash,
        passwordChangedAt: now,
        emailVerifiedAt: now,
        status: 'ACTIVE',
        roleId: doctorRole.id,
      },
      update: { fullName: 'Trần Quốc Huy', status: 'ACTIVE', deletedAt: null },
    });
    await prisma.doctor.upsert({
      where: { doctorCode: 'BS02' },
      create: {
        userId: inactiveDoctorUser.id,
        specialtyId: generalSpecialty.id,
        doctorCode: 'BS02',
        licenseNumber: 'UC06-BS02-LICENSE',
        isActive: false,
      },
      update: {
        userId: inactiveDoctorUser.id,
        specialtyId: generalSpecialty.id,
        isActive: false,
      },
    });

    const patientRole = await prisma.role.findUnique({
      where: { name: 'PATIENT' },
    });
    if (!patientRole)
      throw new Error('Missing PATIENT role. Run seed-patient.ts first.');
    const patients = [];
    for (const [index, patientCode] of PATIENT_CODES.entries()) {
      let patient = await prisma.patient.findUnique({
        where: { patientCode },
        include: { user: true },
      });
      let patientUser = patient?.user;
      if (!patient) {
        patientUser = await prisma.user.upsert({
          where: { email: PATIENT_EMAILS[index] },
          create: {
            email: PATIENT_EMAILS[index],
            fullName: PATIENT_NAMES[index],
            passwordHash,
            passwordChangedAt: now,
            emailVerifiedAt: now,
            status: 'ACTIVE',
            roleId: patientRole.id,
          },
          update: {
            fullName: PATIENT_NAMES[index],
            passwordHash,
            passwordChangedAt: now,
            emailVerifiedAt: now,
            status: 'ACTIVE',
            deletedAt: null,
            roleId: patientRole.id,
          },
        });
        patient = await prisma.patient.create({
          data: {
            userId: patientUser.id,
            patientCode,
            fullName: PATIENT_NAMES[index],
            email: PATIENT_EMAILS[index],
            gender: index === 0 ? 'FEMALE' : 'MALE',
          },
          include: { user: true },
        });
      }
      if (!patientUser)
        throw new Error(
          `Missing user for ${patientCode}. Run seed-patient.ts first.`,
        );
      await prisma.user.update({
        where: { id: patientUser.id },
        data: {
          email: PATIENT_EMAILS[index],
          passwordHash,
          passwordChangedAt: now,
          emailVerifiedAt: now,
          status: 'ACTIVE',
          deletedAt: null,
        },
      });
      await prisma.patient.update({
        where: { id: patient.id },
        data: { email: PATIENT_EMAILS[index] },
      });
      patients.push(patient);
    }

    await removeFixtureAppointments(
      prisma,
      patients.map(({ id }) => id),
    );
    await disableLegacyFullDaySchedules(prisma, activeDoctor.id);
    for (const [date, hour, minute] of [
      ['2026-11-12', 8, 0],
      ['2026-11-12', 9, 0],
      ['2026-11-12', 10, 0],
      ['2026-11-12', 16, 30],
      ['2026-11-13', 10, 0],
      ['2026-11-13', 11, 0],
      ['2026-11-10', 9, 59],
      ['2026-11-10', 10, 0],
      ['2026-11-10', 10, 1],
      ['2026-11-09', 9, 0],
    ] as const) {
      await ensureSlot(
        prisma,
        activeDoctor.id,
        admin.id,
        now,
        date,
        hour,
        minute,
      );
    }
    if (
      caseId === 'UC06-BOOK-018' ||
      caseId === 'UC06-CHANGE-024'
    ) {
      await ensureSlot(
        prisma,
        activeDoctor.id,
        admin.id,
        now,
        '2026-11-12',
        9,
        15,
      );
    }
    if (caseId === 'UC06-BOOK-004') {
      await ensureSlot(
        prisma,
        activeDoctor.id,
        admin.id,
        now,
        '2026-11-14',
        8,
        0,
      );
    } else if (caseId === 'UC06-BOOK-005') {
      await ensureSlot(
        prisma,
        activeDoctor.id,
        admin.id,
        now,
        '2026-11-15',
        16,
        30,
      );
    }
    if (caseId === 'UC06-BOOK-006' || caseId === 'UC06-CHANGE-014') {
      for (const date of ['2026-11-14']) {
        let fixtureIndex = 0;
        for (const [startMinute, endMinute] of [
          [8 * 60, 12 * 60],
          [13 * 60, 18 * 60],
        ]) {
          for (
            let minutes = startMinute;
            minutes < endMinute;
            minutes += 30
          ) {
            fixtureIndex += 1;
            const hour = Math.floor(minutes / 60);
            const minute = minutes % 60;
            const dateCode = date.slice(-2);
            await createFixtureAppointment(prisma, {
              appointmentCode: `${FIXTURE_PREFIX}B${dateCode}-${String(fixtureIndex).padStart(2, '0')}`,
              patientId: patients[2].id,
              patientUserId: patients[2].userId!,
              doctorId: activeDoctor.id,
              specialtyId: generalSpecialty.id,
              createdBy: admin.id,
              now,
              date,
              hour,
              minute,
            });
          }
        }
      }
    }
    await blockSlotsAfter(
      prisma,
      activeDoctor.id,
      admin.id,
      now,
      '2026-11-12',
      16,
      30,
    );
    if (caseId === 'UC06-BOOK-005') {
      await blockSlotsAfter(
        prisma,
        activeDoctor.id,
        admin.id,
        now,
        '2026-11-15',
        16,
        30,
      );
    }
    if (caseId !== 'UC06-BOOK-005') {
      await cancelScheduleForDate(
        prisma,
        activeDoctor.id,
        admin.id,
        now,
        '2026-11-15',
      );
    }

    const effectiveCaseId = caseId ?? 'UC06-CHANGE-001';
    const isOtherPatientCase = ['UC06-CHANGE-013', 'UC06-CANCEL-011'].includes(
      effectiveCaseId,
    );
    const hasPrimaryAppointment =
      effectiveCaseId === 'UC06-BOOK-018' ||
      (effectiveCaseId.startsWith('UC06-CHANGE-') &&
        effectiveCaseId !== 'UC06-CHANGE-012') ||
      (effectiveCaseId.startsWith('UC06-CANCEL-') &&
        effectiveCaseId !== 'UC06-CANCEL-010');

    if (hasPrimaryAppointment) {
      const fixture = {
        date: '2026-11-12',
        hour: 9,
        minute: 0,
        status: 'CONFIRMED' as const,
        sessionStatus: 'SCHEDULED' as const,
        rescheduleCount: 0,
      };
      if (['UC06-CHANGE-005', 'UC06-CANCEL-002'].includes(effectiveCaseId)) {
        Object.assign(fixture, { date: '2026-11-10', hour: 10, minute: 1 });
      } else if (
        ['UC06-CHANGE-006', 'UC06-CANCEL-003'].includes(effectiveCaseId)
      ) {
        Object.assign(fixture, { date: '2026-11-10', hour: 10, minute: 0 });
      } else if (
        ['UC06-CHANGE-007', 'UC06-CANCEL-004'].includes(effectiveCaseId)
      ) {
        Object.assign(fixture, {
          date: '2026-11-10',
          hour: 9,
          minute: 59,
        });
      } else if (
        ['UC06-CHANGE-008', 'UC06-CANCEL-005'].includes(effectiveCaseId)
      ) {
        Object.assign(fixture, { date: '2026-11-09', hour: 9, minute: 0 });
      } else if (
        ['UC06-CHANGE-009', 'UC06-CANCEL-007'].includes(effectiveCaseId)
      ) {
        Object.assign(fixture, {
          status: 'CANCELLED',
          sessionStatus: 'CANCELLED',
        });
      } else if (
        ['UC06-CHANGE-010', 'UC06-CANCEL-008'].includes(effectiveCaseId)
      ) {
        Object.assign(fixture, { sessionStatus: 'CHECKED_IN' });
      } else if (
        ['UC06-CHANGE-011', 'UC06-CANCEL-009'].includes(effectiveCaseId)
      ) {
        Object.assign(fixture, { sessionStatus: 'COMPLETED' });
      } else if (effectiveCaseId === 'UC06-CHANGE-003') {
        Object.assign(fixture, { rescheduleCount: 1 });
      } else if (effectiveCaseId === 'UC06-CHANGE-004') {
        Object.assign(fixture, { rescheduleCount: 2 });
      } else if (
        ['UC06-CHANGE-021', 'UC06-CANCEL-014'].includes(effectiveCaseId)
      ) {
        Object.assign(fixture, { sessionStatus: 'WAITING' });
      } else if (
        ['UC06-CHANGE-022', 'UC06-CANCEL-015'].includes(effectiveCaseId)
      ) {
        Object.assign(fixture, { sessionStatus: 'CALLED' });
      } else if (
        ['UC06-CHANGE-023', 'UC06-CANCEL-016'].includes(effectiveCaseId)
      ) {
        Object.assign(fixture, { sessionStatus: 'IN_CONSULTATION' });
      } else if (effectiveCaseId === 'UC06-CHANGE-024') {
        Object.assign(fixture, { hour: 10, minute: 0 });
      }

      await createFixtureAppointment(prisma, {
        appointmentCode: 'APPT-UC06-01',
        patientId: patients[0].id,
        patientUserId: patients[0].userId!,
        doctorId: activeDoctor.id,
        specialtyId: generalSpecialty.id,
        createdBy: admin.id,
        now,
        ...fixture,
      });
    }

    if (effectiveCaseId === 'UC06-CHANGE-024') {
      await createFixtureAppointment(prisma, {
        appointmentCode: 'APPT-UC06-02',
        patientId: patients[0].id,
        patientUserId: patients[0].userId!,
        doctorId: activeDoctor.id,
        specialtyId: generalSpecialty.id,
        createdBy: admin.id,
        now,
        date: '2026-11-12',
        hour: 9,
        minute: 0,
      });
    }

    if (isOtherPatientCase) {
      await createFixtureAppointment(prisma, {
        appointmentCode: 'APPT-UC06-02',
        patientId: patients[1].id,
        patientUserId: patients[1].userId!,
        doctorId: activeDoctor.id,
        specialtyId: generalSpecialty.id,
        createdBy: admin.id,
        now,
        date: '2026-11-13',
        hour: 11,
        minute: 0,
      });
    }

    const patientUsers = await prisma.patient.findMany({
      where: { patientCode: { in: [...PATIENT_CODES] } },
      include: { user: true },
    });
    console.log(
      `E2E_DOCTOR_ID=${activeDoctor.id}`,
    );
    console.log(
      `UC06 appointment fixture ready${caseId ? ` for ${caseId}` : ''}. Patients: ${patientUsers.map(({ user }) => user!.email).join(', ')}; password: ${PATIENT_PASSWORD}; source: existing clinic/patient seeds; E2E_NOW: ${now.toISOString()}`,
    );
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((error: unknown) => {
  console.error(error);
  process.exitCode = 1;
});
