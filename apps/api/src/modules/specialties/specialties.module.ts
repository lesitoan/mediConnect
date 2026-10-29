import { Module } from '@nestjs/common';
import { DatabaseModule } from '../database/database.module';
import { SpecialtiesService } from './specialties.service';
import { PublicSpecialtiesController } from './public-specialties.controller';

@Module({
  imports: [DatabaseModule],
  controllers: [PublicSpecialtiesController],
  providers: [SpecialtiesService],
  exports: [SpecialtiesService],
})
export class SpecialtiesModule {}
