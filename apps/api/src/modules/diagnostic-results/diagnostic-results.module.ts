import { Module } from '@nestjs/common';
import { DatabaseModule } from '../database/database.module';
import { AuditLogsModule } from '../audit-logs/audit-logs.module';
import { ProvidersModule } from '../providers/providers.module';
import { ExaminationsModule } from '../examinations/examinations.module';
import { DiagnosticResultsController } from './diagnostic-results.controller';
import { DiagnosticResultsService } from './diagnostic-results.service';

@Module({
  imports: [
    DatabaseModule,
    AuditLogsModule,
    ProvidersModule,
    ExaminationsModule,
  ],
  controllers: [DiagnosticResultsController],
  providers: [DiagnosticResultsService],
})
export class DiagnosticResultsModule {}
