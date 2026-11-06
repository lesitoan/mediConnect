import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
  Optional,
} from '@nestjs/common';
import {
  Prisma,
  CareSessionStatus,
  AuditLogResult,
  UserRole,
} from '../../generated/prisma/client';
import { clinicDate, clinicDateString } from '../../common/utils/clinic-date';
import { PrismaService } from '../database/services/prisma.service';
import { QueuesService } from '../queues/queues.service';
import type { CurrentUserDto } from '../users/dto/responses/current-user.dto';
import {
  ExaminationPrescriptionItemDto,
  LabOrderDto,
  UpdateExaminationDto,
} from './dto/update-examination.dto';
import { RecordLabResultDto } from './dto/record-lab-result.dto';
import { CreateReferralDto } from './dto/create-referral.dto';
import { AuditLogsService } from '../audit-logs/audit-logs.service';
import {
  ExaminationVersionDto,
  ConfirmMedicalRecordDto,
  IncompleteExaminationDto,
  PauseExaminationDto,
} from './dto/examination-transition.dto';

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

function normalizeSpecialtyName(value: string) {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[đĐ]/g, (character) => (character === 'đ' ? 'd' : 'D'))
    .trim()
    .toLocaleLowerCase('vi-VN');
}

function mapStatus(status: CareSessionStatus) {
  if (status === CareSessionStatus.CALLED) return 'CALLED' as const;
  if (status === CareSessionStatus.WAITING_LAB)
    return 'WAITING_RESULTS' as const;
  if (status === CareSessionStatus.PAUSED) return 'PAUSED' as const;
  if (status === CareSessionStatus.COMPLETED) return 'COMPLETED' as const;
  if (status === CareSessionStatus.INCOMPLETE) return 'INCOMPLETE' as const;
  return 'IN_PROGRESS' as const;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

type NormalizedDiagnosis = { code: string; name: string };

function validateDiagnosisInput(dto: UpdateExaminationDto) {
  const errors: string[] = [];
  let primary: NormalizedDiagnosis | null | undefined;
  if (dto.diagnosis !== undefined) {
    const value = dto.diagnosis.trim();
    if (!value) primary = null;
    else {
      const separatorIndex = value.indexOf('—');
      const code =
        separatorIndex < 0 ? '' : value.slice(0, separatorIndex).trim();
      const name =
        separatorIndex < 0 ? '' : value.slice(separatorIndex + 1).trim();
      if (!code) errors.push('diagnosis.code should not be empty');
      if (code.length > 30)
        errors.push(
          'diagnosis.code must be shorter than or equal to 30 characters',
        );
      if (!name) errors.push('diagnosis.name should not be empty');
      if (name.length > 500)
        errors.push(
          'diagnosis.name must be shorter than or equal to 500 characters',
        );
      primary = { code, name };
    }
  }
  let secondary: NormalizedDiagnosis[] | undefined;
  if (dto.secondaryDiagnoses !== undefined) {
    if (!Array.isArray(dto.secondaryDiagnoses))
      errors.push('secondaryDiagnoses must be an array');
    else if (dto.secondaryDiagnoses.length > 20)
      errors.push('secondaryDiagnoses must contain no more than 20 items');
    else {
      secondary = [];
      dto.secondaryDiagnoses.forEach((value: unknown, index) => {
        if (!isRecord(value)) {
          errors.push(`secondaryDiagnoses[${index}] must be an object`);
          return;
        }
        const code = typeof value.code === 'string' ? value.code.trim() : '';
        const name = typeof value.name === 'string' ? value.name.trim() : '';
        if (!code)
          errors.push(`secondaryDiagnoses[${index}].code should not be empty`);
        if (code.length > 30)
          errors.push(
            `secondaryDiagnoses[${index}].code must be shorter than or equal to 30 characters`,
          );
        if (!name)
          errors.push(`secondaryDiagnoses[${index}].name should not be empty`);
        if (name.length > 500)
          errors.push(
            `secondaryDiagnoses[${index}].name must be shorter than or equal to 500 characters`,
          );
        secondary?.push({ code, name });
      });
    }
  }
  if (dto.diagnosisNotes !== undefined && dto.diagnosisNotes.length > 2000)
    errors.push(
      'diagnosisNotes must be shorter than or equal to 2000 characters',
    );
  const codes = new Set<string>();
  const requestedCodes = [
    ...(primary && primary !== null ? [primary.code] : []),
    ...(secondary ?? []).map((item) => item.code),
  ];
  requestedCodes.forEach((code, index) => {
    const normalized = code.toLocaleUpperCase('en-US');
    if (codes.has(normalized))
      errors.push(
        index === 0
          ? 'diagnosis.code must not be duplicated'
          : `secondaryDiagnoses[${index - (primary ? 1 : 0)}].code must not be duplicated`,
      );
    codes.add(normalized);
  });
  if (errors.length) throw new BadRequestException(errors);
  return { primary, secondary };
}

function readUnknownArray(value: unknown): unknown[] {
  return Array.isArray(value) ? value.map((entry: unknown) => entry) : [];
}

function parsePrescription(value: Prisma.JsonValue | null) {
  if (!value) return [];
  if (!Array.isArray(value)) return [];
  return value.flatMap((entry) => {
    if (typeof entry !== 'object' || entry === null || Array.isArray(entry))
      return [];
    const item = entry;
    const id = item.id;
    const name = item.name;
    const days = item.days;
    const quantity = item.quantity;
    if (
      typeof id !== 'string' ||
      typeof name !== 'string' ||
      typeof days !== 'number' ||
      typeof quantity !== 'number'
    )
      return [];
    return [
      {
        id,
        name,
        strength: typeof item.strength === 'string' ? item.strength : '',
        dose: typeof item.dose === 'string' ? item.dose : '',
        route: typeof item.route === 'string' ? item.route : '',
        frequency: typeof item.frequency === 'string' ? item.frequency : '',
        days,
        quantity,
        instructions:
          typeof item.instructions === 'string' ? item.instructions : '',
      },
    ];
  });
}

function validatePrescriptionItems(
  value: unknown,
): ExaminationPrescriptionItemDto[] {
  if (!Array.isArray(value))
    throw new BadRequestException(['prescriptionItems must be an array']);
  if (value.length === 0)
    throw new BadRequestException([
      'prescriptionItems must contain at least one item',
    ]);
  if (value.length > 50)
    throw new BadRequestException([
      'prescriptionItems must contain at most 50 items',
    ]);

  const errors: string[] = [];
  const items = value.map((entry, index) => {
    if (typeof entry !== 'object' || entry === null || Array.isArray(entry)) {
      errors.push(`prescriptionItems[${index}] must be an object`);
      return null;
    }
    const item = entry as Record<string, unknown>;
    const allowed = new Set([
      'id',
      'name',
      'strength',
      'dose',
      'route',
      'frequency',
      'days',
      'quantity',
      'instructions',
    ]);
    for (const key of Object.keys(item))
      if (!allowed.has(key))
        errors.push(`prescriptionItems[${index}].${key} should not exist`);

    const readText = (key: string, maxLength: number, required = false) => {
      const field = item[key];
      if (field === undefined && !required) return '';
      if (typeof field !== 'string') {
        errors.push(`prescriptionItems[${index}].${key} must be a string`);
        return '';
      }
      if (required && !field.trim())
        errors.push(`prescriptionItems[${index}].${key} should not be empty`);
      if (field.length > maxLength)
        errors.push(
          `prescriptionItems[${index}].${key} must be shorter than or equal to ${maxLength} characters`,
        );
      return field;
    };
    const id = readText('id', 36, true);
    const name = readText('name', 150, true).trim();
    const strength = readText('strength', 150);
    const dose = readText('dose', 150);
    const route = readText('route', 100);
    const frequency = readText('frequency', 150);
    const instructions = readText('instructions', 2000);
    const days = item.days;
    const quantity = item.quantity;
    if (
      typeof days !== 'number' ||
      !Number.isInteger(days) ||
      days < 1 ||
      days > 10000
    )
      errors.push(
        `prescriptionItems[${index}].days must be a positive integer no greater than 10000`,
      );
    if (
      typeof quantity !== 'number' ||
      !Number.isInteger(quantity) ||
      quantity < 1 ||
      quantity > 10000
    )
      errors.push(
        `prescriptionItems[${index}].quantity must be a positive integer no greater than 10000`,
      );
    return {
      id,
      name,
      strength,
      dose,
      route,
      frequency,
      days: typeof days === 'number' ? days : 0,
      quantity: typeof quantity === 'number' ? quantity : 0,
      instructions,
    };
  });
  if (errors.length) throw new BadRequestException(errors);
  return items.filter((item) => item !== null);
}

function parseLabOrders(value: string | null) {
  if (!value) return { orders: [], reason: '', notes: '', results: [] };
  try {
    const parsed: unknown = JSON.parse(value);
    if (
      typeof parsed === 'object' &&
      parsed !== null &&
      !Array.isArray(parsed)
    ) {
      const data = parsed as Record<string, unknown>;
      const orders = Array.isArray(data.orders)
        ? data.orders.filter(
            (entry): entry is Record<string, unknown> =>
              typeof entry === 'object' &&
              entry !== null &&
              !Array.isArray(entry),
          )
        : typeof data.orders === 'string'
          ? labOrderServices(data.orders).map((service) => ({
              service,
              purpose: typeof data.reason === 'string' ? data.reason : '',
              instructions: typeof data.notes === 'string' ? data.notes : '',
            }))
          : [];
      const results = Array.isArray(data.results)
        ? data.results.filter(
            (entry): entry is Record<string, unknown> =>
              typeof entry === 'object' &&
              entry !== null &&
              !Array.isArray(entry),
          )
        : [];
      return {
        orders,
        reason: typeof data.reason === 'string' ? data.reason : '',
        notes: typeof data.notes === 'string' ? data.notes : '',
        results,
        orderedAt: typeof data.orderedAt === 'string' ? data.orderedAt : null,
      };
    }
    if (typeof parsed === 'string') {
      return {
        orders: parsed
          .split(';')
          .map((service) => service.trim())
          .filter(Boolean)
          .map((service) => ({
            service,
            purpose: '',
            instructions: '',
          })),
        reason: '',
        notes: '',
        results: [],
      };
    }
  } catch {
    return {
      orders: value
        .split(';')
        .map((service) => service.trim())
        .filter(Boolean)
        .map((service) => ({
          service,
          purpose: '',
          instructions: '',
        })),
      reason: '',
      notes: '',
      results: [],
    };
  }
  return {
    orders: [],
    reason: '',
    notes: '',
    results: [],
  };
}

function labOrderServices(value: string): string[] {
  return value
    .split(';')
    .map((service) => service.trim())
    .filter(Boolean);
}

function normalizeLabOrders(
  value: string | LabOrderDto[] | undefined,
): LabOrderDto[] {
  if (Array.isArray(value)) return value;
  return labOrderServices(value ?? '').map((service) => ({
    service,
    purpose: '',
    instructions: '',
  }));
}

function validateLabOrderInput(
  orders: string | LabOrderDto[] | undefined,
  reason: string | undefined,
  notes: string | undefined,
) {
  if (orders === undefined && reason === undefined && notes === undefined)
    return null;
  const normalized = normalizeLabOrders(orders);
  const errors: string[] = [];
  if (!normalized.length)
    errors.push('orders must contain at least one service');
  if (normalized.length > 50)
    errors.push('labOrders must contain at most 50 services');
  normalized.forEach((order, index) => {
    if (!order.service.trim())
      errors.push(`orders[${index}].service should not be empty`);
    if (order.service.length > 150)
      errors.push(
        `orders[${index}].service must be shorter than or equal to 150 characters`,
      );
    if (Array.isArray(orders)) {
      if (!order.purpose.trim())
        errors.push(`orders[${index}].purpose should not be empty`);
      if (!order.instructions.trim())
        errors.push(`orders[${index}].instructions should not be empty`);
    }
  });
  const seenServices = new Set<string>();
  normalized.forEach((order, index) => {
    const normalizedService = order.service.trim().toLocaleLowerCase('vi');
    if (seenServices.has(normalizedService))
      errors.push(`orders[${index}].service must not be duplicated`);
    seenServices.add(normalizedService);
  });
  if (!reason?.trim()) errors.push('labReason must not be empty');
  if (reason && reason.length > 1000)
    errors.push('labReason must be shorter than or equal to 1000 characters');
  if (notes && notes.length > 1000)
    errors.push('labNotes must be shorter than or equal to 1000 characters');
  if (errors.length) throw new BadRequestException(errors);
  return normalized;
}

@Injectable()
export class ExaminationsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly queues: QueuesService,
    @Optional() private readonly auditLogs?: AuditLogsService,
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

  async open(
    careSessionId: string,
    expectedUpdatedAt: string,
    user: CurrentUserDto,
  ) {
    if (!expectedUpdatedAt)
      throw new BadRequestException(['expectedUpdatedAt should not be empty']);
    await this.assertDoctorWrite(careSessionId, user);
    const session = await this.prisma.careSession.findUnique({
      where: { id: careSessionId },
      select: { status: true },
    });
    if (!session) throw new NotFoundException('Không tìm thấy lượt khám.');
    if (session.status === CareSessionStatus.WAITING_LAB) {
      try {
        await this.prisma.$transaction(
          async (tx) => {
            const current = await tx.careSession.findUnique({
              where: { id: careSessionId },
              select: {
                status: true,
                consultation: { select: { lockedAt: true, updatedAt: true } },
              },
            });
            if (!current)
              throw new NotFoundException('Không tìm thấy lượt khám.');
            if (!current.consultation)
              throw new ConflictException('Consultation is missing');
            if (current.consultation.lockedAt)
              throw new ConflictException('Consultation is locked');
            if (
              current.consultation?.updatedAt.toISOString() !==
              expectedUpdatedAt
            )
              throw new ConflictException(
                'Consultation was updated. Reload before reopening.',
              );
            const reopened = await tx.careSession.updateMany({
              where: {
                id: careSessionId,
                status: CareSessionStatus.WAITING_LAB,
                consultation: {
                  is: {
                    lockedAt: null,
                    updatedAt: current.consultation.updatedAt,
                  },
                },
              },
              data: { status: CareSessionStatus.IN_CONSULTATION },
            });
            if (reopened.count !== 1)
              throw new ConflictException(
                'Lab wait state changed; reload before reopening.',
              );
          },
          { isolationLevel: 'Serializable', timeout: 15000 },
        );
      } catch (error) {
        if (
          error instanceof Prisma.PrismaClientKnownRequestError &&
          ['P2002', 'P2034'].includes(error.code)
        )
          throw new ConflictException('Lab wait state changed concurrently');
        throw error;
      }
      return this.get(careSessionId, user);
    }
    await this.queues.startConsultation(careSessionId, user);
    return this.get(careSessionId, user);
  }

  async pause(
    careSessionId: string,
    dto: PauseExaminationDto,
    user: CurrentUserDto,
  ) {
    await this.assertDoctorWrite(careSessionId, user);
    await this.transitionConsultation(
      careSessionId,
      dto.expectedUpdatedAt,
      user,
      {
        from: CareSessionStatus.IN_CONSULTATION,
        to: CareSessionStatus.PAUSED,
        action: 'PAUSED',
        reason: dto.reason,
      },
    );
    return this.get(careSessionId, user);
  }

  async resume(
    careSessionId: string,
    dto: ExaminationVersionDto,
    user: CurrentUserDto,
  ) {
    await this.assertDoctorWrite(careSessionId, user);
    await this.transitionConsultation(
      careSessionId,
      dto.expectedUpdatedAt,
      user,
      {
        from: CareSessionStatus.PAUSED,
        to: CareSessionStatus.IN_CONSULTATION,
        action: 'RESUMED',
        reason: '',
      },
    );
    return this.get(careSessionId, user);
  }

  async markIncomplete(
    careSessionId: string,
    dto: IncompleteExaminationDto,
    user: CurrentUserDto,
  ) {
    await this.assertDoctorWrite(careSessionId, user);
    await this.prisma
      .$transaction(
        async (tx) => {
          const session = await tx.careSession.findUnique({
            where: { id: careSessionId },
            include: { consultation: true },
          });
          if (!session) throw new NotFoundException('Examination not found');
          if (session.status !== CareSessionStatus.IN_CONSULTATION)
            throw new ConflictException(
              'Incomplete requires an active consultation',
            );
          if (session.consultation?.lockedAt)
            throw new ConflictException('Consultation is locked');
          if (
            session.consultation?.updatedAt.toISOString() !==
            dto.expectedUpdatedAt
          )
            throw new ConflictException(
              'Consultation was updated. Reload before saving.',
            );
          const now = new Date();
          const data = this.readLabData(
            session.consultation?.labOrderNotes ?? null,
          );
          const events = readUnknownArray(data.pauseEvents);
          await tx.consultation.update({
            where: { careSessionId },
            data: {
              updatedAt: now,
              lockedAt: now,
              labOrderNotes: JSON.stringify({
                ...data,
                incomplete: {
                  reason: dto.reason,
                  plan: dto.plan,
                  occurredAt: now.toISOString(),
                  actorId: user.id,
                },
                pauseEvents: events,
              }),
            },
          });
          await tx.careSession.update({
            where: { id: careSessionId },
            data: { status: CareSessionStatus.INCOMPLETE },
          });
          await this.auditTransition(
            tx,
            careSessionId,
            user,
            'EXAMINATION_INCOMPLETE',
            CareSessionStatus.INCOMPLETE,
          );
        },
        { isolationLevel: 'Serializable', timeout: 15000 },
      )
      .catch((error: unknown) => this.throwWriteConflict(error));
    return this.get(careSessionId, user);
  }

  async confirmMedicalRecord(
    careSessionId: string,
    recordId: string,
    dto: ConfirmMedicalRecordDto,
    user: CurrentUserDto,
  ) {
    await this.assertDoctorWrite(careSessionId, user);
    const doctor = await this.prisma.doctor.findUnique({
      where: { userId: user.id },
      select: { id: true },
    });
    if (!doctor) throw new ForbiddenException('Doctor profile is missing');
    try {
      await this.prisma.$transaction(
        async (tx) => {
          const session = await tx.careSession.findUnique({
            where: { id: careSessionId },
            include: {
              appointment: { select: { patientId: true } },
              consultation: true,
            },
          });
          if (!session) throw new NotFoundException('Examination not found');
          if (
            session.status !== CareSessionStatus.IN_CONSULTATION ||
            session.consultation?.lockedAt
          )
            throw new ConflictException(
              'Only an unlocked active consultation can confirm records',
            );
          if (!session.consultation)
            throw new ConflictException('Consultation is missing');
          if (
            session.consultation?.updatedAt.toISOString() !==
            dto.expectedUpdatedAt
          )
            throw new ConflictException(
              'Consultation was updated. Reload before saving.',
            );
          const record = await tx.patientMedicalRecord.findUnique({
            where: { id: recordId },
          });
          if (!record || record.patientId !== session.appointment.patientId)
            throw new NotFoundException('Medical record not found');
          const now = new Date();
          const updated = await tx.patientMedicalRecord.updateMany({
            where: {
              id: recordId,
              updatedAt: record.updatedAt,
              status: 'PENDING_CONFIRMATION',
            },
            data: {
              status: 'CONFIRMED',
              confirmedBy: doctor.id,
              confirmedAt: now,
              confirmedInConsultationId: session.consultation.id,
            },
          });
          if (updated.count !== 1)
            throw new ConflictException('Medical record changed concurrently');
          await tx.consultation.update({
            where: { id: session.consultation.id },
            data: { updatedAt: now },
          });
          await this.auditTransition(
            tx,
            careSessionId,
            user,
            'EXAMINATION_MEDICAL_RECORD_CONFIRMED',
            session.status,
          );
        },
        { isolationLevel: 'Serializable', timeout: 15000 },
      );
    } catch (error) {
      this.throwWriteConflict(error);
    }
    return this.get(careSessionId, user);
  }

  async update(
    careSessionId: string,
    dto: UpdateExaminationDto,
    user: CurrentUserDto,
  ) {
    await this.assertDoctorWrite(careSessionId, user);
    const hasDiagnosisChanges =
      dto.diagnosis !== undefined ||
      dto.diagnosisNotes !== undefined ||
      dto.secondaryDiagnoses !== undefined;
    const diagnosisInput = hasDiagnosisChanges
      ? validateDiagnosisInput(dto)
      : undefined;
    validateLabOrderInput(dto.labOrders, dto.labReason, dto.labNotes);
    const hasLabChanges =
      dto.labOrders !== undefined ||
      dto.labReason !== undefined ||
      dto.labNotes !== undefined;
    const hasContentChanges = Object.keys(dto).some(
      (key) => key !== 'expectedUpdatedAt' && key !== 'status',
    );
    if (
      (hasContentChanges || dto.status !== undefined) &&
      !dto.expectedUpdatedAt
    )
      throw new BadRequestException(['expectedUpdatedAt should not be empty']);
    if (dto.status === 'COMPLETED') {
      await this.queues.complete(
        careSessionId,
        user,
        dto.expectedUpdatedAt ?? '',
      );
      return this.get(careSessionId, user);
    }
    try {
      await this.prisma.$transaction(
        async (tx) => {
          const current = await tx.careSession.findUnique({
            where: { id: careSessionId },
            include: {
              consultation: true,
              appointment: { select: { patientId: true } },
            },
          });
          if (!current)
            throw new NotFoundException('Không tìm thấy lượt khám.');
          if (current.consultation?.lockedAt)
            throw new ConflictException('Phiên khám đã khóa sau khi hoàn tất.');
          if (
            dto.prescriptionItems !== undefined &&
            current.status !== CareSessionStatus.IN_CONSULTATION
          )
            throw new ConflictException(
              'Prescription requires an active consultation.',
            );
          if (
            current.status !== CareSessionStatus.IN_CONSULTATION &&
            !(
              dto.status === 'IN_PROGRESS' &&
              current.status === CareSessionStatus.PAUSED
            )
          )
            throw new ConflictException('Chỉ có thể cập nhật phiên đang khám.');
          if (dto.status === 'WAITING_RESULTS') {
            if (current.status !== CareSessionStatus.IN_CONSULTATION)
              throw new ConflictException(
                'Chỉ có thể chờ kết quả khi đang khám.',
              );
            const lab = parseLabOrders(
              current.consultation?.labOrderNotes ?? null,
            );
            if (!lab.orders.length)
              throw new ConflictException(
                'Cần lưu chỉ định cận lâm sàng trước.',
              );
          }
          if (
            hasContentChanges &&
            current.consultation?.updatedAt.getTime() !==
              new Date(dto.expectedUpdatedAt ?? '').getTime()
          )
            throw new ConflictException(
              'Consultation was updated. Reload before saving.',
            );
          if (dto.prescriptionItems !== undefined) {
            const prescriptionItems = validatePrescriptionItems(
              dto.prescriptionItems,
            );
            const hasStoredDiagnosis = current.consultation
              ? (await tx.diagnosis.count({
                  where: {
                    consultationId: current.consultation.id,
                    isPrimary: true,
                  },
                })) > 0
              : false;
            if (!hasStoredDiagnosis)
              throw new ConflictException(
                'Cannot prescribe without a primary diagnosis.',
              );
            if (
              new Set(prescriptionItems.map((item) => item.id)).size !==
              prescriptionItems.length
            )
              throw new BadRequestException(
                'prescriptionItems must not contain duplicate ids',
              );
            dto.prescriptionItems = prescriptionItems;
          }
          if (
            hasLabChanges &&
            current.status !== CareSessionStatus.IN_CONSULTATION
          )
            throw new ConflictException(
              'Lab orders can only be changed during an active consultation.',
            );
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
              ...(hasContentChanges ? { updatedAt: new Date() } : {}),
              ...(dto.clinicalNotes === undefined
                ? {}
                : { clinicalNotes: dto.clinicalNotes }),
              ...(dto.prescription !== undefined ||
              dto.prescriptionJson !== undefined ||
              dto.prescriptionItems !== undefined
                ? { prescription: this.prescription(dto) ?? Prisma.JsonNull }
                : {}),
              ...(dto.labOrders !== undefined ||
              dto.labReason !== undefined ||
              dto.labNotes !== undefined ||
              dto.followUpReason !== undefined ||
              dto.patientAdvice !== undefined ||
              dto.surgicalHistory !== undefined ||
              dto.currentMedications !== undefined ||
              dto.riskFactors !== undefined
                ? {
                    labOrderNotes: this.labNotes(
                      dto,
                      current.consultation?.labOrderNotes,
                    ),
                  }
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
          if (
            dto.diagnosis !== undefined ||
            dto.secondaryDiagnoses !== undefined
          ) {
            const existingDiagnoses = await tx.diagnosis.findMany({
              where: { consultationId: consultation.id },
            });
            const currentPrimary = existingDiagnoses.find(
              (item) => item.isPrimary,
            );
            const secondary =
              diagnosisInput?.secondary ??
              existingDiagnoses
                .filter((item) => !item.isPrimary)
                .map((item) => ({
                  code: item.diagnosisCode ?? '',
                  name: item.diagnosisName,
                }));
            const primary =
              diagnosisInput?.primary === undefined
                ? currentPrimary
                  ? {
                      code: currentPrimary.diagnosisCode ?? '',
                      name: currentPrimary.diagnosisName,
                    }
                  : null
                : diagnosisInput.primary;
            if (
              !primary &&
              Array.isArray(current.consultation?.prescription) &&
              current.consultation.prescription.length > 0
            )
              throw new ConflictException(
                'Cannot remove the primary diagnosis while a prescription exists.',
              );
            if (dto.diagnosisNotes !== undefined && !primary)
              throw new ConflictException(
                'Diagnosis notes require a primary diagnosis.',
              );
            const primaryCode = primary?.code.toLocaleUpperCase('en-US');
            const secondaryCodes = new Set<string>();
            secondary.forEach((item, index) => {
              const code = item.code.toLocaleUpperCase('en-US');
              if (code === primaryCode || secondaryCodes.has(code))
                throw new BadRequestException([
                  `secondaryDiagnoses[${index}].code must not be duplicated`,
                ]);
              secondaryCodes.add(code);
            });
            const requested = [
              ...(primary ? [{ ...primary, isPrimary: true }] : []),
              ...secondary.map((item) => ({ ...item, isPrimary: false })),
            ];
            const retainedIds = new Set<string>();
            for (const item of requested) {
              const existing = existingDiagnoses.find((candidate) =>
                item.isPrimary
                  ? candidate.isPrimary
                  : !candidate.isPrimary &&
                    candidate.diagnosisCode === item.code,
              );
              if (existing) {
                retainedIds.add(existing.id);
                await tx.diagnosis.update({
                  where: { id: existing.id },
                  data: {
                    diagnosisCode: item.code || null,
                    diagnosisName: item.name,
                    isPrimary: item.isPrimary,
                    notes: item.isPrimary ? dto.diagnosisNotes : existing.notes,
                  },
                });
              } else {
                const created = await tx.diagnosis.create({
                  data: {
                    consultationId: consultation.id,
                    diagnosisCode: item.code || null,
                    diagnosisName: item.name,
                    isPrimary: item.isPrimary,
                    notes: item.isPrimary ? dto.diagnosisNotes : null,
                  },
                });
                retainedIds.add(created.id);
              }
            }
            for (const item of existingDiagnoses)
              if (!retainedIds.has(item.id))
                await tx.diagnosis.delete({ where: { id: item.id } });
            await this.auditLogs?.record(
              {
                actor: {
                  type: 'USER',
                  id: user.id,
                  name: user.name,
                  role: user.role as UserRole,
                },
                actionCode: 'UPDATE_EXAMINATION_DIAGNOSIS',
                module: 'EXAMINATIONS',
                targetType: 'CONSULTATION',
                targetId: consultation.id,
                result: AuditLogResult.SUCCESS,
              },
              tx,
            );
          }
          if (
            dto.historyConditions !== undefined ||
            dto.history !== undefined
          ) {
            const doctor = await tx.doctor.findUnique({
              where: { userId: user.id },
              select: { id: true },
            });
            const conditions =
              dto.historyConditions ??
              (dto.history?.trim()
                ? [{ name: dto.history.trim(), note: '', isConfirmed: true }]
                : []);
            for (const condition of conditions) {
              const existing = await tx.patientMedicalRecord.findFirst({
                where: {
                  patientId: current.appointment.patientId,
                  recordType: 'MEDICAL_HISTORY',
                  name: condition.name.trim(),
                  confirmedInConsultationId: consultation.id,
                },
                select: { id: true },
              });
              const data = {
                name: condition.name.trim(),
                description: [
                  condition.note,
                  dto.surgicalHistory,
                  dto.currentMedications,
                  dto.riskFactors,
                ]
                  .filter(Boolean)
                  .join('\n'),
                createdBy: user.id,
                confirmedBy: condition.isConfirmed
                  ? (doctor?.id ?? null)
                  : null,
                confirmedAt: condition.isConfirmed ? new Date() : null,
                status: condition.isConfirmed
                  ? ('CONFIRMED' as const)
                  : ('PENDING_CONFIRMATION' as const),
              };
              if (existing)
                await tx.patientMedicalRecord.update({
                  where: { id: existing.id },
                  data,
                });
              else
                await tx.patientMedicalRecord.create({
                  data: {
                    patientId: current.appointment.patientId,
                    recordType: 'MEDICAL_HISTORY',
                    confirmedInConsultationId: consultation.id,
                    ...data,
                  },
                });
            }
          }
          if (dto.transfer && dto.referralSpecialty) {
            const specialty = await tx.specialty.findFirst({
              where: {
                name: { contains: dto.referralSpecialty, mode: 'insensitive' },
              },
              select: { id: true },
            });
            if (!specialty)
              throw new BadRequestException(
                'referralSpecialty does not match a specialty',
              );
            const existingReferral = await tx.internalReferral.findFirst({
              where: {
                sourceConsultationId: consultation.id,
                targetSpecialtyId: specialty.id,
                status: 'PENDING',
              },
              select: { id: true },
            });
            if (!existingReferral)
              await tx.internalReferral.create({
                data: {
                  sourceConsultationId: consultation.id,
                  targetSpecialtyId: specialty.id,
                  reason: `${dto.transfer.trim()} [Chưa có khung giờ]`,
                  status: 'PENDING',
                },
              });
          }
          if (dto.status === 'PAUSED' || dto.status === 'IN_PROGRESS') {
            const labData = this.readLabData(consultation.labOrderNotes);
            const pauseEvents = readUnknownArray(labData.pauseEvents);
            await tx.consultation.update({
              where: { id: consultation.id },
              data: {
                labOrderNotes: JSON.stringify({
                  ...labData,
                  pauseEvents: [
                    ...pauseEvents,
                    {
                      action: dto.status === 'PAUSED' ? 'PAUSED' : 'RESUMED',
                      reason:
                        dto.pauseReason ??
                        (dto.status === 'PAUSED'
                          ? 'Emergency pause initiated by doctor'
                          : ''),
                      occurredAt: new Date().toISOString(),
                      actorId: user.id,
                    },
                  ],
                }),
              },
            });
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
        },
        { isolationLevel: 'Serializable', timeout: 15000 },
      );
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        ['P2002', 'P2034'].includes(error.code)
      )
        throw new ConflictException('Consultation was updated concurrently');
      throw error;
    }
    return this.get(careSessionId, user);
  }

  async recordLabResult(
    careSessionId: string,
    dto: RecordLabResultDto,
    user: CurrentUserDto,
  ) {
    if (user.role === UserRole.DOCTOR)
      await this.assertDoctorWrite(careSessionId, user);
    else if (
      user.role !== UserRole.RECEPTIONIST &&
      user.role !== UserRole.ADMIN
    )
      throw new ForbiddenException('Role cannot record diagnostic results');
    if (!dto.expectedUpdatedAt)
      throw new BadRequestException(['expectedUpdatedAt should not be empty']);
    try {
      await this.prisma.$transaction(
        async (tx) => {
          const session = await tx.careSession.findUnique({
            where: { id: careSessionId },
            include: { consultation: true },
          });
          if (!session) throw new NotFoundException('Examination not found');
          if (session.consultation?.lockedAt)
            throw new ConflictException('Consultation is locked');
          if (
            session.status !== CareSessionStatus.WAITING_LAB &&
            session.status !== CareSessionStatus.IN_CONSULTATION
          )
            throw new ConflictException(
              'Lab results can only be recorded while examining or waiting for lab',
            );
          if (!session.consultation)
            throw new ConflictException('Lab order is missing');
          const current = this.readLabData(session.consultation.labOrderNotes);
          const orders = readUnknownArray(current.orders).filter(isRecord);
          const order = orders.find(
            (entry) =>
              entry.orderRef === dto.orderRef || entry.service === dto.orderRef,
          );
          if (!order)
            throw new BadRequestException(
              'orderRef does not match an ordered service',
            );
          const orderWasCompleted = order.status === 'COMPLETED';
          if (
            session.consultation.updatedAt.toISOString() !==
            dto.expectedUpdatedAt
          )
            throw new ConflictException(
              'Consultation was updated. Reload before saving.',
            );
          const returnedAt = dto.returnedAt ?? new Date().toISOString();
          const previousResults = readUnknownArray(current.results).filter(
            isRecord,
          );
          const existingResult = previousResults.findIndex(
            (entry) => entry.orderRef === dto.orderRef,
          );
          const images =
            dto.images ??
            (existingResult < 0
              ? []
              : readUnknownArray(previousResults[existingResult].images));
          const nextResult = {
            orderRef: dto.orderRef,
            result: dto.result,
            source: dto.source,
            returnedAt,
            recordedBy: user.id,
            images,
          };
          const results =
            existingResult < 0
              ? [...previousResults, nextResult]
              : previousResults.map((entry, index) =>
                  index === existingResult ? nextResult : entry,
                );
          if (dto.completeOrder) {
            order.status = 'COMPLETED';
            order.completedAt = returnedAt;
            order.recordedByName = user.name;
          }
          const isUnchanged =
            existingResult >= 0 &&
            JSON.stringify(previousResults[existingResult]) ===
              JSON.stringify(nextResult);
          if (isUnchanged && (!dto.completeOrder || orderWasCompleted)) return;
          await tx.consultation.update({
            where: { id: session.consultation.id },
            data: {
              labOrderNotes: JSON.stringify({
                ...current,
                orders,
                results,
              }),
            },
          });
          await this.auditLogs?.record(
            {
              actor: {
                type: 'USER',
                id: user.id,
                name: user.name,
                role: user.role as UserRole,
              },
              actionCode: dto.completeOrder
                ? 'DIAGNOSTIC_ORDER_COMPLETED'
                : 'DIAGNOSTIC_RESULT_RECORDED',
              module: 'DIAGNOSTIC_RESULTS',
              targetType: 'CARE_SESSION',
              targetId: careSessionId,
              result: AuditLogResult.SUCCESS,
            },
            tx,
          );
        },
        { isolationLevel: 'Serializable', timeout: 15000 },
      );
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        ['P2002', 'P2034'].includes(error.code)
      )
        throw new ConflictException('Examination was updated concurrently');
      throw error;
    }
    if (user.role === UserRole.DOCTOR) return this.get(careSessionId, user);
    const consultation = await this.prisma.consultation.findUnique({
      where: { careSessionId },
      select: { id: true, labOrderNotes: true, updatedAt: true },
    });
    return {
      careSessionId,
      consultationId: consultation?.id,
      updatedAt: consultation?.updatedAt.toISOString(),
      labResults: consultation
        ? (this.readLabData(consultation.labOrderNotes).results ?? [])
        : [],
    };
  }

  async history(careSessionId: string, user: CurrentUserDto) {
    await this.queues.assertCanAccessSession(careSessionId, user);
    const current = await this.prisma.careSession.findUnique({
      where: { id: careSessionId },
      select: { appointment: { select: { patientId: true } } },
    });
    if (!current) throw new NotFoundException('Examination not found');
    const visits = await this.prisma.consultation.findMany({
      where: {
        lockedAt: { not: null },
        careSessionId: { not: careSessionId },
        careSession: {
          status: CareSessionStatus.COMPLETED,
          appointment: { patientId: current.appointment.patientId },
          ...(user.role === UserRole.DOCTOR
            ? {
                appointmentSlot: {
                  doctorSchedule: { doctor: { userId: user.id } },
                },
              }
            : {}),
        },
      },
      include: {
        diagnoses: {
          where: { isPrimary: true },
          orderBy: { createdAt: 'asc' },
        },
        careSession: {
          include: {
            specialty: { select: { name: true } },
            appointmentSlot: {
              include: {
                doctorSchedule: {
                  include: {
                    doctor: {
                      include: { user: { select: { fullName: true } } },
                    },
                  },
                },
              },
            },
          },
        },
      },
      orderBy: { completedAt: 'desc' },
      take: 20,
    });
    return visits.map((visit) => {
      const labData = this.readLabData(visit.labOrderNotes);
      const results = Array.isArray(labData.results) ? labData.results : [];
      return {
        date:
          visit.completedAt?.toLocaleDateString('vi-VN', {
            timeZone: 'Asia/Ho_Chi_Minh',
          }) ?? '',
        name: visit.careSession.specialty.name,
        doctor:
          visit.careSession.appointmentSlot.doctorSchedule.doctor.user.fullName,
        diagnosis: visit.diagnoses
          .map(
            (diagnosis) =>
              `${diagnosis.diagnosisCode ?? ''} — ${diagnosis.diagnosisName}`,
          )
          .join('\n'),
        clinicalNotes: visit.clinicalNotes ?? '',
        prescription: Array.isArray(visit.prescription)
          ? visit.prescription
              .map((entry) => {
                if (
                  typeof entry !== 'object' ||
                  entry === null ||
                  !('name' in entry)
                )
                  return '';
                const name = entry.name;
                return typeof name === 'string' ? name : '';
              })
              .filter(Boolean)
              .join('\n')
          : '',
        labResults: readUnknownArray(results)
          .map((entry) => {
            if (!isRecord(entry) || !('result' in entry)) return '';
            const result = entry.result;
            return typeof result === 'string' ? result : '';
          })
          .filter(Boolean)
          .join('\n'),
      };
    });
  }

  async createReferral(
    careSessionId: string,
    dto: CreateReferralDto,
    user: CurrentUserDto,
  ) {
    await this.assertDoctorWrite(careSessionId, user);
    try {
      await this.prisma.$transaction(
        async (tx) => {
          const session = await tx.careSession.findUnique({
            where: { id: careSessionId },
            include: { consultation: true },
          });
          if (!session) throw new NotFoundException('Examination not found');
          if (session.consultation?.lockedAt)
            throw new ConflictException('Consultation is locked');
          if (session.status !== CareSessionStatus.IN_CONSULTATION)
            throw new ConflictException(
              'Referral requires an active consultation',
            );
          const existingConsultation =
            session.consultation ??
            (await tx.consultation.create({
              data: { careSessionId, startedAt: new Date() },
            }));
          const specialties = await tx.specialty.findMany({
            where: { isActive: true },
            select: { id: true, name: true },
          });
          const specialty = specialties.find(
            (item) =>
              normalizeSpecialtyName(item.name) ===
              normalizeSpecialtyName(dto.targetSpecialtyName),
          );
          if (!specialty)
            throw new BadRequestException(
              'targetSpecialtyName does not match a specialty',
            );
          if (dto.requestedDoctorId) {
            const requestedDoctor = await tx.doctor.findFirst({
              where: {
                id: dto.requestedDoctorId,
                specialtyId: specialty.id,
                isActive: true,
                user: { status: 'ACTIVE' },
              },
              select: { id: true },
            });
            if (!requestedDoctor)
              throw new BadRequestException(
                'requestedDoctorId must be an active doctor in target specialty',
              );
          }
          const existing = await tx.internalReferral.findFirst({
            where: {
              sourceConsultationId: existingConsultation.id,
              targetSpecialtyId: specialty.id,
              requestedDoctorId: dto.requestedDoctorId ?? null,
              priority: dto.priority,
              reason: { startsWith: dto.reason.trim() },
              status: { in: ['PENDING', 'NO_SLOT_AVAILABLE'] },
            },
          });
          if (!existing) {
            if (
              session.consultation?.updatedAt.toISOString() !==
              dto.expectedUpdatedAt
            )
              throw new ConflictException(
                'Consultation was updated. Reload before saving.',
              );
            const referral = await tx.internalReferral.create({
              data: {
                sourceConsultationId: existingConsultation.id,
                targetSpecialtyId: specialty.id,
                reason: `${dto.reason.trim()} [Chưa có khung giờ phù hợp]`,
                requestedDoctorId: dto.requestedDoctorId,
                priority: dto.priority,
                status: 'NO_SLOT_AVAILABLE',
              },
              select: { id: true },
            });
            await tx.consultation.update({
              where: { id: existingConsultation.id },
              data: { updatedAt: new Date() },
            });
            await this.auditLogs?.record(
              {
                actor: {
                  type: 'USER',
                  id: user.id,
                  name: user.name,
                  role: user.role as UserRole,
                },
                actionCode: 'EXAMINATION_REFERRAL_CREATED',
                module: 'EXAMINATIONS',
                targetType: 'INTERNAL_REFERRAL',
                targetId: referral.id,
                result: AuditLogResult.SUCCESS,
              },
              tx,
            );
          }
        },
        { isolationLevel: 'Serializable', timeout: 15000 },
      );
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        ['P2002', 'P2034'].includes(error.code)
      )
        throw new ConflictException('Referral was submitted concurrently');
      throw error;
    }
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
    const allergyRecords = session.appointment.patient.medicalRecords.filter(
      (record) => record.recordType === 'ALLERGY',
    );
    const historyRecords = session.appointment.patient.medicalRecords.filter(
      (record) => record.recordType === 'MEDICAL_HISTORY',
    );
    const lab = parseLabOrders(consultation?.labOrderNotes ?? null);
    const date = session.queueDate
      ? clinicDateString(session.queueDate)
      : clinicDateString();
    return {
      id: session.id,
      updatedAt:
        consultation?.updatedAt.toISOString() ??
        session.updatedAt.toISOString(),
      appointmentCode: session.appointment.appointmentCode,
      patientName: session.appointment.patient.fullName,
      patientCode: session.appointment.patient.patientCode,
      phone: session.appointment.patient.phone ?? '',
      nationalId: session.appointment.patient.nationalId ?? '',
      appointmentTime: new Intl.DateTimeFormat('vi-VN', {
        timeZone: 'Asia/Ho_Chi_Minh',
        hour: '2-digit',
        minute: '2-digit',
        hour12: false,
      }).format(session.appointmentSlot.startsAt),
      allergyDetails: allergyRecords
        .map((record) =>
          [record.description, record.reaction].filter(Boolean).join(' ? '),
        )
        .filter(Boolean)
        .join(' ? '),
      allergySeverity: allergyRecords[0]?.severity ?? '',
      historyConditions: historyRecords.map((record) => ({
        id: record.id,
        name: record.name,
        note: record.description ?? '',
        isConfirmed: record.status === 'CONFIRMED',
        status: record.status,
        updatedAt: record.updatedAt.toISOString(),
      })),
      allergyRecords: allergyRecords.map((record) => ({
        id: record.id,
        name: record.name,
        description: record.description ?? '',
        reaction: record.reaction ?? '',
        severity: record.severity,
        status: record.status,
        updatedAt: record.updatedAt.toISOString(),
      })),
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
      diagnosisNotes: primary?.notes ?? '',
      secondaryDiagnoses:
        consultation?.diagnoses
          .filter((diagnosis) => !diagnosis.isPrimary)
          .map((diagnosis) => ({
            code: diagnosis.diagnosisCode ?? '',
            name: diagnosis.diagnosisName,
          })) ?? [],
      prescription:
        typeof consultation?.prescription === 'string'
          ? consultation.prescription
          : parsePrescription(consultation?.prescription ?? null)
              .map(
                (item) =>
                  `${item.name} ${item.strength}: ${item.dose}, ${item.frequency}, ${item.days} ngày`,
              )
              .join('\n'),
      prescriptionItems: parsePrescription(consultation?.prescription ?? null),
      labOrders: lab.orders
        .map((order) =>
          typeof order.service === 'string' ? order.service : '',
        )
        .filter(Boolean)
        .join('; '),
      labReason: lab.reason,
      labNotes: lab.notes,
      labResults: Array.isArray(
        this.readLabData(consultation?.labOrderNotes ?? null).results,
      )
        ? this.readLabData(consultation?.labOrderNotes ?? null).results
        : [],
      followUpReason:
        typeof this.readLabData(consultation?.labOrderNotes ?? null)
          .followUpReason === 'string'
          ? this.readLabData(consultation?.labOrderNotes ?? null).followUpReason
          : '',
      patientAdvice:
        typeof this.readLabData(consultation?.labOrderNotes ?? null)
          .patientAdvice === 'string'
          ? this.readLabData(consultation?.labOrderNotes ?? null).patientAdvice
          : '',
      followUpDate: consultation?.followUpDate
        ? clinicDateString(consultation.followUpDate)
        : '',
      transfer: consultation?.outgoingReferrals[0]?.reason ?? '',
      surgicalHistory:
        typeof this.readLabData(consultation?.labOrderNotes ?? null)
          .surgicalHistory === 'string'
          ? this.readLabData(consultation?.labOrderNotes ?? null)
              .surgicalHistory
          : '',
      currentMedications:
        typeof this.readLabData(consultation?.labOrderNotes ?? null)
          .currentMedications === 'string'
          ? this.readLabData(consultation?.labOrderNotes ?? null)
              .currentMedications
          : '',
      riskFactors:
        typeof this.readLabData(consultation?.labOrderNotes ?? null)
          .riskFactors === 'string'
          ? this.readLabData(consultation?.labOrderNotes ?? null).riskFactors
          : '',
      isLocked: Boolean(consultation?.lockedAt),
    };
  }

  private prescription(
    dto: UpdateExaminationDto,
  ): Prisma.InputJsonValue | null {
    if (dto.prescriptionItems)
      return dto.prescriptionItems.map((item) => ({ ...item }));
    if (dto.prescriptionJson)
      return JSON.parse(dto.prescriptionJson) as Prisma.InputJsonValue;
    if (dto.prescription === undefined) return null;
    try {
      return JSON.parse(dto.prescription) as Prisma.InputJsonValue;
    } catch {
      return dto.prescription;
    }
  }

  private labNotes(dto: UpdateExaminationDto, existing?: string | null) {
    const previous = this.readLabData(existing ?? null);
    const orders = validateLabOrderInput(
      dto.labOrders,
      dto.labReason,
      dto.labNotes,
    );
    const reason =
      dto.labReason ??
      (typeof previous.reason === 'string' ? previous.reason : '');
    const notes =
      dto.labNotes ??
      (typeof previous.notes === 'string' ? previous.notes : '');
    return JSON.stringify({
      ...previous,
      ...(orders === null
        ? {}
        : {
            orders: orders.map((order) => ({
              service: order.service,
              purpose: order.purpose || reason,
              instructions: order.instructions || notes,
            })),
            reason,
            notes,
            orderedAt: previous.orderedAt ?? new Date().toISOString(),
          }),
      ...(dto.followUpReason === undefined
        ? {}
        : { followUpReason: dto.followUpReason }),
      ...(dto.patientAdvice === undefined
        ? {}
        : { patientAdvice: dto.patientAdvice }),
      ...(dto.surgicalHistory === undefined
        ? {}
        : { surgicalHistory: dto.surgicalHistory }),
      ...(dto.currentMedications === undefined
        ? {}
        : { currentMedications: dto.currentMedications }),
      ...(dto.riskFactors === undefined
        ? {}
        : { riskFactors: dto.riskFactors }),
    });
  }

  private readLabData(value: string | null): Record<string, unknown> {
    if (!value) return {};
    try {
      const parsed: unknown = JSON.parse(value);
      return typeof parsed === 'object' &&
        parsed !== null &&
        !Array.isArray(parsed)
        ? (parsed as Record<string, unknown>)
        : { notes: value };
    } catch {
      return { notes: value };
    }
  }

  private async assertDoctorWrite(careSessionId: string, user: CurrentUserDto) {
    if (user.role !== UserRole.DOCTOR)
      throw new ForbiddenException(
        'Only the assigned doctor may change an examination',
      );
    await this.queues.assertCanAccessSession(careSessionId, user);
  }

  private async transitionConsultation(
    careSessionId: string,
    expectedUpdatedAt: string,
    user: CurrentUserDto,
    transition: {
      from: CareSessionStatus;
      to: CareSessionStatus;
      action: string;
      reason: string;
    },
  ) {
    try {
      await this.prisma.$transaction(
        async (tx) => {
          const session = await tx.careSession.findUnique({
            where: { id: careSessionId },
            include: { consultation: true },
          });
          if (!session) throw new NotFoundException('Examination not found');
          if (session.consultation?.lockedAt)
            throw new ConflictException('Consultation is locked');
          if (session.status !== transition.from)
            throw new ConflictException(
              `Transition requires ${transition.from}`,
            );
          if (
            session.consultation?.updatedAt.toISOString() !== expectedUpdatedAt
          )
            throw new ConflictException(
              'Consultation was updated. Reload before saving.',
            );
          if (!session.consultation)
            throw new ConflictException('Consultation is missing');
          const labData = this.readLabData(session.consultation.labOrderNotes);
          const pauseEvents = readUnknownArray(labData.pauseEvents);
          const occurredAt = new Date();
          const updated = await tx.consultation.updateMany({
            where: {
              id: session.consultation.id,
              updatedAt: session.consultation.updatedAt,
              lockedAt: null,
            },
            data: {
              updatedAt: occurredAt,
              labOrderNotes: JSON.stringify({
                ...labData,
                pauseEvents: [
                  ...pauseEvents,
                  {
                    action: transition.action,
                    reason: transition.reason,
                    occurredAt: occurredAt.toISOString(),
                    actorId: user.id,
                  },
                ],
              }),
            },
          });
          if (updated.count !== 1)
            throw new ConflictException(
              'Consultation was updated concurrently',
            );
          const changed = await tx.careSession.updateMany({
            where: { id: careSessionId, status: transition.from },
            data: { status: transition.to },
          });
          if (changed.count !== 1)
            throw new ConflictException(
              'Examination status changed concurrently',
            );
          await this.auditTransition(
            tx,
            careSessionId,
            user,
            `EXAMINATION_${transition.action}`,
            transition.to,
          );
        },
        { isolationLevel: 'Serializable', timeout: 15000 },
      );
    } catch (error) {
      this.throwWriteConflict(error);
    }
  }

  private async auditTransition(
    tx: Prisma.TransactionClient,
    careSessionId: string,
    user: CurrentUserDto,
    actionCode: string,
    status: CareSessionStatus,
  ) {
    await this.auditLogs?.record(
      {
        actor: {
          type: 'USER',
          id: user.id,
          name: user.name,
          role: user.role as UserRole,
        },
        actionCode,
        module: 'EXAMINATIONS',
        targetType: 'CARE_SESSION',
        targetId: careSessionId,
        result: AuditLogResult.SUCCESS,
        after: { status },
      },
      tx,
    );
  }

  private throwWriteConflict(error: unknown): never {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      ['P2002', 'P2034'].includes(error.code)
    )
      throw new ConflictException('Examination was updated concurrently');
    throw error;
  }
}
