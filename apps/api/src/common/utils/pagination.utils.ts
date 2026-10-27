import { GET_API_CONFIG } from '../../configs/get-api.config';
import type { PaginationDto } from '../dto/pagination.dto';
import type { PaginationResponseDto } from '../dto/pagination-response.dto';
import type { IPaginationQuery } from '../interfaces/pagination-query.interface';

export class PaginationUtils implements IPaginationQuery {
  skip = 0;
  take: number = GET_API_CONFIG.defaultLimitPage;

  extractSkipTakeFromPagination(pagination: PaginationDto): this {
    const { page, limit } = pagination;
    const skip = (page - 1) * limit;
    if (
      !Number.isSafeInteger(page) ||
      page < 1 ||
      !Number.isSafeInteger(limit) ||
      limit < 1 ||
      limit > GET_API_CONFIG.maxLimitPage ||
      !Number.isSafeInteger(skip)
    ) {
      throw new RangeError('Invalid pagination');
    }
    this.skip = skip;
    this.take = limit;
    return this;
  }

  convertPaginationResponseDtoFromTotalRecords(
    totalRecords: number,
  ): PaginationResponseDto {
    if (!Number.isSafeInteger(totalRecords) || totalRecords < 0) {
      throw new RangeError('Invalid total record count');
    }
    return {
      totalItems: totalRecords,
      itemsPerPage: this.take,
      currentPage: Math.floor(this.skip / this.take) + 1,
      totalPages: Math.ceil(totalRecords / this.take),
    };
  }
}
