import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  AuditLogResult,
  CareSessionStatus,
  Prisma,
  UserRole,
} from '../../generated/prisma/client';
import { clinicDate, clinicDateString } from '../../common/utils/clinic-date';
import { PrismaService } from '../database/services/prisma.service';
import { AuditLogsService } from '../audit-logs/audit-logs.service';
import {
  DoctorAvatarsService,
  type DoctorAvatarFile,
} from '../providers/doctor-avatars.service';
import { ExaminationsService } from '../examinations/examinations.service';
import type { CurrentUserDto } from '../users/dto/responses/current-user.dto';
import type { DiagnosticResultsQueryDto } from './dto/diagnostic-results-query.dto';
import type { RecordLabResultDto } from '../examinations/dto/record-lab-result.dto';

function readData(value: string | null): Record<string, unknown> {
  if (!value) return {};
  try {
    const parsed: unknown = JSON.parse(value);
    return typeof parsed === 'object' &&
      parsed !== null &&
      !Array.isArray(parsed)
      ? (parsed as Record<string, unknown>)
      : {};
  } catch {
    return {};
  }
}
function records(value: unknown): Record<string, unknown>[] {
  return Array.isArray(value)
    ? value.filter(
        (item): item is Record<string, unknown> =>
          typeof item === 'object' && item !== null && !Array.isArray(item),
      )
    : [];
}
function age(value: Date | null): number | null {
  if (!value) return null;
  const today = clinicDateString().split('-').map(Number);
  const birth = clinicDateString(value).split('-').map(Number);
  return (
    today[0] -
    birth[0] -
    (today[1] < birth[1] || (today[1] === birth[1] && today[2] < birth[2])
      ? 1
      : 0)
  );
}
function category(service: string): 'LAB' | 'IMAGING' | 'FUNCTION' {
  const value = service.toLocaleLowerCase('vi');
  return value.includes('siêu âm') ||
    value.includes('x-quang') ||
    value.includes('ct') ||
    value.includes('mri')
    ? 'IMAGING'
    : value.includes('điện') || value.includes('đo ')
      ? 'FUNCTION'
      : 'LAB';
}

@Injectable()
export class DiagnosticResultsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditLogsService,
    private readonly cloudinary: DoctorAvatarsService,
    private readonly examinations: ExaminationsService,
  ) {}

  async list(query: DiagnosticResultsQueryDto) {
    const day = clinicDate(query.date || undefined);
    const sessions = await this.prisma.careSession.findMany({
      where: {
        status: {
          in: [
            CareSessionStatus.WAITING_LAB,
            CareSessionStatus.IN_CONSULTATION,
          ],
        },
        queueDate: day,
      },
      include: {
        consultation: true,
        appointment: { include: { patient: true } },
        specialty: true,
        appointmentSlot: {
          include: {
            doctorSchedule: {
              include: { doctor: { include: { user: true } } },
            },
          },
        },
      },
    });
    const normalized = (query.search ?? '').trim().toLocaleLowerCase('vi');
    const items = sessions.flatMap((session) => {
      const data = readData(session.consultation?.labOrderNotes ?? null);
      const orders = records(data.orders);
      const results = records(data.results);
      return orders
        .map((order, index) => {
          const service =
            typeof order.service === 'string' ? order.service : '';
          const status =
            order.status === 'COMPLETED'
              ? 'COMPLETED'
              : order.status === 'IN_PROGRESS'
                ? 'IN_PROGRESS'
                : 'WAITING';
          const doctor =
            session.appointmentSlot.doctorSchedule.doctor.user.fullName;
          const savedResult = results.find(
            (entry) =>
              entry.orderRef === service || entry.orderRef === order.orderRef,
          );
          const item = {
            id: `${session.id}::${index}`,
            careSessionId: session.id,
            consultationId: session.consultation?.id ?? '',
            expectedUpdatedAt:
              session.consultation?.updatedAt.toISOString() ?? '',
            visit: {
              careSessionId: session.id,
              examinationCode: session.appointment.appointmentCode,
              patientName: session.appointment.patient.fullName,
              patientCode: session.appointment.patient.patientCode,
              demographics: `${session.appointment.patient.gender ?? 'OTHER'} · ${age(session.appointment.patient.dateOfBirth) ?? '-'} tuổi`,
              room: session.specialty.roomCode,
              reason:
                typeof order.purpose === 'string' && order.purpose
                  ? order.purpose
                  : typeof data.reason === 'string'
                    ? data.reason
                    : '',
              instructions:
                typeof order.instructions === 'string'
                  ? order.instructions
                  : typeof data.notes === 'string'
                    ? data.notes
                    : '',
            },
            service,
            serviceCode: 'CLS',
            category: category(service),
            status,
            orderedAt:
              typeof data.orderedAt === 'string'
                ? data.orderedAt
                : (session.consultation?.createdAt.toISOString() ??
                  session.createdAt.toISOString()),
            conclusion: typeof order.result === 'string' ? order.result : '',
            images: records(savedResult?.images) as never[],
            completedAt:
              typeof order.completedAt === 'string'
                ? order.completedAt
                : undefined,
            recordedBy:
              typeof order.recordedByName === 'string'
                ? order.recordedByName
                : undefined,
            doctor,
            specialty: session.specialty.name,
            queueNumber: session.queueNumber,
          };
          return item;
        })
        .filter(
          (item) =>
            (!query.status ||
              query.status === 'ALL' ||
              item.status === query.status) &&
            (!query.category ||
              query.category === 'ALL' ||
              item.category === query.category) &&
            (!normalized ||
              [
                item.visit.patientName,
                item.visit.patientCode,
                item.visit.examinationCode,
                item.visit.reason,
                item.visit.room,
                item.service,
                item.serviceCode,
                item.doctor,
                item.specialty,
              ].some((value) =>
                value.toLocaleLowerCase('vi').includes(normalized),
              )),
        );
    });
    const total = items.length;
    return {
      items: items.slice(
        (query.page - 1) * query.pageSize,
        query.page * query.pageSize,
      ),
      pagination: {
        page: query.page,
        pageSize: query.pageSize,
        total,
        totalPages: Math.ceil(total / query.pageSize),
      },
    };
  }

  async detail(careSessionId: string, orderRef: string) {
    const found = await this.readOrder(careSessionId, orderRef);
    const session = await this.prisma.careSession.findUnique({
      where: { id: careSessionId },
      include: {
        appointment: { include: { patient: true } },
        specialty: true,
        appointmentSlot: {
          include: {
            doctorSchedule: {
              include: { doctor: { include: { user: true } } },
            },
          },
        },
      },
    });
    if (!session) throw new NotFoundException('Diagnostic order not found');
    const order = found.order;
    const savedResult = records(found.data.results).find(
      (entry) =>
        entry.orderRef === orderRef ||
        entry.orderRef === order.service ||
        entry.orderRef === order.orderRef,
    );
    return {
      id: `${careSessionId}::${found.index}`,
      careSessionId,
      consultationId: found.session.consultation?.id,
      expectedUpdatedAt: found.session.consultation?.updatedAt.toISOString(),
      orderRef:
        typeof order.orderRef === 'string'
          ? order.orderRef
          : typeof order.service === 'string'
            ? order.service
            : orderRef,
      service: typeof order.service === 'string' ? order.service : '',
      reason:
        typeof order.purpose === 'string'
          ? order.purpose
          : typeof found.data.reason === 'string'
            ? found.data.reason
            : '',
      instructions:
        typeof order.instructions === 'string'
          ? order.instructions
          : typeof found.data.notes === 'string'
            ? found.data.notes
            : '',
      status:
        order.status === 'COMPLETED'
          ? 'COMPLETED'
          : order.status === 'IN_PROGRESS'
            ? 'IN_PROGRESS'
            : 'WAITING',
      images: records(savedResult?.images),
      conclusion: typeof order.result === 'string' ? order.result : '',
      visit: {
        careSessionId,
        examinationCode: session.appointment.appointmentCode,
        patientName: session.appointment.patient.fullName,
        patientCode: session.appointment.patient.patientCode,
        demographics: `${session.appointment.patient.gender ?? 'OTHER'} · ${age(session.appointment.patient.dateOfBirth) ?? '-'} tuổi`,
        room: session.specialty.roomCode,
        reason: typeof order.purpose === 'string' ? order.purpose : '',
      },
      doctor: session.appointmentSlot.doctorSchedule.doctor.user.fullName,
      specialty: session.specialty.name,
    };
  }

  async receive(
    careSessionId: string,
    orderRef: string,
    expectedUpdatedAt: string,
    user: CurrentUserDto,
  ) {
    await this.updateOrder(
      careSessionId,
      orderRef,
      expectedUpdatedAt,
      user,
      (order) => {
        if (order.status === 'COMPLETED')
          throw new ConflictException(
            'Completed order cannot be received again',
          );
        if (order.status === 'IN_PROGRESS') return order;
        return {
          ...order,
          status: 'IN_PROGRESS',
          receivedAt: new Date().toISOString(),
          receivedBy: user.id,
        };
      },
      'DIAGNOSTIC_ORDER_RECEIVED',
    );
    return this.detail(careSessionId, orderRef);
  }

  async upload(
    careSessionId: string,
    orderRef: string,
    expectedUpdatedAt: string,
    file: DoctorAvatarFile,
    user: CurrentUserDto,
  ) {
    const existing = await this.readOrder(careSessionId, orderRef);
    if (existing.session.consultation?.lockedAt)
      throw new ConflictException('Consultation is locked');
    if (existing.order.status !== 'IN_PROGRESS')
      throw new ConflictException(
        'Order must be received before it can be changed',
      );
    if (
      existing.session.consultation?.updatedAt.toISOString() !==
      expectedUpdatedAt
    )
      throw new ConflictException(
        'Consultation was updated. Reload before saving.',
      );
    if (records(existing.result?.images).length >= 6)
      throw new BadRequestException(
        'A diagnostic order can contain at most six images',
      );
    const asset = await this.cloudinary.uploadDiagnosticImage(file);
    try {
      await this.updateOrder(
        careSessionId,
        orderRef,
        expectedUpdatedAt,
        user,
        (order) => ({
          ...order,
          images: [
            ...records(order.images),
            {
              ...asset,
              name: file.originalname ?? 'diagnostic-image',
              uploadedAt: new Date().toISOString(),
              uploadedBy: user.id,
            },
          ],
        }),
        'DIAGNOSTIC_IMAGE_UPLOADED',
      );
    } catch (error) {
      await this.cloudinary.deleteDiagnosticImage(asset.publicId);
      throw error;
    }
    return this.detail(careSessionId, orderRef);
  }

  async removeImage(
    careSessionId: string,
    orderRef: string,
    publicId: string,
    expectedUpdatedAt: string,
    user: CurrentUserDto,
  ) {
    const current = await this.readOrder(careSessionId, orderRef);
    const image = records(current.result?.images).find(
      (entry) => entry.publicId === publicId,
    );
    if (!image) throw new NotFoundException('Diagnostic image not found');
    await this.updateOrder(
      careSessionId,
      orderRef,
      expectedUpdatedAt,
      user,
      (order) => ({
        ...order,
        images: records(order.images).filter(
          (entry) => entry.publicId !== publicId,
        ),
      }),
      'DIAGNOSTIC_IMAGE_REMOVED',
    );
    await this.cloudinary.deleteDiagnosticImage(publicId);
    return this.detail(careSessionId, orderRef);
  }

  async complete(
    careSessionId: string,
    dto: RecordLabResultDto,
    user: CurrentUserDto,
  ) {
    if (!dto.expectedUpdatedAt)
      throw new BadRequestException(['expectedUpdatedAt should not be empty']);
    const found = await this.readOrder(careSessionId, dto.orderRef);
    if (found.order.status !== 'IN_PROGRESS')
      throw new ConflictException('Order must be received before completion');
    if (!records(found.result?.images).length)
      throw new ConflictException('At least one result image is required');
    const resultDto: RecordLabResultDto = {
      ...dto,
      source: 'DIAGNOSTIC_RESULTS',
      images: records(found.result?.images) as never[],
      completeOrder: true,
    };
    return this.examinations.recordLabResult(careSessionId, resultDto, user);
  }

  private async readOrder(careSessionId: string, orderRef: string) {
    const session = await this.prisma.careSession.findUnique({
      where: { id: careSessionId },
      include: { consultation: true },
    });
    if (!session || !session.consultation)
      throw new NotFoundException('Diagnostic order not found');
    const data = readData(session.consultation.labOrderNotes);
    const orders = records(data.orders);
    const index = orders.findIndex(
      (item) => item.orderRef === orderRef || item.service === orderRef,
    );
    if (index < 0)
      throw new BadRequestException(
        'orderRef does not match an ordered service',
      );
    const result = records(data.results).find(
      (entry) =>
        entry.orderRef === orderRef ||
        entry.orderRef === orders[index].service ||
        entry.orderRef === orders[index].orderRef,
    );
    return { session, data, orders, order: orders[index], result, index };
  }

  private async updateOrder(
    careSessionId: string,
    orderRef: string,
    expectedUpdatedAt: string,
    user: CurrentUserDto,
    update: (order: Record<string, unknown>) => Record<string, unknown>,
    actionCode: string,
  ) {
    if (!expectedUpdatedAt)
      throw new BadRequestException(['expectedUpdatedAt should not be empty']);
    try {
      await this.prisma.$transaction(
        async (tx) => {
          const found = await tx.careSession.findUnique({
            where: { id: careSessionId },
            include: { consultation: true },
          });
          if (!found?.consultation)
            throw new NotFoundException('Diagnostic order not found');
          if (found.consultation.lockedAt)
            throw new ConflictException('Consultation is locked');
          if (
            found.status !== CareSessionStatus.WAITING_LAB &&
            found.status !== CareSessionStatus.IN_CONSULTATION
          )
            throw new ConflictException(
              'Care session status does not allow diagnostic updates',
            );
          const data = readData(found.consultation.labOrderNotes);
          const orders = records(data.orders);
          const index = orders.findIndex(
            (item) => item.orderRef === orderRef || item.service === orderRef,
          );
          if (index < 0)
            throw new BadRequestException(
              'orderRef does not match an ordered service',
            );
          if (
            actionCode === 'DIAGNOSTIC_ORDER_RECEIVED' &&
            orders[index].status === 'IN_PROGRESS'
          )
            return;
          if (found.consultation.updatedAt.toISOString() !== expectedUpdatedAt)
            throw new ConflictException(
              'Consultation was updated. Reload before saving.',
            );
          const results = records(data.results);
          const resultIndex = results.findIndex(
            (entry) =>
              entry.orderRef === orderRef ||
              entry.orderRef === orders[index].service ||
              entry.orderRef === orders[index].orderRef,
          );
          const nextOrder = update({
            ...orders[index],
            images: records(resultIndex < 0 ? [] : results[resultIndex].images),
          });
          if (
            JSON.stringify(nextOrder) ===
            JSON.stringify({
              ...orders[index],
              images: records(
                resultIndex < 0 ? [] : results[resultIndex].images,
              ),
            })
          )
            return;
          if (
            actionCode !== 'DIAGNOSTIC_ORDER_RECEIVED' &&
            orders[index].status !== 'IN_PROGRESS'
          )
            throw new ConflictException(
              'Order must be received before it can be changed',
            );
          if (
            actionCode === 'DIAGNOSTIC_IMAGE_UPLOADED' ||
            actionCode === 'DIAGNOSTIC_IMAGE_REMOVED'
          ) {
            const previous = resultIndex < 0 ? {} : results[resultIndex];
            const nextResult = {
              ...previous,
              orderRef,
              result:
                typeof previous.result === 'string' ? previous.result : '',
              source:
                typeof previous.source === 'string'
                  ? previous.source
                  : 'DIAGNOSTIC_RESULTS',
              returnedAt:
                typeof previous.returnedAt === 'string'
                  ? previous.returnedAt
                  : new Date().toISOString(),
              recordedBy:
                typeof previous.recordedBy === 'string'
                  ? previous.recordedBy
                  : user.id,
              images: records(nextOrder.images),
            };
            if (resultIndex < 0) results.push(nextResult);
            else results[resultIndex] = nextResult;
          } else {
            orders[index] = nextOrder;
          }
          await tx.consultation.update({
            where: { id: found.consultation.id },
            data: {
              labOrderNotes: JSON.stringify({ ...data, orders, results }),
            },
          });
          await this.audit.record(
            {
              actor: {
                type: 'USER',
                id: user.id,
                name: user.name,
                role: user.role as UserRole,
              },
              actionCode,
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
        throw new ConflictException(
          'Diagnostic order was updated concurrently',
        );
      throw error;
    }
    return this.readOrder(careSessionId, orderRef);
  }
}
