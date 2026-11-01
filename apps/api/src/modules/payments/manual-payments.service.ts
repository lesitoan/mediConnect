import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { isUUID } from 'class-validator';
import {
  AuditLogResult,
  InvoiceStatus,
  PaymentTransactionProvider,
  PaymentTransactionStatus,
  PaymentTransactionType,
  Prisma,
  UserRole,
} from '../../generated/prisma/client';
import { AuditLogsService } from '../audit-logs/audit-logs.service';
import { PrismaService } from '../database/services/prisma.service';
import { sqlTable } from '../database/utils/sql-table';
import { InvoiceQueriesService } from '../invoices/invoice-queries.service';
import type { CurrentUserDto } from '../users/dto/responses/current-user.dto';
import { CreateManualPaymentDto } from './dto/staff/create-manual-payment.dto';

@Injectable()
export class ManualPaymentsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditLogsService,
    private readonly invoices: InvoiceQueriesService,
  ) {}

  async create(
    invoiceId: string,
    input: CreateManualPaymentDto,
    key: string | undefined,
    actor: CurrentUserDto,
  ) {
    invoiceId = invoiceId.toLowerCase();
    if (!/^[1-9]\d{0,11}$/.test(input.amount) || input.method !== 'CASH')
      throw new BadRequestException(
        'A positive whole-number VND amount and CASH method are required',
      );
    if (!key || !isUUID(key, '4'))
      throw new BadRequestException('Idempotency-Key must be a UUID v4');
    const idempotencyKey = `cash:${actor.id}:${key.toLowerCase()}`;
    const amount = new Prisma.Decimal(input.amount);
    const note = input.note?.trim() || null;
    return this.prisma.$transaction(
      async (tx) => {
        // Serialize retries across different invoices as well as the same invoice.
        await tx.$queryRaw`SELECT pg_advisory_xact_lock(hashtextextended(${idempotencyKey}, 0))::text`;
        const [locked] = await tx.$queryRaw<
          {
            id: string;
            status: InvoiceStatus;
            refundRequestedAt: Date | null;
            refundRequestedAmount: string | null;
          }[]
        >`
        SELECT id, status, refund_requested_at AS "refundRequestedAt", refund_requested_amount::text AS "refundRequestedAmount"
        FROM ${sqlTable(this.prisma.schemaName, 'invoices')}
        WHERE id = ${invoiceId}::uuid FOR UPDATE
      `;
        if (!locked) throw new NotFoundException('Invoice not found');
        const previous = await tx.paymentTransaction.findUnique({
          where: { idempotencyKey },
        });
        if (
          previous &&
          (previous.invoiceId !== invoiceId ||
            !previous.amount.equals(amount) ||
            previous.provider !== PaymentTransactionProvider.COUNTER ||
            previous.transactionType !== PaymentTransactionType.PAYMENT ||
            previous.status !== PaymentTransactionStatus.SUCCESS ||
            previous.processedBy !== actor.id ||
            previous.reconciliationNote !== note)
        )
          throw new ConflictException(
            'Idempotency-Key was already used for a different payment',
          );
        if (!previous) {
          const summary = await this.invoices.summary(tx, invoiceId);
          if (
            locked.status !== InvoiceStatus.OPEN ||
            locked.refundRequestedAt !== null ||
            locked.refundRequestedAmount !== null ||
            new Prisma.Decimal(summary.refundedAmount).gt(0)
          )
            throw new ConflictException(
              'Invoice is void or has a refund workflow; further collection is blocked',
            );
          if (amount.gt(summary.outstandingAmount))
            throw new ConflictException(
              'Payment exceeds the outstanding amount',
            );
        }
        const payment =
          previous ??
          (await tx.paymentTransaction.create({
            data: {
              invoiceId,
              idempotencyKey,
              amount,
              provider: PaymentTransactionProvider.COUNTER,
              transactionType: PaymentTransactionType.PAYMENT,
              status: PaymentTransactionStatus.SUCCESS,
              processedBy: actor.id,
              occurredAt: new Date(),
              reconciliationNote: note,
            },
          }));
        if (!previous)
          await this.audit.record(
            {
              actor: {
                type: 'USER',
                id: actor.id,
                name: actor.name,
                role: UserRole.RECEPTIONIST,
              },
              actionCode: 'MANUAL_PAYMENT_CREATE',
              module: 'PAYMENTS',
              targetType: 'PAYMENT_TRANSACTION',
              targetId: payment.id,
              result: AuditLogResult.SUCCESS,
              after: {
                invoiceId,
                amount: amount.toString(),
                provider: payment.provider,
              },
              ...(note ? { reason: note } : {}),
            },
            tx,
          );
        const summary = await this.invoices.summary(tx, invoiceId);
        return {
          created: !previous,
          payment: {
            transactionId: payment.id,
            receiptCode: payment.id,
            invoiceId,
            amount: payment.amount.toString(),
            provider: payment.provider,
            transactionType: payment.transactionType,
            status: payment.status,
            occurredAt: payment.occurredAt,
            totalAmount: summary.totalAmount,
            receivedAmount: summary.receivedAmount,
            refundedAmount: summary.refundedAmount,
            outstandingAmount: summary.outstandingAmount,
            overpaidAmount: summary.overpaidAmount,
            paymentStatus: summary.paymentStatus,
          },
        };
      },
      { isolationLevel: Prisma.TransactionIsolationLevel.ReadCommitted },
    );
  }
}
