import { Injectable } from '@nestjs/common';
import { Prisma } from '../../generated/prisma/client';
import { PublicSearchQueryDto } from '../../common/dto/public-search-query.dto';
import { normalizeSearch } from '../../common/utils/normalize-search';
import { PrismaService } from '../database/services/prisma.service';
import { sqlTable } from '../database/utils/sql-table';

@Injectable()
export class ProvidersService {
  constructor(private readonly prisma: PrismaService) {}

  async search(query: PublicSearchQueryDto) {
    let nameIds: string[] | undefined;
    if (query.q?.trim()) {
      // Parameterized SQL supports accent-insensitive names without a DB extension.
      const term = normalizeSearch(query.q).replace(/[\\%_]/g, '\\$&');
      const matches = await this.prisma.$queryRaw<{ id: string }[]>(Prisma.sql`
        SELECT d.id FROM ${sqlTable(this.prisma.schemaName, 'doctors')} d
        JOIN ${sqlTable(this.prisma.schemaName, 'users')} u ON u.id = d.user_id
        WHERE translate(lower(u.full_name),
          'àáạảãâầấậẩẫăằắặẳẵèéẹẻẽêềếệểễìíịỉĩòóọỏõôồốộổỗơờớợởỡùúụủũưừứựửữỳýỵỷỹđ',
          'aaaaaaaaaaaaaaaaaeeeeeeeeeeeiiiiiooooooooooooooooouuuuuuuuuuuyyyyyd')
          LIKE ${`%${term}%`}
      `);
      nameIds = matches.map((item) => item.id);
    }
    const where: Prisma.DoctorWhereInput = {
      isActive: true,
      specialty: { isActive: true },
      user: { status: 'ACTIVE', deletedAt: null },
      ...(query.specialtyId ? { specialtyId: query.specialtyId } : {}),
      ...(query.doctorId ? { id: query.doctorId } : {}),
      ...(nameIds ? { AND: [{ id: { in: nameIds } }] } : {}),
    };
    const [items, total] = await Promise.all([
      this.prisma.doctor.findMany({
        where,
        skip: (query.page - 1) * query.limit,
        take: query.limit,
        orderBy: [{ user: { fullName: 'asc' } }, { id: 'asc' }],
        select: {
          id: true,
          doctorCode: true,
          academicTitle: true,
          qualification: true,
          bio: true,
          avatarUrl: true,
          user: { select: { fullName: true } },
          specialty: { select: { id: true, name: true, roomCode: true } },
        },
      }),
      this.prisma.doctor.count({ where }),
    ]);
    return {
      items: items.map(({ user, ...doctor }) => ({
        ...doctor,
        fullName: user.fullName,
      })),
      total,
      page: query.page,
      limit: query.limit,
    };
  }
}
