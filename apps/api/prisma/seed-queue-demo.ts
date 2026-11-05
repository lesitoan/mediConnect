import 'dotenv/config';
import { PrismaPg } from '@prisma/adapter-pg';
import { hash } from 'bcrypt';
import { PrismaClient } from '../src/generated/prisma/client';
import { CareSessionStatus } from '../src/generated/prisma/enums';
import { clinicDate } from '../src/common/utils/clinic-date';
import { requireE2EClock } from '../src/common/utils/e2e-clock';

const DEMO_PATIENT_PREFIX = 'Q-DEMO-P-';
const DEMO_APPOINTMENT_PREFIX = 'Q-DEMO-A-';
const DEMO_USER_EMAIL_PREFIX = 'q-demo-p-';
const E2E_DOCTOR_CODE = 'STAFF-DEMO-01';
const GENERAL_DOCTOR_CODE_CANDIDATES = ['BS01', 'SEED-GEN-01'] as const;
const REQUIRED_DEMO_DOCTOR_CODES = [
  'SEED-GEN-02',
  'SEED-SUR-01',
  E2E_DOCTOR_CODE,
] as const;
const DEMO_DOCTOR_CODES = [
  ...GENERAL_DOCTOR_CODE_CANDIDATES,
  ...REQUIRED_DEMO_DOCTOR_CODES,
] as const;
const BOARD_STATUSES = [
  CareSessionStatus.CHECKED_IN,
  CareSessionStatus.WAITING,
  CareSessionStatus.CALLED,
  CareSessionStatus.SKIPPED,
  CareSessionStatus.NO_SHOW,
  CareSessionStatus.IN_CONSULTATION,
] as const;
const DEMO_QUEUE = [
  {
    appointmentNumber: 1,
    patientNumber: 1,
    doctorCode: 'SEED-GEN-01',
    status: 'WAITING',
    priorityType: 'APPOINTMENT_ON_TIME',
  },
  {
    appointmentNumber: 2,
    patientNumber: 2,
    doctorCode: 'SEED-GEN-01',
    status: 'WAITING',
    priorityType: 'WALK_IN',
  },
  {
    appointmentNumber: 3,
    patientNumber: 3,
    doctorCode: 'SEED-GEN-01',
    status: 'WAITING',
    priorityType: 'RETURNING_LAB',
  },
  {
    appointmentNumber: 4,
    patientNumber: 4,
    doctorCode: 'SEED-GEN-01',
    status: 'WAITING',
    priorityType: 'APPOINTMENT_LATE',
  },
  {
    appointmentNumber: 5,
    patientNumber: 10,
    doctorCode: 'SEED-GEN-01',
    status: 'COMPLETED',
    priorityType: 'APPOINTMENT_ON_TIME',
  },
  {
    appointmentNumber: 6,
    patientNumber: 6,
    doctorCode: 'SEED-GEN-01',
    status: 'SCHEDULED',
    appointmentStatus: 'PENDING_RESOLUTION',
    priorityType: 'APPOINTMENT_ON_TIME',
  },
  {
    appointmentNumber: 7,
    patientNumber: 7,
    doctorCode: 'SEED-SUR-01',
    status: 'WAITING',
    priorityType: 'APPOINTMENT_ON_TIME',
  },
  {
    appointmentNumber: 8,
    patientNumber: 8,
    doctorCode: 'SEED-GEN-01',
    status: 'NO_SHOW',
    priorityType: 'APPOINTMENT_ON_TIME',
  },
  {
    appointmentNumber: 9,
    patientNumber: 9,
    doctorCode: 'SEED-GEN-01',
    status: 'WAITING_LAB',
    priorityType: 'APPOINTMENT_ON_TIME',
    isPastAppointment: true,
  },
  {
    appointmentNumber: 10,
    patientNumber: 11,
    doctorCode: 'SEED-GEN-01',
    status: 'CALLED',
    priorityType: 'WALK_IN',
    calledAgoSeconds: 179,
  },
  {
    appointmentNumber: 11,
    patientNumber: 5,
    doctorCode: 'SEED-GEN-01',
    status: 'SKIPPED',
    priorityType: 'REFERRAL',
  },
  {
    appointmentNumber: 12,
    patientNumber: 12,
    doctorCode: 'SEED-GEN-01',
    status: 'IN_CONSULTATION',
    priorityType: 'APPOINTMENT_ON_TIME',
  },
  {
    appointmentNumber: 13,
    patientNumber: 13,
    doctorCode: 'SEED-GEN-01',
    status: 'PAUSED',
    priorityType: 'APPOINTMENT_ON_TIME',
  },
  {
    appointmentNumber: 14,
    patientNumber: 14,
    doctorCode: 'SEED-GEN-02',
    status: 'WAITING',
    priorityType: 'APPOINTMENT_ON_TIME',
  },
  {
    appointmentNumber: 15,
    patientNumber: 15,
    doctorCode: 'SEED-GEN-01',
    status: 'CANCELLED',
    appointmentStatus: 'CANCELLED',
    priorityType: 'APPOINTMENT_ON_TIME',
  },
  {
    appointmentNumber: 16,
    patientNumber: 16,
    doctorCode: 'SEED-GEN-01',
    status: 'IN_CONSULTATION',
    priorityType: 'APPOINTMENT_ON_TIME',
    hasSavedPrescription: true,
  },
] as const;
const DEMO_PATIENT_MEDICAL_RECORDS = [
  {
    id: 'a1100000-0000-4000-8000-000000000001',
    patientNumber: 12,
    recordType: 'ALLERGY',
    name: 'Penicillin',
    description: 'Q-DEMO allergy record for examination testing.',
    reaction: 'Hives',
    severity: 'MODERATE',
  },
  {
    id: 'a1100000-0000-4000-8000-000000000002',
    patientNumber: 12,
    recordType: 'MEDICAL_HISTORY',
    name: 'Essential hypertension',
    description: 'Q-DEMO medical history awaiting doctor confirmation.',
    reaction: null,
    severity: null,
  },
  {
    id: 'a1100000-0000-4000-8000-000000000003',
    patientNumber: 14,
    recordType: 'ALLERGY',
    name: 'Latex',
    description: 'Q-DEMO allergy record for patient-isolation testing.',
    reaction: 'Contact dermatitis',
    severity: 'MILD',
  },
  {
    id: 'a1100000-0000-4000-8000-000000000004',
    patientNumber: 14,
    recordType: 'MEDICAL_HISTORY',
    name: 'Asthma',
    description: 'Q-DEMO medical history for patient-isolation testing.',
    reaction: null,
    severity: null,
  },
] as const;

function assertLocalDatabase(connectionString: string): void {
  const hostname = new URL(connectionString).hostname;
  if (
    process.env.NODE_ENV === 'production' ||
    !['localhost', '127.0.0.1', '::1', '[::1]'].includes(hostname)
  )
    throw new Error('Queue demo seed chỉ được chạy trên PostgreSQL local.');
}

async function cleanup(prisma: PrismaClient): Promise<void> {
  const appointments = await prisma.appointment.findMany({
    where: { appointmentCode: { startsWith: DEMO_APPOINTMENT_PREFIX } },
    select: {
      id: true,
      patientId: true,
      careSessions: {
        select: {
          id: true,
          appointmentSlotId: true,
          appointmentSlot: { select: { startsAt: true, endsAt: true } },
        },
      },
    },
  });
  const appointmentIds = appointments.map(({ id }) => id);
  const demoPatients = await prisma.patient.findMany({
    where: { patientCode: { startsWith: DEMO_PATIENT_PREFIX } },
    select: { id: true, userId: true },
  });
  const patientIds = [
    ...new Set([
      ...appointments.map(({ patientId }) => patientId),
      ...demoPatients.map(({ id }) => id),
    ]),
  ];
  const patientUserIds = demoPatients.flatMap(({ userId }) =>
    userId ? [userId] : [],
  );
  const nonDemoAppointments = await prisma.appointment.findMany({
    where: {
      patientId: { in: demoPatients.map(({ id }) => id) },
      NOT: { appointmentCode: { startsWith: DEMO_APPOINTMENT_PREFIX } },
    },
    select: { appointmentCode: true },
  });
  if (nonDemoAppointments.length) {
    throw new Error(
      `Q-DEMO patients have non-demo appointments (${nonDemoAppointments.map(({ appointmentCode }) => appointmentCode).join(', ')}); cleanup stopped to preserve external visits.`,
    );
  }
  const sessionIds = appointments.flatMap(({ careSessions }) =>
    careSessions.map(({ id }) => id),
  );
  const legacySlotIds = appointments.flatMap(({ careSessions }) =>
    careSessions
      .filter(
        ({ appointmentSlot }) =>
          appointmentSlot.endsAt.getTime() -
            appointmentSlot.startsAt.getTime() !==
          30 * 60_000,
      )
      .map(({ appointmentSlotId }) => appointmentSlotId),
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
    if (patientIds.length)
      await tx.patientMedicalRecord.deleteMany({
        where: { patientId: { in: patientIds } },
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
    if (legacySlotIds.length)
      await tx.appointmentSlot.deleteMany({
        where: { id: { in: legacySlotIds } },
      });
    if (patientIds.length)
      await tx.patient.deleteMany({ where: { id: { in: patientIds } } });
    if (patientUserIds.length)
      await tx.user.deleteMany({ where: { id: { in: patientUserIds } } });
  });
}

type QueueFixtureScenario =
  | 'FULL'
  | 'WAITING'
  | 'IN_CONSULTATION'
  | 'CALL_NEXT'
  | 'EMPTY'
  | 'START'
  | 'SKIP_READY'
  | 'SKIP_WAIT'
  | 'RESTORE'
  | 'IN_CONSULTATION_INCOMPLETE'
  | 'COMPLETED'
  | 'NO_SHOW'
  | 'PAUSED'
  | 'CANCELLED'
  | 'WAITING_LAB'
  | 'WAITING_LAB_RESULT'
  | 'IN_CONSULTATION_WITH_PRESCRIPTION'
  | 'WRONG_OWNER'
  | 'PAUSED_WRONG_OWNER'
  | 'LAB_AND_ACTIVE_CONSULTATION'
  | 'MULTI_PATIENT_CONSULTATION';

function getQueueScenario(): QueueFixtureScenario {
  const option = process.argv.find((argument) =>
    argument.startsWith('--scenario='),
  );
  const scenario = option?.split('=', 2)[1] ?? 'FULL';
  if (
    scenario !== 'FULL' &&
    scenario !== 'WAITING' &&
    scenario !== 'IN_CONSULTATION' &&
    scenario !== 'CALL_NEXT' &&
    scenario !== 'EMPTY' &&
    scenario !== 'START' &&
    scenario !== 'SKIP_READY' &&
    scenario !== 'SKIP_WAIT' &&
    scenario !== 'RESTORE' &&
    scenario !== 'IN_CONSULTATION_INCOMPLETE' &&
    scenario !== 'COMPLETED' &&
    scenario !== 'NO_SHOW' &&
    scenario !== 'PAUSED' &&
    scenario !== 'CANCELLED' &&
    scenario !== 'WAITING_LAB' &&
    scenario !== 'WAITING_LAB_RESULT' &&
    scenario !== 'IN_CONSULTATION_WITH_PRESCRIPTION' &&
    scenario !== 'WRONG_OWNER' &&
    scenario !== 'PAUSED_WRONG_OWNER' &&
    scenario !== 'LAB_AND_ACTIVE_CONSULTATION' &&
    scenario !== 'MULTI_PATIENT_CONSULTATION'
  ) {
    throw new Error(`Unsupported queue fixture scenario "${scenario}".`);
  }
  return scenario;
}

async function seed(
  prisma: PrismaClient,
  scenario: QueueFixtureScenario,
): Promise<void> {
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
  const now = requireE2EClock();
  const queueDate = clinicDate();
  const previousDate = new Date(queueDate.getTime() - 24 * 60 * 60_000);
  const queueDateEnd = new Date(queueDate.getTime() + 24 * 60 * 60_000);
  const doctors = await prisma.doctor.findMany({
    where: {
      doctorCode: { in: [...DEMO_DOCTOR_CODES] },
      user: { status: 'ACTIVE' },
      schedules: {
        some: {
          status: 'PUBLISHED',
          startsAt: { gte: queueDate, lt: queueDateEnd },
          slotDurationMinutes: 30,
        },
      },
    },
    orderBy: { doctorCode: 'asc' },
    select: {
      id: true,
      doctorCode: true,
      specialtyId: true,
      schedules: {
        where: {
          status: 'PUBLISHED',
          startsAt: { gte: queueDate, lt: queueDateEnd },
          slotDurationMinutes: 30,
        },
        orderBy: { startsAt: 'asc' },
        select: {
          id: true,
          startsAt: true,
          endsAt: true,
          slotDurationMinutes: true,
        },
      },
    },
  });
  const primaryGeneralDoctor =
    doctors.find((doctor) => doctor.doctorCode === 'BS01') ??
    doctors.find((doctor) => doctor.doctorCode === 'SEED-GEN-01');
  const missingDoctorCodes = REQUIRED_DEMO_DOCTOR_CODES.filter(
    (code) => !doctors.some((doctor) => doctor.doctorCode === code),
  );
  if (
    !primaryGeneralDoctor ||
    primaryGeneralDoctor.schedules.length === 0 ||
    missingDoctorCodes.some(
      (code) =>
        !doctors.some(
          (doctor) => doctor.doctorCode === code && doctor.schedules.length > 0,
        ),
    )
  )
    throw new Error(
      `Missing published 30-minute schedules for ${[
        ...missingDoctorCodes,
        ...(!primaryGeneralDoctor || primaryGeneralDoctor.schedules.length === 0
          ? ['SEED-GEN-01 (or legacy BS01)']
          : []),
      ].join(
        ', ',
      )} on ${clinicDate().toISOString().slice(0, 10)}. Set E2E_NOW and run "npm run prisma:seed:local-schedules" before the queue seed.`,
    );
  const patientRole = await prisma.role.findUnique({
    where: { name: 'PATIENT' },
  });
  if (!patientRole) throw new Error('Không tìm thấy role bệnh nhân.');
  const patientPasswordHash = await hash('123456', 12);
  const queueNumbers = new Map<string, number>();
  const doctorsByCode = new Map(
    doctors.map((doctor) => [doctor.doctorCode, doctor]),
  );
  doctorsByCode.set('SEED-GEN-01', primaryGeneralDoctor);
  const scheduleById = new Map<
    string,
    {
      doctor: (typeof doctors)[number];
      schedule: (typeof doctors)[number]['schedules'][number];
    }
  >();
  for (const doctor of doctors) {
    for (const schedule of doctor.schedules) {
      scheduleById.set(schedule.id, { doctor, schedule });
    }
  }
  const availableSlots = await prisma.appointmentSlot.findMany({
    where: {
      doctorScheduleId: { in: [...scheduleById.keys()] },
      startsAt: { gte: now, lt: queueDateEnd },
      isBlocked: false,
      careSessions: { none: {} },
    },
    orderBy: { startsAt: 'asc' },
    select: {
      id: true,
      doctorScheduleId: true,
      startsAt: true,
      endsAt: true,
    },
  });
  const slotsByDoctorCode = new Map<string, typeof availableSlots>();
  for (const slot of availableSlots) {
    const schedule = scheduleById.get(slot.doctorScheduleId)?.schedule;
    const doctorCode = scheduleById.get(slot.doctorScheduleId)?.doctor
      .doctorCode;
    if (
      doctorCode === 'SEED-GEN-01' &&
      primaryGeneralDoctor.doctorCode !== 'SEED-GEN-01'
    ) {
      continue;
    }
    const mappedDoctorCode =
      doctorCode === primaryGeneralDoctor.doctorCode
        ? 'SEED-GEN-01'
        : doctorCode;
    if (
      !schedule ||
      !mappedDoctorCode ||
      slot.endsAt.getTime() - slot.startsAt.getTime() !==
        schedule.slotDurationMinutes * 60_000
    ) {
      continue;
    }
    const doctorSlots = slotsByDoctorCode.get(mappedDoctorCode) ?? [];
    doctorSlots.push(slot);
    slotsByDoctorCode.set(mappedDoctorCode, doctorSlots);
  }
  if (scenario !== 'FULL') {
    const doctor = doctorsByCode.get(E2E_DOCTOR_CODE);
    if (!doctor)
      throw new Error(
        `Required doctor ${E2E_DOCTOR_CODE} is missing from the queue fixture.`,
      );
    const existingQueueCount = await prisma.careSession.count({
      where: {
        queueDate,
        status: { in: [...BOARD_STATUSES] },
        appointmentSlot: { doctorSchedule: { doctorId: doctor.id } },
      },
    });
    if (existingQueueCount > 0) {
      throw new Error(
        `The isolated queue fixture for ${E2E_DOCTOR_CODE} requires an empty queue, but found ${existingQueueCount} existing visit(s). Use a clean local test database.`,
      );
    }
  }
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
  const queueFixtures =
    scenario === 'FULL'
      ? DEMO_QUEUE
      : scenario === 'IN_CONSULTATION'
        ? [{ ...DEMO_QUEUE[11], doctorCode: E2E_DOCTOR_CODE }]
        : scenario === 'COMPLETED'
          ? [{ ...DEMO_QUEUE[4], doctorCode: E2E_DOCTOR_CODE }]
          : scenario === 'NO_SHOW'
            ? [{ ...DEMO_QUEUE[7], doctorCode: E2E_DOCTOR_CODE }]
            : scenario === 'PAUSED'
              ? [{ ...DEMO_QUEUE[12], doctorCode: E2E_DOCTOR_CODE }]
              : scenario === 'CANCELLED'
                ? [{ ...DEMO_QUEUE[14], doctorCode: E2E_DOCTOR_CODE }]
                : scenario === 'WAITING_LAB' ||
                    scenario === 'WAITING_LAB_RESULT'
                  ? [
                      {
                        ...DEMO_QUEUE[8],
                        doctorCode: E2E_DOCTOR_CODE,
                        isPastAppointment: false,
                        hasLabResult: scenario === 'WAITING_LAB_RESULT',
                      },
                    ]
                  : scenario === 'IN_CONSULTATION_WITH_PRESCRIPTION'
                    ? [{ ...DEMO_QUEUE[15], doctorCode: E2E_DOCTOR_CODE }]
                    : scenario === 'WRONG_OWNER'
                      ? [{ ...DEMO_QUEUE[13], status: 'IN_CONSULTATION' }]
                      : scenario === 'PAUSED_WRONG_OWNER'
                        ? [{ ...DEMO_QUEUE[13], status: 'PAUSED' }]
                        : scenario === 'LAB_AND_ACTIVE_CONSULTATION'
                          ? [
                              {
                                ...DEMO_QUEUE[8],
                                doctorCode: E2E_DOCTOR_CODE,
                                isPastAppointment: false,
                              },
                              {
                                ...DEMO_QUEUE[11],
                                doctorCode: E2E_DOCTOR_CODE,
                              },
                            ]
                          : scenario === 'MULTI_PATIENT_CONSULTATION'
                            ? [
                                {
                                  ...DEMO_QUEUE[11],
                                  doctorCode: E2E_DOCTOR_CODE,
                                },
                                {
                                  ...DEMO_QUEUE[15],
                                  doctorCode: E2E_DOCTOR_CODE,
                                },
                              ]
                            : scenario === 'IN_CONSULTATION_INCOMPLETE'
                              ? [
                                  {
                                    ...DEMO_QUEUE[11],
                                    doctorCode: E2E_DOCTOR_CODE,
                                    isIncompleteConsultation: true,
                                  },
                                ]
                              : scenario === 'EMPTY'
                                ? []
                                : scenario === 'START' ||
                                    scenario === 'SKIP_WAIT'
                                  ? [
                                      {
                                        ...DEMO_QUEUE[9],
                                        doctorCode: E2E_DOCTOR_CODE,
                                        calledAgoSeconds:
                                          scenario === 'START' ? 30 : 60,
                                      },
                                    ]
                                  : scenario === 'SKIP_READY'
                                    ? [
                                        {
                                          ...DEMO_QUEUE[9],
                                          doctorCode: E2E_DOCTOR_CODE,
                                          calledAgoSeconds: 181,
                                        },
                                        {
                                          ...DEMO_QUEUE[0],
                                          appointmentNumber: 15,
                                          patientNumber: 15,
                                          doctorCode: E2E_DOCTOR_CODE,
                                        },
                                      ]
                                    : scenario === 'RESTORE'
                                      ? [
                                          {
                                            ...DEMO_QUEUE[10],
                                            doctorCode: E2E_DOCTOR_CODE,
                                          },
                                        ]
                                      : [
                                          {
                                            ...DEMO_QUEUE[0],
                                            doctorCode: E2E_DOCTOR_CODE,
                                          },
                                        ];
  const hasPastAppointment = queueFixtures.some(
    (item) => 'isPastAppointment' in item && item.isPastAppointment,
  );
  let pastAppointmentSlot: (typeof availableSlots)[number] | null = null;
  if (hasPastAppointment) {
    const pastDoctor = doctorsByCode.get('SEED-GEN-01');
    if (!pastDoctor)
      throw new Error(
        'Không tìm thấy bác sĩ nội tổng quát cho fixture quá giờ.',
      );
    const pastSchedule = await prisma.doctorSchedule.findFirst({
      where: {
        doctorId: pastDoctor.id,
        status: 'PUBLISHED',
        startsAt: { gte: previousDate, lt: queueDate },
        slotDurationMinutes: 30,
      },
      orderBy: { startsAt: 'asc' },
      select: { id: true, slotDurationMinutes: true },
    });
    if (!pastSchedule) {
      throw new Error(
        `Missing published 30-minute schedule for ${pastDoctor.doctorCode} on ${previousDate.toISOString().slice(0, 10)}. Rerun "npm run prisma:seed:local-schedules".`,
      );
    }
    pastAppointmentSlot =
      (await prisma.appointmentSlot.findFirst({
        where: {
          doctorScheduleId: pastSchedule.id,
          startsAt: { gte: previousDate, lt: queueDate },
          isBlocked: false,
          careSessions: { none: {} },
        },
        orderBy: { startsAt: 'asc' },
        select: {
          id: true,
          doctorScheduleId: true,
          startsAt: true,
          endsAt: true,
        },
      })) ?? null;
    if (
      !pastAppointmentSlot ||
      pastAppointmentSlot.endsAt.getTime() -
        pastAppointmentSlot.startsAt.getTime() !==
        pastSchedule.slotDurationMinutes * 60_000
    ) {
      throw new Error(
        `No available 30-minute appointment slot for ${pastDoctor.doctorCode} on ${previousDate.toISOString().slice(0, 10)}.`,
      );
    }
  }
  for (const [index, item] of queueFixtures.entries()) {
    const doctor = doctorsByCode.get(item.doctorCode);
    const isPastAppointment =
      'isPastAppointment' in item && item.isPastAppointment;
    const slot = isPastAppointment
      ? pastAppointmentSlot
      : slotsByDoctorCode.get(item.doctorCode)?.shift();
    if (!doctor)
      throw new Error(
        `Không tìm thấy bác sĩ ${item.doctorCode} để tạo lượt demo.`,
      );
    if (!slot) {
      throw new Error(
        `Không còn slot lịch 30 phút đã xuất bản cho ${item.doctorCode} trong ngày ${queueDate.toISOString().slice(0, 10)}. Chạy seed local-schedules và kiểm tra các lịch hẹn chiếm slot.`,
      );
    }
    const queueNumber = queueNumbers.get(doctor.specialtyId);
    if (queueNumber === undefined)
      throw new Error('Không thể cấp STT demo theo chuyên khoa.');
    const patientCode = `${DEMO_PATIENT_PREFIX}${String(item.patientNumber).padStart(2, '0')}`;
    const email = `${DEMO_USER_EMAIL_PREFIX}${String(item.patientNumber).padStart(2, '0')}@example.invalid`;
    const fullName =
      item.patientNumber === 9 || item.patientNumber === 10
        ? 'Nguyễn Văn An'
        : `Bệnh nhân demo hàng chờ ${item.patientNumber}`;
    const user = await prisma.user.upsert({
      where: { email },
      create: {
        email,
        fullName,
        status: 'ACTIVE',
        roleId: patientRole.id,
        passwordHash: patientPasswordHash,
        passwordChangedAt: now,
        emailVerifiedAt: now,
      },
      update: { fullName, status: 'ACTIVE', roleId: patientRole.id },
      select: { id: true },
    });
    await prisma.user.updateMany({
      where: {
        id: user.id,
        passwordHash: null,
        passwordChangedAt: null,
        status: 'ACTIVE',
        deletedAt: null,
        authIdentities: { none: {} },
        authSessions: { none: {} },
      },
      data: {
        passwordHash: patientPasswordHash,
        passwordChangedAt: now,
        emailVerifiedAt: now,
      },
    });
    const patient = await prisma.patient.upsert({
      where: { userId: user.id },
      create: {
        userId: user.id,
        patientCode,
        fullName,
        phone: `09000000${String(item.patientNumber).padStart(2, '0')}`,
        dateOfBirth: new Date(
          item.patientNumber === 10
            ? '1992-01-01T00:00:00.000Z'
            : '1990-01-01T00:00:00.000Z',
        ),
        gender: item.patientNumber % 2 === 0 ? 'FEMALE' : 'MALE',
      },
      update: {
        patientCode,
        fullName,
        phone: `09000000${String(item.patientNumber).padStart(2, '0')}`,
        dateOfBirth: new Date(
          item.patientNumber === 10
            ? '1992-01-01T00:00:00.000Z'
            : '1990-01-01T00:00:00.000Z',
        ),
        gender: item.patientNumber % 2 === 0 ? 'FEMALE' : 'MALE',
      },
      select: { id: true },
    });
    const patientMedicalRecords = DEMO_PATIENT_MEDICAL_RECORDS.flatMap(
      ({ patientNumber, ...record }) =>
        patientNumber === item.patientNumber ? [record] : [],
    );
    for (const record of patientMedicalRecords) {
      await prisma.patientMedicalRecord.upsert({
        where: { id: record.id },
        create: {
          ...record,
          patientId: patient.id,
          createdBy: admin.id,
          status: 'PENDING_CONFIRMATION',
        },
        update: {
          ...record,
          patientId: patient.id,
          createdBy: admin.id,
          confirmedBy: null,
          confirmedInConsultationId: null,
          confirmedAt: null,
          status: 'PENDING_CONFIRMATION',
        },
      });
    }
    const appointment = await prisma.appointment.create({
      data: {
        appointmentCode: `${DEMO_APPOINTMENT_PREFIX}${String(item.appointmentNumber).padStart(3, '0')}`,
        patientId: patient.id,
        bookingSource: 'RECEPTIONIST',
        status:
          'appointmentStatus' in item ? item.appointmentStatus : 'CONFIRMED',
        createdBy: admin.id,
        reason: `Q-DEMO complaint ${String(index + 1).padStart(2, '0')}`,
        ...(item.status === 'CANCELLED'
          ? {
              cancellationReason: 'Q-DEMO cancelled appointment fixture',
              cancelledBy: admin.id,
              cancelledAt: now,
            }
          : {}),
      },
      select: { id: true },
    });
    const isScheduled =
      item.status === 'SCHEDULED' || item.status === 'CANCELLED';
    const sessionQueueDate = isPastAppointment
      ? new Date(queueDate.getTime() - 24 * 60 * 60_000)
      : queueDate;
    const careSession = await prisma.careSession.create({
      data: {
        appointmentId: appointment.id,
        appointmentSlotId: slot.id,
        specialtyId: doctor.specialtyId,
        status: item.status as CareSessionStatus,
        checkedInAt: isScheduled ? null : now,
        checkedInBy: isScheduled ? null : admin.id,
        queueDate: isScheduled ? null : sessionQueueDate,
        queueNumber: isScheduled ? null : queueNumber,
        queuePosition: isScheduled ? null : queueNumber,
        priorityType: item.priorityType,
        skipCount: item.status === 'SKIPPED' ? 1 : 0,
        calledAt:
          'calledAgoSeconds' in item
            ? new Date(now.getTime() - item.calledAgoSeconds * 1000)
            : null,
        skippedAt:
          item.status === 'SKIPPED' ? new Date(now.getTime() - 180_000) : null,
      },
    });
    const hasConsultation =
      item.status === 'IN_CONSULTATION' ||
      item.status === 'PAUSED' ||
      item.status === 'WAITING_LAB' ||
      item.status === 'COMPLETED';
    if (hasConsultation) {
      const isCompleted = item.status === 'COMPLETED';
      const isIncomplete =
        'isIncompleteConsultation' in item && item.isIncompleteConsultation;
      const completedAt = isCompleted
        ? new Date(now.getTime() - 5 * 60_000)
        : null;
      await prisma.consultation.create({
        data: {
          careSessionId: careSession.id,
          startedAt: isCompleted ? new Date(now.getTime() - 30 * 60_000) : now,
          completedAt,
          lockedAt: completedAt,
          clinicalNotes: isIncomplete
            ? null
            : `Q-DEMO clinical note ${String(item.patientNumber).padStart(2, '0')}`,
          prescription:
            'hasSavedPrescription' in item && item.hasSavedPrescription
              ? [
                  {
                    id: 'Q-DEMO-PRESCRIPTION-16',
                    name: 'Q-DEMO Paracetamol 500 mg',
                    strength: '500 mg',
                    dose: '1 tablet',
                    route: 'Oral',
                    frequency: 'Every 8 hours as needed',
                    days: 3,
                    quantity: 9,
                    instructions: 'Take after food.',
                  },
                ]
              : [],
          labOrderNotes:
            item.status === 'WAITING_LAB'
              ? JSON.stringify({
                  orders: [
                    {
                      orderRef: 'XN-SH-09',
                      service: 'Troponin T định lượng (hs-cTnT)',
                      purpose: 'Q-DEMO chest discomfort evaluation',
                      instructions: 'Q-DEMO collect one blood sample.',
                    },
                    {
                      orderRef: 'TDCN-01',
                      service: 'Điện tâm đồ thường (ECG 12 chuyển đạo)',
                      purpose: 'Q-DEMO chest discomfort evaluation',
                      instructions: 'Q-DEMO record a resting ECG.',
                    },
                  ],
                  reason: 'Q-DEMO chest discomfort evaluation',
                  notes: 'Q-DEMO lab order fixture.',
                  results:
                    'hasLabResult' in item && item.hasLabResult
                      ? [
                          {
                            orderRef: 'XN-SH-09',
                            result:
                              'Q-DEMO Troponin T: within reference range.',
                            source: 'Q-DEMO local laboratory',
                            returnedAt: now.toISOString(),
                            recordedBy: admin.id,
                          },
                        ]
                      : [],
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
          ...(isIncomplete
            ? {}
            : {
                diagnoses: {
                  create: {
                    diagnosisCode: 'I10',
                    diagnosisName: 'Tăng huyết áp vô căn (nguyên phát)',
                    isPrimary: true,
                    notes:
                      'Q-DEMO seeded primary diagnosis for examination tests.',
                  },
                },
              }),
        },
      });
    }
    if (!isScheduled) queueNumbers.set(doctor.specialtyId, queueNumber + 1);
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
      requireE2EClock();
      const scenario = getQueueScenario();
      await cleanup(prisma);
      await seed(prisma, scenario);
      console.log(`Queue demo data is ready (${scenario}).`);
    }
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : 'Queue seed failed.');
  process.exitCode = 1;
});
