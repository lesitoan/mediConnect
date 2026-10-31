import { Module } from '@nestjs/common';
import { AuditLogsModule } from '../audit-logs/audit-logs.module';
import { DatabaseModule } from '../database/database.module';
import { PatientProfilesController } from './patient-profiles.controller';
import { PatientsService } from './patients.service';

@Module({
  imports: [DatabaseModule, AuditLogsModule],
  controllers: [PatientProfilesController],
  providers: [PatientsService],
  exports: [PatientsService],
})
export class PatientsModule {}
