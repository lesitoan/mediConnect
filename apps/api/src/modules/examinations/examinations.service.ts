import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  Prisma,
  CareSessionStatus,
  UserRole,
} from '../../generated/prisma/client';
import { clinicDate, clinicDateString } from '../../common/utils/clinic-date';
import { PrismaService } from '../database/services/prisma.service';
import { QueuesService } from '../queues/queues.service';
import type { CurrentUserDto } from '../users/dto/responses/current-user.dto';
import { UpdateExaminationDto } from './dto/update-examination.dto';

function age(dateOfBirth: Date | null) {
  if (!dateOfBirth) return null;
  const now = new Date();
  let value = now.getUTCFullYear() - dateOfBirth.getUTCFullYear();
  if (
    now.getUTCMonth() < dateOfBirth.getUTCMonth() ||
    (now.getUTCMonth() === dateOfBirth.getUTCMonth() &&
      now.getUTCDate() < dateOfBirth.getUTCDate())
  )
    value--;
  return value;
}

function mapStatus(status: CareSessionStatus) {
  if (status === CareSessionStatus.CALLED) return 'CALLED' as const;
  if (status === CareSessionStatus.WAITING_LAB)
    return 'WAITING_RESULTS' as const;
  if (status === CareSessionStatus.PAUSED) return 'PAUSED' as const;
  if (status === CareSessionStatus.COMPLETED) return 'COMPLETED' as const;
  return 'IN_PROGRESS' as const;
}

function parsePrescription(value: Prisma.JsonValue | null) {
  if (!value) return [];
  if (Array.isArray(value)) return value;
  return [];
}

function parseLabOrders(value: string | null) {
  if (!value) return { orders: '', reason: '', notes: '' };
  try {
    const parsed: unknown = JSON.parse(value);
    if (
      typeof parsed === 'object' &&
      parsed !== null &&
      'orders' in parsed &&
      'reason' in parsed &&
      'notes' in parsed
    ) {
      const data = parsed as {
        orders: unknown;
        reason: unknown;
        notes: unknown;
      };
      return {
        orders: typeof data.orders === 'string' ? data.orders : '',
        reason: typeof data.reason === 'string' ? data.reason : '',
        notes: typeof data.notes === 'string' ? data.notes : '',
      };
    }
  } catch {
    return { orders: value, reason: '', notes: '' };
  }
  return { orders: value, reason: '', notes: '' };
}

@Injectable()
export class ExaminationsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly queues: QueuesService,
  ) {}

  async list(date: string | undefined, user: CurrentUserDto) {
    const queueDate = clinicDate(date);
    const sessions = await this.prisma.careSession.findMany({
      where: {
        queueDate,
        appointmentSlot: {
          doctorSchedule: {
            doctor:
              user.role === UserRole.ADMIN ? undefined : { userId: user.id },
          },
        },
        status: {
          in: [
            CareSessionStatus.CALLED,
            CareSessionStatus.IN_CONSULTATION,
            CareSessionStatus.WAITING_LAB,
            CareSessionStatus.PAUSED,
            CareSessionStatus.COMPLETED,
          ],
        },
      },
      orderBy: [{ queuePosition: 'asc' }, { createdAt: 'asc' }],
      include: this.include(),
    });
    return sessions.map((session) => this.present(session));
  }

  async get(careSessionId: string, user: CurrentUserDto) {
    await this.queues.assertCanAccessSession(careSessionId, user);
    const session = await this.prisma.careSession.findUnique({
      where: { id: careSessionId },
      include: this.include(),
    });
    if (!session) throw new NotFoundException('Không tìm thấy lượt khám.');
    return this.present(session);
  }

  async open(careSessionId: string, user: CurrentUserDto) {
    await this.queues.startConsultation(careSessionId, user);
    return this.get(careSessionId, user);
  }

  async update(
    careSessionId: string,
    dto: UpdateExaminationDto,
    user: CurrentUserDto,
  ) {
    await this.queues.assertCanAccessSession(careSessionId, user);
    if (dto.status === 'COMPLETED') {
      await this.queues.complete(careSessionId, user);
      return this.get(careSessionId, user);
    }
    await this.prisma.$transaction(async (tx) => {
      const current = await tx.careSession.findUnique({
        where: { id: careSessionId },
        include: {
          consultation: true,
          appointment: { select: { patientId: true } },
        },
      });
      if (!current) throw new NotFoundException('Không tìm thấy lượt khám.');
      if (current.consultation?.lockedAt)
        throw new ConflictException('Phiên khám đã khóa sau khi hoàn tất.');
      if (
        current.status !== CareSessionStatus.IN_CONSULTATION &&
        current.status !== CareSessionStatus.PAUSED
      )
        throw new ConflictException('Chỉ có thể cập nhật phiên đang khám.');
      const consultation = await tx.consultation.upsert({
        where: { careSessionId },
        create: {
          careSessionId,
          clinicalNotes: dto.clinicalNotes,
          prescription: this.prescription(dto) ?? Prisma.JsonNull,
          labOrderNotes: this.labNotes(dto),
          followUpDate: dto.followUpDate
            ? new Date(`${dto.followUpDate}T00:00:00.000Z`)
            : undefined,
          startedAt: new Date(),
        },
        update: {
          ...(dto.clinicalNotes === undefined
            ? {}
            : { clinicalNotes: dto.clinicalNotes }),
          ...(dto.prescription !== undefined ||
          dto.prescriptionJson !== undefined
            ? { prescription: this.prescription(dto) ?? Prisma.JsonNull }
            : {}),
          ...(dto.labOrders !== undefined ||
          dto.labReason !== undefined ||
          dto.labNotes !== undefined
            ? { labOrderNotes: this.labNotes(dto) }
            : {}),
          ...(dto.followUpDate === undefined
            ? {}
            : {
                followUpDate: dto.followUpDate
                  ? new Date(`${dto.followUpDate}T00:00:00.000Z`)
                  : null,
              }),
        },
      });
      if (dto.complaint !== undefined)
        await tx.appointment.update({
          where: { id: current.appointmentId },
          data: { reason: dto.complaint },
        });
      if (dto.diagnosis !== undefined) {
        await tx.diagnosis.deleteMany({
          where: { consultationId: consultation.id },
        });
        const [code, ...name] = dto.diagnosis.split(' — ');
        if (dto.diagnosis.trim())
          await tx.diagnosis.create({
            data: {
              consultationId: consultation.id,
              diagnosisCode: code.trim() || null,
              diagnosisName: name.join(' — ').trim() || code.trim(),
              isPrimary: true,
              notes: dto.diagnosisNotes,
            },
          });
      }
      if (dto.history?.trim()) {
        const doctor = await tx.doctor.findUnique({
          where: { userId: user.id },
          select: { id: true },
        });
        if (doctor) {
          const exists = await tx.patientMedicalRecord.findFirst({
            where: {
              patientId: current.appointment.patientId,
              recordType: 'MEDICAL_HISTORY',
              name: dto.history.trim(),
            },
            select: { id: true },
          });
          if (!exists)
            await tx.patientMedicalRecord.create({
              data: {
                patientId: current.appointment.patientId,
                recordType: 'MEDICAL_HISTORY',
                name: dto.history.trim(),
                description: [
                  dto.surgicalHistory,
                  dto.currentMedications,
                  dto.riskFactors,
                ]
                  .filter(Boolean)
                  .join('\n'),
                createdBy: user.id,
                confirmedBy: doctor.id,
                confirmedInConsultationId: consultation.id,
                confirmedAt: new Date(),
                status: 'CONFIRMED',
              },
            });
        }
      }
      if (
        dto.status === 'WAITING_RESULTS' ||
        dto.status === 'PAUSED' ||
        dto.status === 'IN_PROGRESS'
      ) {
        const status =
          dto.status === 'WAITING_RESULTS'
            ? CareSessionStatus.WAITING_LAB
            : dto.status === 'PAUSED'
              ? CareSessionStatus.PAUSED
              : CareSessionStatus.IN_CONSULTATION;
        await tx.careSession.update({
          where: { id: careSessionId },
          data: { status },
        });
      }
    });
    return this.get(careSessionId, user);
  }

  private include() {
    return {
      appointment: {
        include: { patient: { include: { medicalRecords: true } } },
      },
      appointmentSlot: { include: { doctorSchedule: true } },
      specialty: true,
      consultation: {
        include: {
          diagnoses: { orderBy: { isPrimary: 'desc' } },
          outgoingReferrals: true,
        },
      },
    } satisfies Prisma.CareSessionInclude;
  }

  private present(
    session: Prisma.CareSessionGetPayload<{
      include: ReturnType<ExaminationsService['include']>;
    }>,
  ) {
    const consultation = session.consultation;
    const primary = consultation?.diagnoses[0];
    const history = session.appointment.patient.medicalRecords
      .filter((record) => record.recordType === 'MEDICAL_HISTORY')
      .map((record) => record.name)
      .join(' · ');
    const allergy = session.appointment.patient.medicalRecords
      .filter((record) => record.recordType === 'ALLERGY')
      .map((record) => record.name)
      .join(' · ');
    const lab = parseLabOrders(consultation?.labOrderNotes ?? null);
    const date = session.queueDate
      ? clinicDateString(session.queueDate)
      : clinicDateString(new Date());
    return {
      id: session.id,
      appointmentCode: session.appointment.appointmentCode,
      patientName: session.appointment.patient.fullName,
      patientCode: session.appointment.patient.patientCode,
      demographics: `${session.appointment.patient.gender ?? 'OTHER'} · ${age(session.appointment.patient.dateOfBirth) ?? '-'} tuổi`,
      queueNumber: `STT ${session.queueNumber ?? '-'}`,
      room: session.specialty.roomCode,
      date,
      shift: 'Ca sáng (07:30–12:00)',
      status: mapStatus(session.status),
      allergy: allergy || 'Chưa ghi nhận',
      history: history || 'Chưa ghi nhận',
      complaint: session.appointment.reason ?? '',
      clinicalNotes: consultation?.clinicalNotes ?? '',
      diagnosis: primary
        ? `${primary.diagnosisCode ?? ''} — ${primary.diagnosisName}`
        : '',
      prescription:
        typeof consultation?.prescription === 'string'
          ? consultation.prescription
          : '',
      prescriptionItems: parsePrescription(consultation?.prescription ?? null),
      labOrders: lab.orders,
      labReason: lab.reason,
      labNotes: lab.notes,
      followUpDate:
        consultation?.followUpDate?.toISOString().slice(0, 10) ?? '',
      transfer: consultation?.outgoingReferrals[0]?.reason ?? '',
      isLocked: Boolean(consultation?.lockedAt),
    };
  }

  private prescription(
    dto: UpdateExaminationDto,
  ): Prisma.InputJsonValue | null {
    if (dto.prescriptionJson)
      return JSON.parse(dto.prescriptionJson) as Prisma.InputJsonValue;
    if (dto.prescription === undefined) return null;
    try {
      return JSON.parse(dto.prescription) as Prisma.InputJsonValue;
    } catch {
      return dto.prescription;
    }
  }

  private labNotes(dto: UpdateExaminationDto) {
    return JSON.stringify({
      orders: dto.labOrders ?? '',
      reason: dto.labReason ?? '',
      notes: dto.labNotes ?? '',
    });
  }
}
