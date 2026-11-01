import { Module } from '@nestjs/common';
import { DatabaseModule } from '../database/database.module';
import { PatientAppointmentsController } from './patient-appointments.controller';
import { AppointmentsRepository } from './appointments.repository';
import { AppointmentsService } from './appointments.service';
import { SchedulesModule } from '../schedules/schedules.module';

@Module({
  imports: [DatabaseModule, SchedulesModule],
  controllers: [PatientAppointmentsController],
  providers: [AppointmentsRepository, AppointmentsService],
  exports: [AppointmentsService],
})
export class AppointmentsModule {}
