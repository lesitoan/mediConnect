import { ConflictException, NotFoundException } from '@nestjs/common';
import { Prisma } from '../../../generated/prisma/client';
import { sqlTable } from './sql-table';
import { TransactionResourcesChangedError } from '../../../common/utils/transaction-resources-changed.error';

type LockMode = 'SHARE' | 'UPDATE';
type LockTable =
  | 'doctors'
  | 'patients'
  | 'doctor_schedules'
  | 'appointment_slots'
  | 'care_sessions'
  | 'appointments'
  | 'schedule_exceptions';

export async function lockBookingRows(
  client: Prisma.TransactionClient,
  schema: string,
  table: LockTable,
  ids: string[],
  mode: LockMode,
) {
  const keys = [...new Set(ids)].sort();
  if (!keys.length) return;
  const rows = await client.$queryRaw<{ id: string }[]>(Prisma.sql`
    SELECT id FROM ${sqlTable(schema, table)}
    WHERE id IN (${Prisma.join(keys.map((id) => Prisma.sql`${id}::uuid`))})
    ORDER BY id ${mode === 'SHARE' ? Prisma.sql`FOR SHARE` : Prisma.sql`FOR UPDATE`}
  `);
  if (rows.length !== keys.length)
    throw new NotFoundException('Booking resource not found');
}

interface SlotResource {
  id: string;
  scheduleId: string;
  doctorId: string;
}

/** ReadCommitted only: discover resources, lock in a fixed order, then re-read.
 * Clinical writers lock sessions before updating appointments, so do the same.
 * Shared doctor locks allow independent bookings and exclude pause/leave writers.
 */
export async function lockBookingResources(
  client: Prisma.TransactionClient,
  schema: string,
  input: {
    patientId: string;
    appointmentId?: string;
    slotIds?: string[];
    doctorIds?: string[];
    doctorLock?: LockMode;
  },
) {
  const appointmentWhere = {
    id: input.appointmentId,
    patientId: input.patientId,
  };
  const readAppointment = () =>
    client.appointment.findFirst({
      where: appointmentWhere,
      select: {
        id: true,
        careSessions: { select: { id: true, appointmentSlotId: true } },
      },
    });
  const before = input.appointmentId ? await readAppointment() : null;
  if (input.appointmentId && !before)
    throw new NotFoundException('Appointment not found');
  const slotIds = [
    ...new Set([
      ...(input.slotIds ?? []),
      ...(before?.careSessions.flatMap((s) =>
        s.appointmentSlotId ? [s.appointmentSlotId] : [],
      ) ?? []),
    ]),
  ].sort();
  const readSlots = () =>
    slotIds.length
      ? client.$queryRaw<SlotResource[]>(Prisma.sql`
    SELECT s.id, s.doctor_schedule_id AS "scheduleId", ds.doctor_id AS "doctorId"
    FROM ${sqlTable(schema, 'appointment_slots')} s
    JOIN ${sqlTable(schema, 'doctor_schedules')} ds ON ds.id=s.doctor_schedule_id
    WHERE s.id IN (${Prisma.join(slotIds.map((id) => Prisma.sql`${id}::uuid`))}) ORDER BY s.id
  `)
      : Promise.resolve([] as SlotResource[]);
  const slots = await readSlots();
  if (slots.length !== slotIds.length)
    throw new NotFoundException('Appointment slot not found');
  await lockBookingRows(
    client,
    schema,
    'doctors',
    [...slots.map((s) => s.doctorId), ...(input.doctorIds ?? [])],
    input.doctorLock ?? 'SHARE',
  );
  await lockBookingRows(
    client,
    schema,
    'patients',
    [input.patientId],
    'UPDATE',
  );
  await lockBookingRows(
    client,
    schema,
    'doctor_schedules',
    slots.map((s) => s.scheduleId),
    'SHARE',
  );
  await lockBookingRows(client, schema, 'appointment_slots', slotIds, 'UPDATE');
  await lockBookingRows(
    client,
    schema,
    'care_sessions',
    before?.careSessions.map((s) => s.id) ?? [],
    'UPDATE',
  );
  if (input.appointmentId)
    await lockBookingRows(
      client,
      schema,
      'appointments',
      [input.appointmentId],
      'UPDATE',
    );
  const after = input.appointmentId ? await readAppointment() : null;
  const signature = (a: typeof before) =>
    JSON.stringify(
      a?.careSessions.map((s) => [s.id, s.appointmentSlotId]).sort() ?? [],
    );
  if (
    (input.appointmentId && !after) ||
    signature(before) !== signature(after) ||
    JSON.stringify(slots) !== JSON.stringify(await readSlots())
  ) {
    throw new TransactionResourcesChangedError();
  }
}

export async function hasPatientBookingOverlap(
  client: Prisma.TransactionClient,
  schema: string,
  patientId: string,
  startsAt: Date,
  endsAt: Date,
  activeStatuses: readonly string[],
  excludedSessionId?: string,
): Promise<boolean> {
  const statuses = Prisma.join(
    activeStatuses.map(
      (status) =>
        Prisma.sql`${status}::${sqlTable(schema, 'CareSessionStatus')}`,
    ),
  );
  const [result] = await client.$queryRaw<{ overlaps: boolean }[]>(Prisma.sql`
    SELECT EXISTS (
      SELECT 1 FROM ${sqlTable(schema, 'appointments')} a
      JOIN ${sqlTable(schema, 'care_sessions')} cs ON cs.appointment_id=a.id
      JOIN ${sqlTable(schema, 'appointment_slots')} s ON s.id=cs.appointment_slot_id
      WHERE a.patient_id=${patientId}::uuid AND a.status IN ('CONFIRMED','PENDING_RESOLUTION')
        AND cs.status IN (${statuses}) AND s.starts_at<${endsAt} AND s.ends_at>${startsAt}
        ${excludedSessionId ? Prisma.sql`AND cs.id<>${excludedSessionId}::uuid` : Prisma.empty}
    ) AS overlaps
  `);
  if (!result) throw new Error('Overlap query returned no result');
  return result.overlaps;
}

export const ACTIVE_BOOKING_SESSION_STATUSES = [
  'SCHEDULED',
  'CHECKED_IN',
  'WAITING',
  'CALLED',
  'SKIPPED',
  'IN_CONSULTATION',
  'WAITING_LAB',
  'PAUSED',
] as const;

export async function assertDoctorAvailable(
  client: Prisma.TransactionClient,
  doctorId: string,
  startsAt: Date,
  endsAt: Date,
) {
  const doctor = await client.doctor.findFirst({
    where: {
      id: doctorId,
      isActive: true,
      specialty: { isActive: true },
      user: {
        status: 'ACTIVE',
        deletedAt: null,
        role: { name: 'DOCTOR', status: 'ACTIVE', deletedAt: null },
      },
      leaveRequests: {
        none: {
          status: { in: ['RESOLVING', 'APPROVED'] },
          startsAt: { lt: endsAt },
          OR: [{ endsAt: null }, { endsAt: { gt: startsAt } }],
        },
      },
    },
    select: { id: true },
  });
  if (!doctor)
    throw new ConflictException('Doctor is unavailable for this interval');
}
