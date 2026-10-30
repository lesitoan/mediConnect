import { Module } from '@nestjs/common';
import { AuditLogsModule } from '../audit-logs/audit-logs.module';
import { DatabaseModule } from '../database/database.module';
import { AdminSpecialtiesController } from './controllers/admin-specialties.controller';
import { PublicSpecialtiesController } from './controllers/public-specialties.controller';
import { SpecialtiesService } from './specialties.service';
import { PublicSpecialtiesController as AiPublicSpecialtiesController } from './public-specialties.controller';

@Module({
  imports: [DatabaseModule, AuditLogsModule],
  controllers: [
    AdminSpecialtiesController,
    AiPublicSpecialtiesController,
    PublicSpecialtiesController,
  ],
  providers: [SpecialtiesService],
  exports: [SpecialtiesService],
})
export class SpecialtiesModule {}
