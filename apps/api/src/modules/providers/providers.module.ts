import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { DatabaseModule } from '../database/database.module';
import { AuditLogsModule } from '../audit-logs/audit-logs.module';
import { AdminDoctorsController } from './controllers/admin-doctors.controller';
import { PublicDoctorsController } from './controllers/public-doctors.controller';
import { ProvidersService } from './providers.service';
import { UsersModule } from '../users/users.module';
import { SpecialtiesModule } from '../specialties/specialties.module';
import { PublicProvidersController } from './public-providers.controller';
import { AdminDoctorAvatarsController } from './controllers/admin-doctor-avatars.controller';
import { DoctorAvatarsService } from './doctor-avatars.service';

@Module({
  imports: [
    ConfigModule,
    DatabaseModule,
    AuditLogsModule,
    UsersModule,
    SpecialtiesModule,
  ],
  controllers: [
    AdminDoctorsController,
    AdminDoctorAvatarsController,
    PublicProvidersController,
    PublicDoctorsController,
  ],
  providers: [ProvidersService, DoctorAvatarsService],
  exports: [ProvidersService],
})
export class ProvidersModule {}
