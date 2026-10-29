import { Module } from '@nestjs/common';
import { DatabaseModule } from '../database/database.module';
import { ProvidersService } from './providers.service';
import { PublicProvidersController } from './public-providers.controller';

@Module({
  imports: [DatabaseModule],
  controllers: [PublicProvidersController],
  providers: [ProvidersService],
})
export class ProvidersModule {}
