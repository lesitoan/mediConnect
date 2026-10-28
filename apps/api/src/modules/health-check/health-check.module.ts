import { Module } from '@nestjs/common';
import { DatabaseModule } from '../database/database.module';
import { HealthCheckController } from './health-check.controller';
import { HealthCheckService } from './services/health-check.service';

@Module({
  imports: [DatabaseModule],
  controllers: [HealthCheckController],
  providers: [HealthCheckService],
})
export class HealthCheckModule {}
