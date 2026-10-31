import {
  BadRequestException,
  Injectable,
  NotFoundException,
  ServiceUnavailableException,
  UnprocessableEntityException,
} from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import {
  AuditActorType,
  AuditLogResult,
  Prisma,
  UserRole,
} from '../../generated/prisma/client';
import { PaginationUtils } from '../../common/utils/pagination.utils';
import { PrismaService } from '../database/services/prisma.service';
import {
  AUDIT_ACTION_LABELS,
  getAuditActionLabel,
} from './constants/audit-actions.constant';
import {
  AuditLogFilterDto,
  AuditLogQueryDto,
} from './dto/admin/audit-log-filter.dto';

type AuditActor =
  | { type: 'USER'; id: string; name: string; role: UserRole }
  | { type: 'SYSTEM' | 'ANONYMOUS' };

type Snapshot = Record<string, string | number | boolean | null>;

export interface AuditEvent {
  actor: AuditActor;
  actionCode: string;
  module: string;
  targetType: string;
  targetId?: string;
  result: AuditLogResult;
  reason?: string;
  before?: Snapshot;
  after?: Snapshot;
  idempotencyKey?: string;
  source?: 'API' | 'SYSTEM';
}

const SUMMARY_SELECT = {
  id: true,
  occurredAt: true,
  actorType: true,
  actorUserId: true,
  actorDisplayName: true,
  actorRole: true,
  actionCode: true,
  module: true,
  targetType: true,
  targetId: true,
  result: true,
} satisfies Prisma.AuditLogSelect;

const SENSITIVE_FIELD =
  /password|secret|token|cookie|otp|authorization|clinical|diagnos|prescription|medical|allergy|symptom|webhook|(?:^|\.)nationalId$/i;
const DAY_MS = 86_400_000;

function validateSnapshot(snapshot?: Snapshot): void {
  for (const [key, value] of Object.entries(snapshot ?? {})) {
    if (
      !/^[a-zA-Z][a-zA-Z0-9_.]{0,99}$/.test(key) ||
      SENSITIVE_FIELD.test(key) ||
      (value !== null &&
        !['string', 'number', 'boolean'].includes(typeof value)) ||
      (typeof value === 'number' && !Number.isFinite(value)) ||
      (typeof value === 'string' && value.length > 255)
    ) {
      throw new BadRequestException(
        'Invalid or sensitive audit snapshot field',
      );
    }
  }
}

function csvCell(value: string | Date | null): string {
  let text = value instanceof Date ? value.toISOString() : (value ?? '');
  text = Array.from(text)
    .filter((char) => char.charCodeAt(0) >= 32 || /\s/.test(char))
    .join('');
  if (/^\s*[=+\-@]/.test(text)) text = `'${text}`;
  return `"${text.replace(/"/g, '""')}"`;
}

@Injectable()
export class AuditLogsService {
  constructor(private readonly prisma: PrismaService) {}

  async record(
    event: AuditEvent,
    tx?: Prisma.TransactionClient,
  ): Promise<void> {
    validateSnapshot(event.before);
    validateSnapshot(event.after);
    if (event.reason && event.reason.length > 500)
      throw new BadRequestException('Audit reason is too long');
    const actor = event.actor;
    await (tx ?? this.prisma).auditLog.create({
      data: {
        actorType: actor.type as AuditActorType,
        ...(actor.type === 'USER'
          ? {
              actorUserId: actor.id,
              actorDisplayName: actor.name,
              actorRole: actor.role,
            }
          : {}),
        actionCode: event.actionCode,
        module: event.module,
        targetType: event.targetType,
        targetId: event.targetId,
        result: event.result,
        reason: event.reason,
        ...(event.before ? { beforeSnapshot: event.before } : {}),
        ...(event.after ? { afterSnapshot: event.after } : {}),
        source: event.source ?? (actor.type === 'SYSTEM' ? 'SYSTEM' : 'API'),
        idempotencyKey: event.idempotencyKey ?? randomUUID(),
      },
    });
  }

  private where(
    filter: AuditLogFilterDto,
    isExport = false,
  ): Prisma.AuditLogWhereInput {
    if (filter.targetId && !filter.targetType)
      throw new BadRequestException('Target type is required with target ID');
    if (
      !!filter.startDate !== !!filter.endDate ||
      (isExport && !filter.startDate)
    )
      throw new BadRequestException(
        'Start and end dates are required together',
      );
    const today = new Date(Date.now() + 7 * 60 * 60 * 1000)
      .toISOString()
      .slice(0, 10);
    const endDate = filter.endDate ?? today;
    const end = new Date(`${endDate}T00:00:00+07:00`);
    const start = filter.startDate
      ? new Date(`${filter.startDate}T00:00:00+07:00`)
      : new Date(end.getTime() - 6 * DAY_MS);
    const days = (end.getTime() - start.getTime()) / DAY_MS + 1;
    if (!Number.isFinite(days) || days < 1 || days > (isExport ? 31 : 366))
      throw new BadRequestException('Invalid date range');
    const search = filter.search?.trim();
    const searchLower = search?.toLowerCase() ?? '';
    const actionCodes = search
      ? Object.entries(AUDIT_ACTION_LABELS)
          .filter(([, label]) => label.toLowerCase().includes(searchLower))
          .map(([code]) => code)
      : [];
    return {
      occurredAt: { gte: start, lt: new Date(end.getTime() + DAY_MS) },
      ...(filter.actorType ? { actorType: filter.actorType } : {}),
      ...(filter.actorUserId ? { actorUserId: filter.actorUserId } : {}),
      ...(filter.actionCode ? { actionCode: filter.actionCode } : {}),
      ...(filter.module ? { module: filter.module } : {}),
      ...(filter.targetType ? { targetType: filter.targetType } : {}),
      ...(filter.targetId ? { targetId: filter.targetId } : {}),
      ...(filter.result ? { result: filter.result } : {}),
      ...(search
        ? {
            OR: [
              {
                actorDisplayName: {
                  contains: search,
                  mode: 'insensitive',
                },
              },
              { actionCode: { contains: search, mode: 'insensitive' } },
              { targetId: { contains: search, mode: 'insensitive' } },
              ...(actionCodes.length
                ? [{ actionCode: { in: actionCodes } }]
                : []),
              ...['Hệ thống', 'Khách vãng lai'].flatMap(
                (label, index): Prisma.AuditLogWhereInput[] =>
                  label.toLowerCase().includes(searchLower)
                    ? [
                        {
                          actorType: index === 0 ? 'SYSTEM' : 'ANONYMOUS',
                          actorDisplayName: null,
                        },
                      ]
                    : [],
              ),
              {
                targetId: null,
                targetType: { contains: search, mode: 'insensitive' },
              },
            ],
          }
        : {}),
    };
  }

  async list(query: AuditLogQueryDto) {
    const page = new PaginationUtils().extractSkipTakeFromPagination(query);
    const where = this.where(query);
    const [items, total] = await this.prisma.$transaction([
      this.prisma.auditLog.findMany({
        where,
        select: SUMMARY_SELECT,
        skip: page.skip,
        take: page.take,
        orderBy: [{ occurredAt: 'desc' }, { id: 'desc' }],
      }),
      this.prisma.auditLog.count({ where }),
    ]);
    return {
      items: items.map((item) => ({
        ...item,
        actionLabel: getAuditActionLabel(item.actionCode),
      })),
      pagination: page.convertPaginationResponseDtoFromTotalRecords(total),
    };
  }

  async filterOptions(filter: AuditLogFilterDto) {
    const where = this.where({
      startDate: filter.startDate,
      endDate: filter.endDate,
    });
    const [actors, actions] = await Promise.all([
      this.prisma.auditLog.groupBy({
        by: ['actorType', 'actorUserId', 'actorDisplayName'],
        where,
        _max: { occurredAt: true },
        orderBy: { _max: { occurredAt: 'desc' } },
      }),
      this.prisma.auditLog.groupBy({
        by: ['actionCode'],
        where,
        orderBy: { actionCode: 'asc' },
      }),
    ]);
    const options = new Map<string, { value: string; label: string }>();
    for (const actor of actors) {
      const key =
        actor.actorType === 'USER'
          ? `USER:${actor.actorUserId}`
          : actor.actorType;
      if (!options.has(key))
        options.set(key, {
          value: key,
          label:
            actor.actorDisplayName ||
            (actor.actorType === 'SYSTEM' ? 'Hệ thống' : 'Khách vãng lai'),
        });
    }
    return {
      actors: [...options.values()],
      actions: actions.map(({ actionCode }) => ({
        value: actionCode,
        label: getAuditActionLabel(actionCode),
      })),
    };
  }

  async get(id: string) {
    const item = await this.prisma.auditLog.findUnique({
      where: { id },
      select: {
        ...SUMMARY_SELECT,
        reason: true,
        beforeSnapshot: true,
        afterSnapshot: true,
      },
    });
    if (!item) throw new NotFoundException('Audit log not found');
    return { ...item, actionLabel: getAuditActionLabel(item.actionCode) };
  }

  async export(
    filter: AuditLogFilterDto,
    actor: Extract<AuditActor, { type: 'USER' }>,
  ): Promise<Buffer> {
    const items = await this.prisma.auditLog.findMany({
      where: this.where(filter, true),
      select: { ...SUMMARY_SELECT, reason: true },
      take: 10001,
      orderBy: [{ occurredAt: 'desc' }, { id: 'desc' }],
    });
    if (!items.length)
      throw new UnprocessableEntityException('No audit logs to export');
    if (items.length > 10000)
      throw new UnprocessableEntityException('Audit export limit exceeded');
    const columns = [
      'id',
      'occurredAt',
      'actorType',
      'actorUserId',
      'actorDisplayName',
      'actorRole',
      'actionCode',
      'module',
      'targetType',
      'targetId',
      'result',
      'reason',
    ] as const;
    const lines = [
      columns.map(csvCell).join(','),
      ...items.map((item) =>
        columns.map((key) => csvCell(item[key])).join(','),
      ),
    ];
    const file = Buffer.from(`\uFEFF${lines.join('\r\n')}\r\n`, 'utf8');
    try {
      await this.record({
        actor,
        actionCode: 'EXPORT_AUDIT_LOG',
        module: 'AUDIT_LOGS',
        targetType: 'AUDIT_LOG',
        result: AuditLogResult.SUCCESS,
        after: {
          count: items.length,
          startDate: filter.startDate!,
          endDate: filter.endDate!,
          ...(filter.actorType ? { actorType: filter.actorType } : {}),
          ...(filter.actorUserId ? { actorUserId: filter.actorUserId } : {}),
          ...(filter.actionCode ? { actionCode: filter.actionCode } : {}),
          ...(filter.module ? { module: filter.module } : {}),
          ...(filter.targetType ? { targetType: filter.targetType } : {}),
          ...(filter.targetId ? { targetId: filter.targetId } : {}),
          ...(filter.result ? { result: filter.result } : {}),
          ...(filter.search ? { search: filter.search } : {}),
        },
      });
    } catch {
      throw new ServiceUnavailableException('Audit log is unavailable');
    }
    return file;
  }
}
