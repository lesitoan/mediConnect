import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  InternalServerErrorException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import {
  AuditLogResult,
  CareSessionStatus,
  UserRole,
} from '../../generated/prisma/client';
import { PrismaService } from '../database/services/prisma.service';
import { ExaminationsService } from '../examinations/examinations.service';
import type { RecordLabResultDto } from '../examinations/dto/record-lab-result.dto';
import type { CurrentUserDto } from '../users/dto/responses/current-user.dto';
import { DiagnosticOrderActionDto } from './dto/diagnostic-order-action.dto';
import { SaveDiagnosticResultDraftDto } from './dto/save-diagnostic-result-draft.dto';
import {
  DiagnosticResultFilesService,
  MAX_DIAGNOSTIC_IMAGES,
  type DiagnosticResultFile,
  type DiagnosticResultUpload,
} from './diagnostic-result-files.service';
import { AuditLogsService } from '../audit-logs/audit-logs.service';

type LabData = Record<string, unknown> & {
  orders?: unknown[];
  resultFiles?: unknown[];
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function readLabData(value: string | null): LabData {
  if (!value) return {};
  try {
    const parsed: unknown = JSON.parse(value);
    return isRecord(parsed) ? parsed : { notes: value };
  } catch {
    return { notes: value };
  }
}

function readOrders(data: LabData): Record<string, unknown>[] {
  return Array.isArray(data.orders) ? data.orders.filter(isRecord) : [];
}

function readFiles(data: LabData): (DiagnosticResultFile & { orderRef: string })[] {
  return Array.isArray(data.resultFiles)
    ? data.resultFiles.filter(
        (file): file is DiagnosticResultFile & { orderRef: string } =>
          isRecord(file) &&
          typeof file.id === 'string' &&
          typeof file.name === 'string' &&
          typeof file.mimeType === 'string' &&
          typeof file.size === 'number' &&
          typeof file.uploadedAt === 'string' &&
          typeof file.orderRef === 'string',
      )
    : [];
}

function findOrderIndex(
  orders: Record<string, unknown>[],
  orderRef: string,
): number {
  return orders.findIndex(
    (order) => order.service === orderRef || order.orderRef === orderRef,
  );
}

function getOrderStatus(
  data: LabData,
  order: Record<string, unknown>,
): 'WAITING' | 'IN_PROGRESS' | 'COMPLETED' {
  if (
    order.status === 'WAITING' ||
    order.status === 'IN_PROGRESS' ||
    order.status === 'COMPLETED'
  )
    return order.status;
  const hasResult = Array.isArray(data.results)
    ? data.results.some(
        (result) => isRecord(result) && result.orderRef === order.service,
      )
    : false;
  return hasResult ? 'COMPLETED' : 'WAITING';
}

@Injectable()
export class DiagnosticResultsService {
  private readonly logger = new Logger(DiagnosticResultsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly auditLogs: AuditLogsService,
    private readonly files: DiagnosticResultFilesService,
    private readonly examinations: ExaminationsService,
  ) {}

  async list(date: string | undefined, user: CurrentUserDto) {
    const examinations = await this.examinations.listDiagnosticQueue(
      date,
      user,
    );
    return examinations.flatMap((examination) => {
      const canProcess =
        !examination.isLocked &&
        (examination.status === 'IN_PROGRESS' ||
          examination.status === 'WAITING_RESULTS');
      return (examination.labOrderItems ?? [])
        .filter((order) => canProcess || order.status === 'COMPLETED')
        .map((order) => ({
          ...order,
          careSessionId: examination.id,
          examinationCode: examination.appointmentCode,
          patientName: examination.patientName,
          patientCode: examination.patientCode,
          demographics: examination.demographics,
          room: examination.room,
          reason: order.purpose || examination.labReason || '',
          instructions: order.instructions || examination.labNotes || '',
          expectedUpdatedAt: examination.updatedAt,
        }));
    });
  }

  async receive(
    careSessionId: string,
    orderRef: string,
    expectedUpdatedAt: string,
    user: CurrentUserDto,
  ) {
    await this.assertAccess(careSessionId, user);
    return this.prisma.$transaction(
      async (tx) => {
        const session = await tx.careSession.findUnique({
          where: { id: careSessionId },
          include: { consultation: true },
        });
        if (!session) throw new NotFoundException('Không tìm thấy lượt khám.');
        this.assertSessionCanReceive(session.status, session.consultation);
        this.assertExpectedVersion(
          session.consultation.updatedAt,
          expectedUpdatedAt,
        );
        const data = readLabData(session.consultation.labOrderNotes);
        const orders = readOrders(data);
        const orderIndex = findOrderIndex(orders, orderRef);
        if (orderIndex < 0)
          throw new BadRequestException(
            'orderRef does not match an ordered service',
          );
        const order = orders[orderIndex];
        const status = getOrderStatus(data, order);
        if (status === 'IN_PROGRESS')
          return {
            updatedAt: session.consultation.updatedAt.toISOString(),
            status: 'IN_PROGRESS' as const,
          };
        if (status === 'COMPLETED')
          throw new ConflictException('Chỉ định đã hoàn tất.');

        const receivedAt = new Date().toISOString();
        const nextOrders = orders.map((entry, index) =>
          index === orderIndex
            ? {
                ...entry,
                status: 'IN_PROGRESS',
                receivedAt,
                receivedBy: user.id,
              }
            : entry,
        );
        const updated = await tx.consultation.update({
          where: { id: session.consultation.id },
          data: { labOrderNotes: JSON.stringify({ ...data, orders: nextOrders }) },
        });
        await this.auditLogs.record(
          {
            actor: {
              type: 'USER',
              id: user.id,
              name: user.name,
              role: user.role as UserRole,
            },
            actionCode: 'DIAGNOSTIC_ORDER_RECEIVED',
            module: 'DIAGNOSTIC_RESULTS',
            targetType: 'CARE_SESSION',
            targetId: careSessionId,
            result: AuditLogResult.SUCCESS,
            after: { orderRef, status: 'IN_PROGRESS' },
          },
          tx,
        );
        return {
          updatedAt: updated.updatedAt.toISOString(),
          status: 'IN_PROGRESS' as const,
        };
      },
      { isolationLevel: 'Serializable', timeout: 15000 },
    );
  }

  async saveDraft(
    careSessionId: string,
    dto: SaveDiagnosticResultDraftDto,
    user: CurrentUserDto,
  ) {
    await this.assertAccess(careSessionId, user);
    return this.prisma.$transaction(
      async (tx) => {
        const session = await tx.careSession.findUnique({
          where: { id: careSessionId },
          include: { consultation: true },
        });
        if (!session) throw new NotFoundException('Không tìm thấy lượt khám.');
        this.assertSessionCanReceive(session.status, session.consultation);
        this.assertExpectedVersion(
          session.consultation.updatedAt,
          dto.expectedUpdatedAt,
        );
        const data = readLabData(session.consultation.labOrderNotes);
        const orders = readOrders(data);
        const orderIndex = findOrderIndex(orders, dto.orderRef);
        if (orderIndex < 0)
          throw new BadRequestException(
            'orderRef does not match an ordered service',
          );
        if (getOrderStatus(data, orders[orderIndex]) !== 'IN_PROGRESS')
          throw new ConflictException(
            'Chỉ có thể lưu nháp cho chỉ định đang thực hiện.',
          );
        if (orders[orderIndex].draftResult === dto.result)
          return { updatedAt: session.consultation.updatedAt.toISOString() };

        const nextOrders = orders.map((order, index) =>
          index === orderIndex
            ? { ...order, draftResult: dto.result }
            : order,
        );
        const updated = await tx.consultation.update({
          where: { id: session.consultation.id },
          data: {
            labOrderNotes: JSON.stringify({ ...data, orders: nextOrders }),
          },
        });
        return { updatedAt: updated.updatedAt.toISOString() };
      },
      { isolationLevel: 'Serializable', timeout: 15000 },
    );
  }

  async uploadFiles(
    careSessionId: string,
    dto: DiagnosticOrderActionDto,
    uploads: DiagnosticResultUpload[],
    user: CurrentUserDto,
  ) {
    await this.assertAccess(careSessionId, user);
    if (!uploads.length)
      throw new BadRequestException('Chưa chọn ảnh kết quả.');
    if (uploads.length > MAX_DIAGNOSTIC_IMAGES)
      throw new BadRequestException('Mỗi chỉ định được đính kèm tối đa 6 ảnh.');

    const stored: DiagnosticResultFile[] = [];
    try {
      for (const upload of uploads) stored.push(await this.files.store(upload));
      const saved = await this.prisma.$transaction(
        async (tx) => {
          const session = await tx.careSession.findUnique({
            where: { id: careSessionId },
            include: { consultation: true },
          });
          if (!session)
            throw new NotFoundException('Không tìm thấy lượt khám.');
          this.assertSessionCanReceive(session.status, session.consultation);
          this.assertExpectedVersion(
            session.consultation.updatedAt,
            dto.expectedUpdatedAt,
          );
          const data = readLabData(session.consultation.labOrderNotes);
          const orders = readOrders(data);
          const orderIndex = findOrderIndex(orders, dto.orderRef);
          if (orderIndex < 0)
            throw new BadRequestException(
              'orderRef does not match an ordered service',
            );
          if (getOrderStatus(data, orders[orderIndex]) !== 'IN_PROGRESS')
            throw new ConflictException('Tiếp nhận chỉ định trước khi tải ảnh.');

          const existingFiles = readFiles(data);
          const orderFileCount = existingFiles.filter(
            (file) => file.orderRef === dto.orderRef,
          ).length;
          if (orderFileCount + stored.length > MAX_DIAGNOSTIC_IMAGES)
            throw new BadRequestException(
              'Mỗi chỉ định được đính kèm tối đa 6 ảnh.',
            );

          const resultFiles = [
            ...existingFiles,
            ...stored.map((file) => ({ ...file, orderRef: dto.orderRef })),
          ];
          const updated = await tx.consultation.update({
            where: { id: session.consultation.id },
            data: {
              labOrderNotes: JSON.stringify({ ...data, resultFiles }),
            },
          });
          await this.auditLogs.record(
            {
              actor: {
                type: 'USER',
                id: user.id,
                name: user.name,
                role: user.role as UserRole,
              },
              actionCode: 'DIAGNOSTIC_RESULT_FILES_UPLOADED',
              module: 'DIAGNOSTIC_RESULTS',
              targetType: 'CARE_SESSION',
              targetId: careSessionId,
              result: AuditLogResult.SUCCESS,
              after: { orderRef: dto.orderRef, filesAdded: stored.length },
            },
            tx,
          );
          return updated.updatedAt.toISOString();
        },
        { isolationLevel: 'Serializable', timeout: 15000 },
      );
      return { updatedAt: saved, files: stored };
    } catch (error) {
      let cleanupFailed = false;
      for (const file of stored) {
        try {
          await this.files.remove(file.id, file.mimeType);
        } catch (cleanupError) {
          cleanupFailed = true;
          this.logger.error(
            `Failed to remove unattached diagnostic result file ${file.id}`,
            cleanupError instanceof Error ? cleanupError.stack : undefined,
          );
        }
      }
      if (cleanupFailed)
        throw new InternalServerErrorException(
          'Không thể dọn tệp kết quả sau khi lưu thất bại.',
        );
      throw error;
    }
  }

  async removeFile(
    careSessionId: string,
    fileId: string,
    dto: DiagnosticOrderActionDto,
    user: CurrentUserDto,
  ) {
    await this.assertAccess(careSessionId, user);
    const sessionRecord = await this.prisma.careSession.findUnique({
      where: { id: careSessionId },
      include: { consultation: true },
    });
    if (!sessionRecord)
      throw new NotFoundException('Không tìm thấy lượt khám.');
    this.assertSessionCanReceive(
      sessionRecord.status,
      sessionRecord.consultation,
    );
    this.assertExpectedVersion(
      sessionRecord.consultation.updatedAt,
      dto.expectedUpdatedAt,
    );
    const data = readLabData(sessionRecord.consultation.labOrderNotes);
    const orders = readOrders(data);
    const orderIndex = findOrderIndex(orders, dto.orderRef);
    if (orderIndex < 0)
      throw new BadRequestException(
        'orderRef does not match an ordered service',
      );
    if (getOrderStatus(data, orders[orderIndex]) !== 'IN_PROGRESS')
      throw new ConflictException('Chỉ có thể xóa ảnh của bản nháp.');
    const resultFiles = readFiles(data);
    const targetFile = resultFiles.find(
      (entry) => entry.id === fileId && entry.orderRef === dto.orderRef,
    );
    if (!targetFile) throw new NotFoundException('Không tìm thấy tệp kết quả.');
    const buffer = await this.files.read(targetFile.id, targetFile.mimeType);
    await this.files.remove(targetFile.id, targetFile.mimeType);

    try {
      const updatedAt = await this.prisma.$transaction(
        async (tx) => {
          const session = await tx.careSession.findUnique({
            where: { id: careSessionId },
            include: { consultation: true },
          });
          if (!session)
            throw new NotFoundException('Không tìm thấy lượt khám.');
          this.assertSessionCanReceive(session.status, session.consultation);
          this.assertExpectedVersion(
            session.consultation.updatedAt,
            dto.expectedUpdatedAt,
          );
          const currentData = readLabData(
            session.consultation.labOrderNotes,
          );
          const currentOrders = readOrders(currentData);
          const currentOrderIndex = findOrderIndex(
            currentOrders,
            dto.orderRef,
          );
          if (currentOrderIndex < 0)
            throw new BadRequestException(
              'orderRef does not match an ordered service',
            );
          if (
            getOrderStatus(currentData, currentOrders[currentOrderIndex]) !==
            'IN_PROGRESS'
          )
            throw new ConflictException('Chỉ có thể xóa ảnh của bản nháp.');
          const currentFiles = readFiles(currentData);
          const currentFile = currentFiles.find(
            (entry) => entry.id === fileId && entry.orderRef === dto.orderRef,
          );
          if (!currentFile)
            throw new NotFoundException('Không tìm thấy tệp kết quả.');
          const updated = await tx.consultation.update({
            where: { id: session.consultation.id },
            data: {
              labOrderNotes: JSON.stringify({
                ...currentData,
                resultFiles: currentFiles.filter(
                  (entry) => entry.id !== fileId,
                ),
              }),
            },
          });
          await this.auditLogs.record(
            {
              actor: {
                type: 'USER',
                id: user.id,
                name: user.name,
                role: user.role as UserRole,
              },
              actionCode: 'DIAGNOSTIC_RESULT_FILE_REMOVED',
              module: 'DIAGNOSTIC_RESULTS',
              targetType: 'CARE_SESSION',
              targetId: careSessionId,
              result: AuditLogResult.SUCCESS,
              after: { orderRef: dto.orderRef, fileId },
            },
            tx,
          );
          return updated.updatedAt.toISOString();
        },
        { isolationLevel: 'Serializable', timeout: 15000 },
      );
      return { updatedAt };
    } catch (error) {
      try {
        await this.files.restore(targetFile.id, targetFile.mimeType, buffer);
      } catch (restoreError) {
        this.logger.error(
          `Failed to restore diagnostic result file ${targetFile.id}`,
          restoreError instanceof Error ? restoreError.stack : undefined,
        );
        throw new InternalServerErrorException(
          'Không thể khôi phục tệp kết quả sau khi xóa thất bại.',
        );
      }
      throw error;
    }
  }

  async readFile(
    careSessionId: string,
    orderRef: string,
    fileId: string,
    user: CurrentUserDto,
  ) {
    await this.assertAccess(careSessionId, user);
    const session = await this.prisma.careSession.findUnique({
      where: { id: careSessionId },
      include: { consultation: true },
    });
    if (!session) throw new NotFoundException('Không tìm thấy lượt khám.');
    if (!session.consultation)
      throw new NotFoundException('Không tìm thấy kết quả CLS.');
    const data = readLabData(session.consultation.labOrderNotes);
    if (findOrderIndex(readOrders(data), orderRef) < 0)
      throw new NotFoundException('Không tìm thấy chỉ định CLS.');
    const file = readFiles(data).find(
      (entry) => entry.id === fileId && entry.orderRef === orderRef,
    );
    if (!file) throw new NotFoundException('Không tìm thấy tệp kết quả.');
    return {
      ...file,
      buffer: await this.files.read(file.id, file.mimeType),
    };
  }

  async complete(
    careSessionId: string,
    dto: RecordLabResultDto,
    user: CurrentUserDto,
  ) {
    await this.assertAccess(careSessionId, user);
    const session = await this.prisma.careSession.findUnique({
      where: { id: careSessionId },
      include: { consultation: true },
    });
    if (!session) throw new NotFoundException('Không tìm thấy lượt khám.');
    this.assertSessionCanReceive(session.status, session.consultation);
    this.assertExpectedVersion(
      session.consultation.updatedAt,
      dto.expectedUpdatedAt,
    );
    const data = readLabData(session.consultation.labOrderNotes);
    const orders = readOrders(data);
    const orderIndex = findOrderIndex(orders, dto.orderRef);
    if (orderIndex < 0)
      throw new BadRequestException(
        'orderRef does not match an ordered service',
      );
    if (orders[orderIndex].status !== 'IN_PROGRESS')
      throw new ConflictException('Tiếp nhận chỉ định trước khi trả kết quả.');
    return this.examinations.recordLabResult(careSessionId, dto, user);
  }

  private async assertAccess(
    careSessionId: string,
    user: CurrentUserDto,
  ): Promise<void> {
    if (
      user.role !== UserRole.DOCTOR &&
      user.role !== UserRole.ADMIN &&
      user.role !== UserRole.RECEPTIONIST
    )
      throw new ForbiddenException('Bạn không có quyền xử lý kết quả CLS.');
    if (user.role !== UserRole.RECEPTIONIST)
      await this.examinations.get(careSessionId, user);
  }

  private assertSessionCanReceive(
    status: CareSessionStatus,
    consultation: { lockedAt: Date | null; updatedAt: Date } | null,
  ): asserts consultation is { lockedAt: Date | null; updatedAt: Date } {
    if (!consultation)
      throw new ConflictException('Phiên khám chưa có chỉ định CLS.');
    if (consultation.lockedAt)
      throw new ConflictException('Phiên khám đã khóa.');
    if (
      status !== CareSessionStatus.WAITING_LAB &&
      status !== CareSessionStatus.IN_CONSULTATION
    )
      throw new ConflictException(
        'Chỉ có thể xử lý kết quả khi phiên khám đang chờ hoặc đang khám.',
      );
  }

  private assertExpectedVersion(
    updatedAt: Date,
    expectedUpdatedAt: string,
  ): void {
    if (!expectedUpdatedAt)
      throw new BadRequestException(['expectedUpdatedAt should not be empty']);
    if (updatedAt.toISOString() !== expectedUpdatedAt)
      throw new ConflictException(
        'Phiên khám đã được cập nhật. Tải lại trước khi lưu.',
      );
  }
}