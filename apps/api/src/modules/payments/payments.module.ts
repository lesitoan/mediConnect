import { Module } from '@nestjs/common';
import { AuditLogsModule } from '../audit-logs/audit-logs.module';
import { DatabaseModule } from '../database/database.module';
import { InvoicesModule } from '../invoices/invoices.module';
import { ManualPaymentsService } from './manual-payments.service';
import { StaffPaymentsController } from './staff-payments.controller';
import { SepayPaymentsService } from './sepay-payments.service';
import { SepayWebhooksController } from './sepay-webhooks.controller';
import { PatientPaymentsController } from './patient-payments.controller';

@Module({
  imports: [DatabaseModule, AuditLogsModule, InvoicesModule],
  controllers: [
    StaffPaymentsController,
    SepayWebhooksController,
    PatientPaymentsController,
  ],
  providers: [ManualPaymentsService, SepayPaymentsService],
})
export class PaymentsModule {}
