import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { randomBytes } from 'node:crypto';
import type { Prisma } from '../../generated/prisma/client';
import {
  AppointmentBookingSource,
  AppointmentStatus,
  CareSessionPriorityType,
  CareSessionStatus,
  DoctorScheduleStatus,
  PatientGender,
  RoleStatusEnum,
  UserStatus,
} from '../../generated/prisma/enums';
import { PrismaService } from '../database/services/prisma.service';
import { sqlTable } from '../database/utils/sql-table';
import type { CurrentUserDto } from '../users/dto/responses/current-user.dto';
import { RoleEnum } from '../users/constants/roles.constant';
import { SchedulesService } from '../schedules/schedules.service';
import {
  ReceptionAppointmentStatus,
  ReceptionAppointmentsQueryDto,
  ReceptionQueueQueryDto,
  WalkInDto,
} from './dto/reception.dto';

const LISTED_SESSION_STATUSES = [
  CareSessionStatus.SCHEDULED,
  CareSessionStatus.CHECKED_IN,
  CareSessionStatus.WAITING,
] as const;

const QUEUE_SESSION_STATUSES = [
  CareSessionStatus.CHECKED_IN,
  CareSessionStatus.WAITING,
  CareSessionStatus.CALLED,
  CareSessionStatus.SKIPPED,
  CareSessionStatus.IN_CONSULTATION,
  CareSessionStatus.WAITING_LAB,
  CareSessionStatus.PAUSED,
] as const;

const ACCENTED_CHARACTERS =
  'áàảãạăắằẳẵặâấầẩẫậđéèẻẽẹêếềểễệíìỉĩịóòỏõọôốồổỗộơớờởỡợúùủũụưứừửữựýỳỷỹỵ';
const UNACCENTED_CHARACTERS =
  'aaaaaaaaaaaaaaaaadeeeeeeeeeeeiiiiiooooooooooooooooouuuuuuuuuuuyyyyy';

const APPOINTMENT_INCLUDE = {
  patient: {
    select: {
      id: true,
      patientCode: true,
      fullName: true,
      phone: true,
      dateOfBirth: true,
      gender: true,
      nationalId: true,
      address: true,
    },
  },
  careSessions: {
    where: { status: { in: [...LISTED_SESSION_STATUSES] } },
    include: {
      specialty: { select: { id: true, name: true, roomCode: true } },
      appointmentSlot: {
        include: {
          doctorSchedule: {
            include: {
              doctor: {
                select: {
                  id: true,
                  academicTitle: true,
                  qualification: true,
                  user: { select: { fullName: true } },
                  specialty: {
                    select: { id: true, name: true, roomCode: true },
                  },
                },
              },
            },
          },
        },
      },
    },
  },
} satisfies Prisma.AppointmentInclude;

type ReceptionAppointment = Prisma.AppointmentGetPayload<{
  include: typeof APPOINTMENT_INCLUDE;
}>;

function clinicDate(value?: string): Date {
  const dateValue = value ?? clinicDateString(new Date());
  if (!/^\d{4}-\d{2}-\d{2}$/.test(dateValue))
    throw new BadRequestException('Ngày không hợp lệ.');
  const date = new Date(`${dateValue}T00:00:00+07:00`);
  if (
    !Number.isFinite(date.getTime()) ||
    new Intl.DateTimeFormat('en-CA', {
      timeZone: 'Asia/Ho_Chi_Minh',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    }).format(date) !== dateValue
  )
    throw new BadRequestException('Ngày không hợp lệ.');
  return date;
}

function clinicDateString(date: Date): string {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: 'Asia/Ho_Chi_Minh',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(date);
  const values = Object.fromEntries(
    parts
      .filter(({ type }) => type !== 'literal')
      .map(({ type, value }) => [type, value]),
  );
  return `${values.year}-${values.month}-${values.day}`;
}

function timeText(date: Date): string {
  return new Intl.DateTimeFormat('vi-VN', {
    timeZone: 'Asia/Ho_Chi_Minh',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).format(date);
}

function displayStatus(
  status: CareSessionStatus,
  startsAt: Date,
  now: Date,
): ReceptionAppointmentStatus {
  if (
    status === CareSessionStatus.CHECKED_IN ||
    status === CareSessionStatus.WAITING
  )
    return ReceptionAppointmentStatus.CHECKED_IN;
  return startsAt < now
    ? ReceptionAppointmentStatus.LATE
    : ReceptionAppointmentStatus.WAITING_CHECKIN;
}

@Injectable()
export class ReceptionService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly schedules: SchedulesService,
  ) {}

  async listAppointments(query: ReceptionAppointmentsQueryDto) {
    const status = query.tab ?? query.status;
    const searchTerm = query.search ?? query.q;
    const pageSize = query.pageSize ?? query.limit;
    const dateStart = clinicDate(query.date);
    const dateEnd = new Date(dateStart.getTime() + 86400000);
    const now = new Date();
    const slotStartsAt =
      status === ReceptionAppointmentStatus.LATE
        ? { gte: dateStart, lt: now }
        : status === ReceptionAppointmentStatus.WAITING_CHECKIN
          ? { gte: now, lt: dateEnd }
          : { gte: dateStart, lt: dateEnd };
    const slotWhere: Prisma.AppointmentSlotWhereInput = {
      startsAt: slotStartsAt,
      ...(query.doctorId
        ? { doctorSchedule: { doctorId: query.doctorId } }
        : {}),
    };
    const sessionWhere: Prisma.CareSessionWhereInput = {
      status:
        status === ReceptionAppointmentStatus.CHECKED_IN
          ? { in: [CareSessionStatus.CHECKED_IN, CareSessionStatus.WAITING] }
          : status === ReceptionAppointmentStatus.LATE ||
              status === ReceptionAppointmentStatus.WAITING_CHECKIN
            ? CareSessionStatus.SCHEDULED
            : { in: [...LISTED_SESSION_STATUSES] },
      appointmentSlot: slotWhere,
      ...(query.specialtyId ? { specialtyId: query.specialtyId } : {}),
    };
    const search = searchTerm?.trim();
    const searchIds = search
      ? await this.findSearchAppointmentIds(search)
      : undefined;
    const where: Prisma.AppointmentWhereInput = {
      status: { not: AppointmentStatus.CANCELLED },
      careSessions: { some: sessionWhere },
      ...(search ? { id: { in: searchIds } } : {}),
    };
    const statsSessionWhere: Prisma.CareSessionWhereInput = {
      appointmentSlot: {
        startsAt: { gte: dateStart, lt: dateEnd },
      },
      ...(query.specialtyId ? { specialtyId: query.specialtyId } : {}),
    };
    const statsAppointmentWhere: Prisma.AppointmentWhereInput = {
      status: { not: AppointmentStatus.CANCELLED },
      careSessions: { some: statsSessionWhere },
    };
    const [
      appointments,
      total,
      statsTotal,
      statsWaitingCheckIn,
      statsLate,
      statsCheckedIn,
    ] = await this.prisma.$transaction([
      this.prisma.appointment.findMany({
        where,
        include: APPOINTMENT_INCLUDE,
        orderBy: { createdAt: 'desc' },
        skip: (query.page - 1) * pageSize,
        take: pageSize,
      }),
      this.prisma.appointment.count({ where }),
      this.prisma.appointment.count({
        where: statsAppointmentWhere,
      }),
      this.prisma.appointment.count({
        where: {
          ...statsAppointmentWhere,
          careSessions: {
            some: {
              ...statsSessionWhere,
              status: CareSessionStatus.SCHEDULED,
              appointmentSlot: {
                startsAt: { gte: now, lt: dateEnd },
              },
            },
          },
        },
      }),
      this.prisma.appointment.count({
        where: {
          ...statsAppointmentWhere,
          careSessions: {
            some: {
              ...statsSessionWhere,
              status: CareSessionStatus.SCHEDULED,
              appointmentSlot: {
                startsAt: { gte: dateStart, lt: now },
              },
            },
          },
        },
      }),
      this.prisma.appointment.count({
        where: {
          ...statsAppointmentWhere,
          careSessions: {
            some: {
              ...statsSessionWhere,
              status: {
                in: [CareSessionStatus.CHECKED_IN, CareSessionStatus.WAITING],
              },
            },
          },
        },
      }),
    ]);
    return {
      items: appointments
        .map((appointment) => this.presentAppointment(appointment, now))
        .filter((appointment) =>
          status ? appointment.status === status : true,
        ),
      total,
      page: query.page,
      limit: pageSize,
      stats: {
        total: statsTotal,
        waitingCheckIn: statsWaitingCheckIn,
        upcoming: statsWaitingCheckIn,
        late: statsLate,
        checkedIn: statsCheckedIn,
      },
      timeZone: 'Asia/Ho_Chi_Minh',
    };
  }

  private async findSearchAppointmentIds(search: string): Promise<string[]> {
    const normalizedSearch = search
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/đ/gi, 'd')
      .toLowerCase()
      .trim();
    const appointmentsTable = sqlTable(this.prisma.schemaName, 'appointments');
    const patientsTable = sqlTable(this.prisma.schemaName, 'patients');
    const rows = await this.prisma.$queryRaw<{ id: string }[]>`
      SELECT a.id
      FROM ${appointmentsTable} a
      INNER JOIN ${patientsTable} p ON p.id = a.patient_id
      WHERE translate(
        lower(concat_ws(' ', a.appointment_code, p.patient_code, p.full_name, p.phone, p.national_id)),
        ${ACCENTED_CHARACTERS},
        ${UNACCENTED_CHARACTERS}
      ) LIKE '%' || ${normalizedSearch} || '%'
    `;
    return rows.map(({ id }) => id);
  }

  async getAppointment(id: string) {
    const appointment = await this.findAppointment(id);
    return this.presentAppointment(appointment, new Date());
  }

  async checkIn(id: string, user: CurrentUserDto) {
    const maxAttempts = 3;
    for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
      try {
        await this.prisma.$transaction(
          async (tx) => {
            const appointment = await tx.appointment.findUnique({
              where: { id },
              include: {
                careSessions: {
                  include: { appointmentSlot: true },
                },
              },
            });
            if (!appointment)
              throw new NotFoundException('Appointment not found');
            if (appointment.status === AppointmentStatus.CANCELLED)
              throw new ConflictException('Appointment is cancelled');
            const session = appointment.careSessions[0];
            if (!session)
              throw new ConflictException('Appointment session not found');
            if (
              session.status === CareSessionStatus.CHECKED_IN ||
              session.status === CareSessionStatus.WAITING
            )
              throw new ConflictException('Appointment is already checked in');
            if (session.status !== CareSessionStatus.SCHEDULED)
              throw new ConflictException('Appointment cannot be checked in');
            const queueDate = clinicDate();
            const queueKey = `${session.specialtyId}:${clinicDateString(queueDate)}`;
            await tx.$queryRaw<{ locked: string }[]>`
            SELECT pg_advisory_xact_lock(
              hashtext('RECEPTION_QUEUE'),
              hashtext(${queueKey})
            )::text AS locked
          `;
            const maximum = await tx.careSession.aggregate({
              where: {
                specialtyId: session.specialtyId,
                queueDate,
                queueNumber: { not: null },
              },
              _max: { queueNumber: true },
            });
            const queueNumber = (maximum._max.queueNumber ?? 0) + 1;
            await tx.careSession.update({
              where: { id: session.id },
              data: {
                status: CareSessionStatus.CHECKED_IN,
                checkedInAt: new Date(),
                checkedInBy: user.id,
                queueDate,
                queueNumber,
                queuePosition: queueNumber,
                priorityType:
                  session.appointmentSlot.startsAt < new Date()
                    ? CareSessionPriorityType.APPOINTMENT_LATE
                    : CareSessionPriorityType.APPOINTMENT_ON_TIME,
              },
            });
          },
          { isolationLevel: 'Serializable' },
        );
        break;
      } catch (error) {
        if (this.isSerializationError(error) && attempt < maxAttempts) {
          continue;
        }
        if (this.isUniqueConstraintError(error)) {
          throw new ConflictException(
            'Queue number is already in use. Please reload and try again.',
          );
        }
        if (this.isSerializationError(error)) {
          throw new ConflictException(
            'Check-in conflict. Please reload and try again.',
          );
        }
        throw error;
      }
    }
    return this.getAppointment(id);
  }

  async queue(query: ReceptionQueueQueryDto) {
    const queueDate = clinicDate(query.date);
    const where: Prisma.CareSessionWhereInput = {
      specialtyId: query.specialtyId,
      queueDate,
      status: { in: [...QUEUE_SESSION_STATUSES] },
    };
    const [sessions, total] = await this.prisma.$transaction([
      this.prisma.careSession.findMany({
        where,
        include: {
          appointment: {
            select: {
              id: true,
              appointmentCode: true,
              reason: true,
              patient: {
                select: { patientCode: true, fullName: true, phone: true },
              },
            },
          },
          appointmentSlot: {
            include: {
              doctorSchedule: {
                include: {
                  doctor: {
                    select: {
                      id: true,
                      academicTitle: true,
                      qualification: true,
                      user: { select: { fullName: true } },
                    },
                  },
                },
              },
            },
          },
        },
        orderBy: [{ queueNumber: 'asc' }, { id: 'asc' }],
        skip: (query.page - 1) * query.limit,
        take: query.limit,
      }),
      this.prisma.careSession.count({ where }),
    ]);
    return {
      items: sessions.map((session) => ({
        id: session.id,
        appointmentId: session.appointment.id,
        appointmentCode: session.appointment.appointmentCode,
        specialtyId: session.specialtyId,
        patientCode: session.appointment.patient.patientCode,
        patientName: session.appointment.patient.fullName,
        patientPhone: session.appointment.patient.phone,
        queueNumber: session.queueNumber,
        queueDisplayNumber: this.queueDisplayNumber(session.queueNumber),
        appointmentTime: timeText(session.appointmentSlot.startsAt),
        startsAt: session.appointmentSlot.startsAt,
        status: session.status,
        doctorName: session.appointmentSlot.doctorSchedule.doctor.user.fullName,
        doctorTitle: this.doctorTitle(
          session.appointmentSlot.doctorSchedule.doctor,
        ),
      })),
      total,
      page: query.page,
      limit: query.limit,
      timeZone: 'Asia/Ho_Chi_Minh',
    };
  }

  async ticket(id: string) {
    const appointment = await this.findAppointment(id);
    const session = appointment.careSessions[0];
    if (!session) throw new NotFoundException('Appointment session not found');
    return {
      appointmentId: appointment.id,
      appointmentCode: appointment.appointmentCode,
      patient: appointment.patient,
      doctor: {
        id: session.appointmentSlot.doctorSchedule.doctor.id,
        name: session.appointmentSlot.doctorSchedule.doctor.user.fullName,
        title: this.doctorTitle(session.appointmentSlot.doctorSchedule.doctor),
      },
      specialty: session.specialty,
      room: session.specialty.roomCode,
      appointmentTime: timeText(session.appointmentSlot.startsAt),
      queueNumber: session.queueNumber,
      queueDisplayNumber: this.queueDisplayNumber(session.queueNumber),
      reason: appointment.reason,
    };
  }

  async searchPatients(query: string) {
    const term = query.trim();
    if (!term) return { items: [], total: 0 };
    const items = await this.prisma.patient.findMany({
      where: {
        OR: [
          { fullName: { contains: term, mode: 'insensitive' } },
          { phone: { contains: term } },
          { patientCode: { contains: term, mode: 'insensitive' } },
          { nationalId: { contains: term } },
        ],
      },
      select: {
        id: true,
        patientCode: true,
        fullName: true,
        phone: true,
        dateOfBirth: true,
        gender: true,
        nationalId: true,
        address: true,
      },
      orderBy: { fullName: 'asc' },
      take: 20,
    });
    return { items, total: items.length };
  }

  async walkInSlots(query: ReceptionAppointmentsQueryDto) {
    const date = query.date ?? clinicDateString(new Date());
    const result = await this.schedules.availability({
      dateFrom: date,
      dateTo: date,
      doctorId: query.doctorId,
      specialtyId: query.specialtyId,
      page: query.page,
      limit: query.limit,
    });
    return result;
  }

  async walkIn(input: WalkInDto, user: CurrentUserDto) {
    const availability = await this.walkInSlots({
      date: undefined,
      doctorId: input.doctorId,
      specialtyId: input.specialtyId,
      page: 1,
      limit: 10000,
    });
    if (!availability.items.some((slot) => slot.id === input.appointmentSlotId))
      throw new ConflictException('Appointment slot is no longer available');
    let appointmentId: string;
    try {
      appointmentId = await this.prisma.$transaction(
        async (tx) => {
          const slot = await tx.appointmentSlot.findUnique({
            where: { id: input.appointmentSlotId },
            include: {
              careSessions: {
                where: {
                  status: {
                    notIn: [
                      CareSessionStatus.CANCELLED,
                      CareSessionStatus.NO_SHOW,
                    ],
                  },
                },
                select: { id: true },
              },
              doctorSchedule: { include: { doctor: true } },
            },
          });
          if (
            !slot ||
            slot.isBlocked ||
            slot.doctorSchedule.status !== DoctorScheduleStatus.PUBLISHED ||
            slot.doctorSchedule.doctor.id !== input.doctorId ||
            slot.doctorSchedule.doctor.specialtyId !== input.specialtyId ||
            slot.careSessions.length
          )
            throw new ConflictException(
              'Appointment slot is no longer available',
            );
          const patient = await this.resolvePatient(tx, input);
          const appointment = await tx.appointment.create({
            data: {
              appointmentCode: this.appointmentCode(),
              patientId: patient.id,
              bookingSource: AppointmentBookingSource.WALK_IN,
              status: AppointmentStatus.CONFIRMED,
              createdBy: user.id,
              reason: input.reason,
              careSessions: {
                create: {
                  appointmentSlotId: slot.id,
                  specialtyId: input.specialtyId,
                  status: CareSessionStatus.SCHEDULED,
                },
              },
            },
            select: { id: true },
          });
          if (input.checkIn) {
            await this.allocateQueue(tx, appointment.id, user.id);
          }
          return appointment.id;
        },
        { isolationLevel: 'Serializable' },
      );
    } catch (error) {
      if (this.isUniqueConstraintError(error))
        throw new ConflictException('Appointment slot is no longer available');
      throw error;
    }
    return this.getAppointment(appointmentId);
  }

  private async findAppointment(id: string): Promise<ReceptionAppointment> {
    const appointment = await this.prisma.appointment.findFirst({
      where: {
        id,
        status: { not: AppointmentStatus.CANCELLED },
        careSessions: {
          some: { status: { in: [...LISTED_SESSION_STATUSES] } },
        },
      },
      include: APPOINTMENT_INCLUDE,
    });
    if (!appointment) throw new NotFoundException('Appointment not found');
    return appointment;
  }

  private presentAppointment(appointment: ReceptionAppointment, now: Date) {
    const session = appointment.careSessions[0];
    if (!session) throw new NotFoundException('Appointment session not found');
    const doctor = session.appointmentSlot.doctorSchedule.doctor;
    const status = displayStatus(
      session.status,
      session.appointmentSlot.startsAt,
      now,
    );
    const isLate =
      status === ReceptionAppointmentStatus.LATE ||
      session.priorityType === CareSessionPriorityType.APPOINTMENT_LATE;
    return {
      id: appointment.id,
      appointmentCode: appointment.appointmentCode,
      patientCode: appointment.patient.patientCode,
      patientName: appointment.patient.fullName,
      patientPhone: appointment.patient.phone,
      patientGender: appointment.patient.gender,
      patientBirthDate: appointment.patient.dateOfBirth,
      specialtyId: session.specialty.id,
      specialtyName: session.specialty.name,
      room: session.specialty.roomCode,
      doctorId: doctor.id,
      doctorName: doctor.user.fullName,
      doctorTitle: this.doctorTitle(doctor),
      time: timeText(session.appointmentSlot.startsAt),
      startsAt: session.appointmentSlot.startsAt,
      endsAt: session.appointmentSlot.endsAt,
      status,
      queueNumber: session.queueNumber,
      queueDisplayNumber: this.queueDisplayNumber(session.queueNumber),
      checkedInAt: session.checkedInAt,
      reason: appointment.reason,
      isLate,
      isOnTime: !isLate,
    };
  }

  private async resolvePatient(tx: Prisma.TransactionClient, input: WalkInDto) {
    if (input.patientId) {
      const patient = await tx.patient.findUnique({
        where: { id: input.patientId },
      });
      if (!patient) throw new NotFoundException('Patient not found');
      return patient;
    }
    const existing = await tx.patient.findFirst({
      where: { phone: input.phone },
    });
    if (existing) return existing;
    const role = await tx.role.findUnique({
      where: { name: RoleEnum.PATIENT },
    });
    if (!role || role.status !== RoleStatusEnum.ACTIVE || role.deletedAt)
      throw new ConflictException('Patient role is unavailable');
    const birthDate = new Date(`${input.birthYear}-01-01T00:00:00+07:00`);
    const user = await tx.user.create({
      data: {
        fullName: input.fullName!,
        phone: input.phone,
        status: UserStatus.ACTIVE,
        roleId: role.id,
        patient: {
          create: {
            patientCode: `MC-${randomBytes(8).toString('hex').toUpperCase()}`,
            fullName: input.fullName!,
            phone: input.phone,
            dateOfBirth: birthDate,
            gender: input.gender as PatientGender,
            nationalId: input.nationalId,
            address: input.address,
          },
        },
      },
      include: { patient: true },
    });
    if (!user.patient)
      throw new ConflictException('Patient profile was not created');
    return user.patient;
  }

  private async allocateQueue(
    tx: Prisma.TransactionClient,
    appointmentId: string,
    userId: string,
  ) {
    const session = await tx.careSession.findFirst({
      where: { appointmentId },
      include: { appointmentSlot: true },
    });
    if (!session) throw new NotFoundException('Appointment session not found');
    const queueDate = clinicDate();
    const queueKey = `${session.specialtyId}:${clinicDateString(queueDate)}`;
    await tx.$queryRaw`SELECT pg_advisory_xact_lock(hashtext('RECEPTION_QUEUE'), hashtext(${queueKey}))`;
    const maximum = await tx.careSession.aggregate({
      where: {
        specialtyId: session.specialtyId,
        queueDate,
        queueNumber: { not: null },
      },
      _max: { queueNumber: true },
    });
    const queueNumber = (maximum._max.queueNumber ?? 0) + 1;
    await tx.careSession.update({
      where: { id: session.id },
      data: {
        status: CareSessionStatus.CHECKED_IN,
        checkedInAt: new Date(),
        checkedInBy: userId,
        queueDate,
        queueNumber,
        queuePosition: queueNumber,
        priorityType:
          session.appointmentSlot.startsAt < new Date()
            ? CareSessionPriorityType.APPOINTMENT_LATE
            : CareSessionPriorityType.APPOINTMENT_ON_TIME,
      },
    });
  }

  private doctorTitle(doctor: {
    academicTitle: string | null;
    qualification: string | null;
  }) {
    return [doctor.academicTitle, doctor.qualification]
      .filter(Boolean)
      .join(' ');
  }

  private queueDisplayNumber(queueNumber: number | null) {
    return queueNumber === null
      ? null
      : `A-${String(queueNumber).padStart(3, '0')}`;
  }

  private appointmentCode() {
    return `MDC-${Date.now().toString(36).toUpperCase()}-${randomBytes(2)
      .toString('hex')
      .toUpperCase()}`;
  }

  private isUniqueConstraintError(error: unknown) {
    return (
      error instanceof Error &&
      'code' in error &&
      (error as { code?: string }).code === 'P2002'
    );
  }

  private isSerializationError(error: unknown) {
    return (
      error instanceof Error &&
      'code' in error &&
      ((error as { code?: string }).code === 'P2034' ||
        (error as { code?: string }).code === 'P2002')
    );
  }
}
