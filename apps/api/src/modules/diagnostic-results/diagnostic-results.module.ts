import { Module } from '@nestjs/common';
import { AuditLogsModule } from '../audit-logs/audit-logs.module';
import { ExaminationsModule } from '../examinations/examinations.module';
import { DatabaseModule } from '../database/database.module';
import { DiagnosticResultFilesService } from './diagnostic-result-files.service';
import { DiagnosticResultsController } from './diagnostic-results.controller';
import { DiagnosticResultsService } from './diagnostic-results.service';

@Module({
  imports: [DatabaseModule, AuditLogsModule, ExaminationsModule],
  controllers: [DiagnosticResultsController],
  providers: [DiagnosticResultsService, DiagnosticResultFilesService],
})
export class DiagnosticResultsModule {}
