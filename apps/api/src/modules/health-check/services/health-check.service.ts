import { Injectable, ServiceUnavailableException } from '@nestjs/common';
import { PrismaService } from '../../database/services/prisma.service';
import { HttpResponseBodySuccessDto } from '../../../common/dto/http-response-body-success.dto';

@Injectable()
export class HealthCheckService {
  constructor(private readonly prisma: PrismaService) {}

  async check() {
    try {
      await this.prisma.$queryRaw`SELECT 1`;
      return new HttpResponseBodySuccessDto({ status: 'OK' });
    } catch {
      throw new ServiceUnavailableException('Database is unavailable');
    }
  }
}
