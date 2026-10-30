import { PublicSearchQueryDto } from '../../common/dto/public-search-query.dto';
import { normalizeSearch } from '../../common/utils/normalize-search';
import { sqlTable } from '../database/utils/sql-table';
import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  AuditLogResult,
  Prisma,
  UserRole,
} from '../../generated/prisma/client';
import { PaginationUtils } from '../../common/utils/pagination.utils';
import { AuditLogsService } from '../audit-logs/audit-logs.service';
import { PrismaService } from '../database/services/prisma.service';
import type { CurrentUserDto } from '../users/dto/responses/current-user.dto';
import { CreateSpecialtyDto } from './dto/admin/create-specialty.dto';
import { UpdateSpecialtyDto } from './dto/admin/update-specialty.dto';
import { SpecialtyQueryDto } from './dto/specialty-query.dto';

const SPECIALTY_SELECT = {
  id: true,
  code: true,
  name: true,
  roomCode: true,
  description: true,
  isActive: true,
  createdAt: true,
  updatedAt: true,
} satisfies Prisma.SpecialtySelect;

@Injectable()
export class SpecialtiesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditLogsService,
  ) {}

  async list(query: SpecialtyQueryDto, isAdmin: boolean) {
    const page = new PaginationUtils().extractSkipTakeFromPagination(query);
    const where: Prisma.SpecialtyWhereInput = {
      ...(isAdmin ? {} : { isActive: true }),
      ...(query.search
        ? {
            OR: [
              { code: { contains: query.search, mode: 'insensitive' } },
              { name: { contains: query.search, mode: 'insensitive' } },
            ],
          }
        : {}),
    };
    const [items, total] = await this.prisma.$transaction([
      this.prisma.specialty.findMany({
        where,
        select: SPECIALTY_SELECT,
        skip: page.skip,
        take: page.take,
        orderBy: [{ name: 'asc' }, { id: 'asc' }],
      }),
      this.prisma.specialty.count({ where }),
    ]);
    return {
      items,
      pagination: page.convertPaginationResponseDtoFromTotalRecords(total),
    };
  }

  listForDoctors() {
    return this.prisma.specialty.findMany({
      select: {
        id: true,
        code: true,
        name: true,
        description: true,
        roomCode: true,
        isActive: true,
      },
      orderBy: [{ name: 'asc' }, { id: 'asc' }],
    });
  }

  async get(id: string, isAdmin: boolean) {
    const specialty = await this.prisma.specialty.findFirst({
      where: { id, ...(isAdmin ? {} : { isActive: true }) },
      select: SPECIALTY_SELECT,
    });
    if (!specialty) throw new NotFoundException('Specialty not found');
    return specialty;
  }

  async lock(tx: Prisma.TransactionClient, id: string) {
    const rows = await tx.$queryRaw<
      { id: string; isActive: boolean }[]
    >`SELECT id, is_active AS "isActive" FROM ${sqlTable(this.prisma.schemaName, 'specialties')} WHERE id = ${id}::uuid FOR UPDATE`;
    if (!rows.length) throw new NotFoundException('Specialty not found');
    return rows[0];
  }

  async create(input: CreateSpecialtyDto, actor: CurrentUserDto) {
    return this.prisma.$transaction(async (tx) => {
      const item = await tx.specialty.create({
        data: input,
        select: SPECIALTY_SELECT,
      });
      await this.audit.record(
        {
          actor: {
            type: 'USER',
            id: actor.id,
            name: actor.name,
            role: UserRole.ADMIN,
          },
          actionCode: 'SPECIALTY_CREATE',
          module: 'SPECIALTIES',
          targetType: 'SPECIALTY',
          targetId: item.id,
          result: AuditLogResult.SUCCESS,
          after: {
            code: item.code,
            name: item.name,
            roomCode: item.roomCode,
            isActive: item.isActive,
            descriptionProvided: !!item.description,
          },
        },
        tx,
      );
      return item;
    });
  }

  async update(id: string, input: UpdateSpecialtyDto, actor: CurrentUserDto) {
    if (!Object.keys(input).length)
      throw new BadRequestException('No changes supplied');
    return this.prisma.$transaction(async (tx) => {
      await this.lock(tx, id);
      const before = await tx.specialty.findUniqueOrThrow({
        where: { id },
        select: SPECIALTY_SELECT,
      });
      if (
        !(['code', 'name', 'roomCode', 'description'] as const).some(
          (field) =>
            input[field] !== undefined && input[field] !== before[field],
        )
      )
        return before;
      const item = await tx.specialty.update({
        where: { id },
        data: input,
        select: SPECIALTY_SELECT,
      });
      const oldValues: Record<string, string | boolean> = {};
      const newValues: Record<string, string | boolean> = {};
      for (const field of ['code', 'name', 'roomCode'] as const) {
        if (before[field] !== item[field]) {
          oldValues[field] = before[field];
          newValues[field] = item[field];
        }
      }
      if (before.description !== item.description) {
        oldValues.descriptionChanged = false;
        newValues.descriptionChanged = true;
      }
      if (Object.keys(newValues).length)
        await this.audit.record(
          {
            actor: {
              type: 'USER',
              id: actor.id,
              name: actor.name,
              role: UserRole.ADMIN,
            },
            actionCode: 'SPECIALTY_UPDATE',
            module: 'SPECIALTIES',
            targetType: 'SPECIALTY',
            targetId: id,
            result: AuditLogResult.SUCCESS,
            before: oldValues,
            after: newValues,
          },
          tx,
        );
      return item;
    });
  }

  async setStatus(id: string, isActive: boolean, actor: CurrentUserDto) {
    return this.prisma.$transaction(async (tx) => {
      const current = await this.lock(tx, id);
      if (current.isActive === isActive)
        return tx.specialty.findUniqueOrThrow({
          where: { id },
          select: SPECIALTY_SELECT,
        });
      if (
        !isActive &&
        (await tx.doctor.findFirst({
          where: {
            specialtyId: id,
            isActive: true,
            leaveRequests: {
              none: {
                source: 'ADMIN_PAUSE',
                status: 'APPROVED',
                startsAt: { lte: new Date() },
                endsAt: null,
              },
            },
          },
          select: { id: true },
        }))
      )
        throw new ConflictException(
          'Resolve active doctors and temporary pauses before pausing this specialty',
        );
      const item = await tx.specialty.update({
        where: { id },
        data: { isActive },
        select: SPECIALTY_SELECT,
      });
      await this.audit.record(
        {
          actor: {
            type: 'USER',
            id: actor.id,
            name: actor.name,
            role: UserRole.ADMIN,
          },
          actionCode: isActive ? 'SPECIALTY_ACTIVATE' : 'SPECIALTY_DEACTIVATE',
          module: 'SPECIALTIES',
          targetType: 'SPECIALTY',
          targetId: id,
          result: AuditLogResult.SUCCESS,
          before: { isActive: current.isActive },
          after: { isActive },
        },
        tx,
      );
      return item;
    });
  }
  async search(query: PublicSearchQueryDto) {
    const items = await this.prisma.specialty.findMany({
      where: {
        isActive: true,
        ...(query.specialtyId ? { id: query.specialtyId } : {}),
      },
      select: {
        id: true,
        code: true,
        name: true,
        description: true,
        roomCode: true,
      },
      orderBy: { name: 'asc' },
    });
    const term = normalizeSearch(query.q ?? '')
      .replace(/\b(khoa|chuyen)\b/g, '')
      .replace(/\s+/g, ' ')
      .trim();
    const matches = items.filter((item) =>
      normalizeSearch(`${item.name} ${item.code}`).includes(term),
    );
    const offset = (query.page - 1) * query.limit;
    return {
      items: matches.slice(offset, offset + query.limit),
      total: matches.length,
      page: query.page,
      limit: query.limit,
    };
  }
}
