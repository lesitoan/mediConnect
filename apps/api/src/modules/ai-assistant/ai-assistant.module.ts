import { Module } from '@nestjs/common';
import { RedisModule } from '../redis/redis.module';
import { AiAssistantService } from './ai-assistant.service';
import { PublicAiAssistantController } from './public-ai-assistant.controller';

@Module({
  imports: [RedisModule],
  controllers: [PublicAiAssistantController],
  providers: [AiAssistantService],
})
export class AiAssistantModule {}
