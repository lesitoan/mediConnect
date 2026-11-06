import { Module } from '@nestjs/common';
import { DatabaseModule } from '../database/database.module';
import { AuditLogsModule } from '../audit-logs/audit-logs.module';
import { AdminScheduleExceptionsController } from './admin-schedule-exceptions.controller';
import {
  AdminSchedulesController,
  AdminLeaveRequestsController,
} from './admin-schedules.controller';
import {
  StaffSchedulesController,
  StaffLeaveRequestsController,
} from './staff-schedules.controller';
import { SchedulesRepository } from './schedules.repository';
import { SchedulesService } from './schedules.service';
import { PublicSchedulesController } from './public-schedules.controller';
import { PatientScheduleExceptionsController } from './patient-schedule-exceptions.controller';
import { ScheduleExceptionWorkflowService } from './schedule-exception-workflow.service';

@Module({
  imports: [DatabaseModule, AuditLogsModule],
  controllers: [
    PublicSchedulesController,
    AdminSchedulesController,
    AdminLeaveRequestsController,
    AdminScheduleExceptionsController,
    StaffSchedulesController,
    StaffLeaveRequestsController,
    PatientScheduleExceptionsController,
  ],
  providers: [
    SchedulesRepository,
    SchedulesService,
    ScheduleExceptionWorkflowService,
  ],
  exports: [SchedulesService],
})
export class SchedulesModule {}
