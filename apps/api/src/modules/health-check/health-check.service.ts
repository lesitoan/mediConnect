import { Injectable, ServiceUnavailableException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';

@Injectable()
export class HealthCheckService {
  constructor(private readonly prisma: PrismaService) {}

  async check() {
    try {
      await this.prisma.$queryRaw`SELECT 1`;
      return { success: true, data: { status: 'OK' } };
    } catch {
      throw new ServiceUnavailableException('Database is unavailable');
    }
  }
}
