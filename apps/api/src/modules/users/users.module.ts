import { Module } from '@nestjs/common';
import { DatabaseModule } from '../database/database.module';
import { UsersController } from './users.controller';
import { UsersRepository } from './users.repository';
import { UsersService } from './services/users.service';
import { UserSessionsService } from './services/user-sessions.service';
import { AuditLogsModule } from '../audit-logs/audit-logs.module';

@Module({
  imports: [DatabaseModule, AuditLogsModule],
  controllers: [UsersController],
  providers: [UsersRepository, UsersService, UserSessionsService],
  exports: [UsersService, UserSessionsService],
})
export class UsersModule {}
