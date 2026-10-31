import { Module } from '@nestjs/common';
import { DatabaseModule } from '../database/database.module';
import { AdminAuditLogsController } from './admin-audit-logs.controller';
import { AuditLogsService } from './audit-logs.service';

@Module({
  imports: [DatabaseModule],
  controllers: [AdminAuditLogsController],
  providers: [AuditLogsService],
  exports: [AuditLogsService],
})
export class AuditLogsModule {}
