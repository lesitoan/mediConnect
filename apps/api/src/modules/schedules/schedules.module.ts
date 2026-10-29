import { Module } from '@nestjs/common';
import { DatabaseModule } from '../database/database.module';
import { SchedulesService } from './schedules.service';
import { PublicSchedulesController } from './public-schedules.controller';

@Module({
  imports: [DatabaseModule],
  controllers: [PublicSchedulesController],
  providers: [SchedulesService],
})
export class SchedulesModule {}
