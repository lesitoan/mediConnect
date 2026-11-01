import { Module } from '@nestjs/common';
import { DatabaseModule } from '../database/database.module';
import { SchedulesModule } from '../schedules/schedules.module';
import { ReceptionController } from './reception.controller';
import { ReceptionService } from './reception.service';

@Module({
  imports: [DatabaseModule, SchedulesModule],
  controllers: [ReceptionController],
  providers: [ReceptionService],
})
export class ReceptionModule {}
