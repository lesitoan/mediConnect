import { Injectable } from '@nestjs/common';
import { PublicSearchQueryDto } from '../../common/dto/public-search-query.dto';
import { normalizeSearch } from '../../common/utils/normalize-search';
import { PrismaService } from '../database/services/prisma.service';

@Injectable()
export class SpecialtiesService {
  constructor(private readonly prisma: PrismaService) {}

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
