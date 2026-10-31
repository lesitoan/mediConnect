import { Module } from '@nestjs/common';
import { DatabaseModule } from '../database/database.module';
import { MedicalRecordsService } from './medical-records.service';
import { PatientMedicalRecordsController } from './patient-medical-records.controller';

@Module({
  imports: [DatabaseModule],
  controllers: [PatientMedicalRecordsController],
  providers: [MedicalRecordsService],
})
export class MedicalRecordsModule {}
