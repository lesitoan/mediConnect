import { Module } from '@nestjs/common';
import { AuditLogsModule } from '../audit-logs/audit-logs.module';
import { DatabaseModule } from '../database/database.module';
import { ProvidersModule } from '../providers/providers.module';
import { AdminUsersController } from './controllers/admin-users.controller';
import { AdminUsersService } from './services/admin-users.service';
import { UsersModule } from './users.module';
import { PatientsModule } from '../patients/patients.module';

// Keep account and doctor administration wired without circular imports.
@Module({
  imports: [
    UsersModule,
    ProvidersModule,
    DatabaseModule,
    AuditLogsModule,
    PatientsModule,
  ],
  controllers: [AdminUsersController],
  providers: [AdminUsersService],
})
export class AdminUsersModule {}
