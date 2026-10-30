import { Module } from '@nestjs/common';
import { DatabaseModule } from '../database/database.module';
import { PatientAppointmentsController } from './patient-appointments.controller';
import { AppointmentsRepository } from './appointments.repository';
import { AppointmentsService } from './appointments.service';

@Module({
  imports: [DatabaseModule],
  controllers: [PatientAppointmentsController],
  providers: [AppointmentsRepository, AppointmentsService],
  exports: [AppointmentsService],
})
export class AppointmentsModule {}
