import { Module } from '@nestjs/common';
import { DatabaseModule } from '../database/database.module';
import { QueuesController } from './queues.controller';
import { QueuesService } from './queues.service';

@Module({
  imports: [DatabaseModule],
  controllers: [QueuesController],
  providers: [QueuesService],
})
export class QueuesModule {}
