import { Module } from '@nestjs/common';
import { PrismaModule } from '../../database/prisma.module';
import { HealthCheckController } from './health-check.controller';
import { HealthCheckService } from './health-check.service';

@Module({
  imports: [PrismaModule],
  controllers: [HealthCheckController],
  providers: [HealthCheckService],
})
export class HealthCheckModule {}
