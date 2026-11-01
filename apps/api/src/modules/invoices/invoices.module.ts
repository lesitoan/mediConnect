import { Module } from '@nestjs/common';
import { AuditLogsModule } from '../audit-logs/audit-logs.module';
import { DatabaseModule } from '../database/database.module';
import { StaffInvoicesController } from './staff-invoices.controller';
import { InvoicesService } from './invoices.service';
import { InvoiceQueriesService } from './invoice-queries.service';

@Module({
  imports: [AuditLogsModule, DatabaseModule],
  controllers: [StaffInvoicesController],
  providers: [InvoicesService, InvoiceQueriesService],
  exports: [InvoiceQueriesService],
})
export class InvoicesModule {}
