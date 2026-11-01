import { Module } from '@nestjs/common';
import { DatabaseModule } from '../database/database.module';
import { QueuesModule } from '../queues/queues.module';
import { ExaminationsController } from './examinations.controller';
import { ExaminationsService } from './examinations.service';

@Module({
  imports: [DatabaseModule, QueuesModule],
  controllers: [ExaminationsController],
  providers: [ExaminationsService],
})
export class ExaminationsModule {}
