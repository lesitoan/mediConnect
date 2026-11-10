import {
  ConflictException,
  Injectable,
  NotFoundException,
  ServiceUnavailableException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createHash } from 'node:crypto';
import {
  AuditLogResult,
  PaymentTransactionStatus,
  Prisma,
  UserRole,
} from '../../generated/prisma/client';
import { AuditLogsService } from '../audit-logs/audit-logs.service';
import { PrismaService } from '../database/services/prisma.service';
import { sqlTable } from '../database/utils/sql-table';
import { InvoiceQueriesService } from '../invoices/invoice-queries.service';
import type { CurrentUserDto } from '../users/dto/responses/current-user.dto';
import { matchesSepayBankAccount, normalizeBank } from './sepay-bank.utils';
import {
  extractInvoiceCode,
  parseSepayPayload,
  verifySepaySignature,
} from './sepay-webhook.utils';

@Injectable()
export class SepayPaymentsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly config: ConfigService,
    private readonly invoices: InvoiceQueriesService,
    private readonly audit: AuditLogsService,
  ) {}

  private async lock(tx: Prisma.TransactionClient, id: string) {
    const rows = await tx.$queryRaw<
      { id: string }[]
    >`SELECT id FROM ${sqlTable(this.prisma.schemaName, 'invoices')} WHERE id = ${id}::uuid FOR UPDATE`;
    if (!rows.length) throw new NotFoundException('Invoice not found');
    return tx.invoice.findUniqueOrThrow({ where: { id } });
  }

  async qr(id: string, actor: CurrentUserDto, patient: boolean) {
    return this.prisma.$transaction(
      async (tx) => {
        if (
          patient &&
          !(await tx.invoice.findFirst({
            where: { id, appointment: { patient: { userId: actor.id } } },
            select: { id: true },
          }))
        )
          throw new NotFoundException('Invoice not found');
        let invoice = await this.lock(tx, id);
        const summary = await this.invoices.summary(tx, id);
        const amount = new Prisma.Decimal(summary.outstandingAmount);
        if (
          invoice.status !== 'OPEN' ||
          invoice.currency !== 'VND' ||
          !amount.isInteger() ||
          invoice.refundRequestedAt ||
          invoice.refundRequestedAmount !== null ||
          new Prisma.Decimal(summary.refundedAmount).gt(0) ||
          amount.lte(0)
        )
          throw new ConflictException('Invoice cannot accept further payments');
        if (!/^MDC[A-F0-9]{24}$/.test(invoice.invoiceCode))
          throw new ConflictException(
            'Legacy invoice code is not supported for SePay QR',
          );
        if (!invoice.paymentBankCode) {
          const bankCode = normalizeBank(
            this.config.get<string>('BANK_CODE') ?? '',
          );
          const accountNumber = this.config.get<string>('BANK_ACCOUNT_NUMBER');
          const accountName = this.config.get<string>('BANK_ACCOUNT_NAME');
          if (!bankCode || !accountNumber || !accountName)
            throw new ServiceUnavailableException(
              'SePay bank configuration is missing or unsupported',
            );
          invoice = await tx.invoice.update({
            where: { id },
            data: {
              paymentBankCode: bankCode,
              paymentAccountNumber: accountNumber,
              paymentAccountName: accountName,
            },
          });
          await this.audit.record(
            {
              actor: {
                type: 'USER',
                id: actor.id,
                name: actor.name,
                role: actor.role as UserRole,
              },
              actionCode: 'SEPAY_QR_PREPARE',
              module: 'PAYMENTS',
              targetType: 'INVOICE',
              targetId: id,
              result: AuditLogResult.SUCCESS,
            },
            tx,
          );
        }
        const bankCode = invoice.paymentBankCode;
        const accountNumber = invoice.paymentAccountNumber;
        const accountName = invoice.paymentAccountName;
        if (!bankCode || !accountNumber || !accountName)
          throw new ConflictException('Incomplete invoice bank snapshot');
        const url = new URL('https://vietqr.app/img');
        url.search = new URLSearchParams({
          acc: accountNumber,
          bank: bankCode,
          amount: amount.toFixed(0),
          des: invoice.invoiceCode,
          template: 'compact',
        }).toString();
        return {
          invoiceId: id,
          paymentCode: invoice.invoiceCode,
          amount: amount.toFixed(0),
          bankCode,
          accountNumber,
          accountName,
          qrImageUrl: url.toString(),
        };
      },
      { isolationLevel: Prisma.TransactionIsolationLevel.ReadCommitted },
    );
  }

  async webhook(
    raw: Buffer | undefined,
    signature: string | undefined,
    timestamp: string | undefined,
  ) {
    const secret = this.config.get<string>('SEPAY_WEBHOOK_SECRET');
    if (!secret)
      throw new ServiceUnavailableException('SePay webhook is not configured');
    verifySepaySignature(raw, signature, timestamp, secret);
    const payload = parseSepayPayload(raw!);
    const idempotencyKey = `sepay:${payload.id}`;
    await this.prisma.$transaction(
      async (tx) => {
        await tx.$queryRaw`SELECT pg_advisory_xact_lock(hashtextextended(${idempotencyKey}, 0))::text`;
        const previous = await tx.paymentTransaction.findUnique({
          where: {
            provider_externalTransactionId: {
              provider: 'SEPAY',
              externalTransactionId: payload.id,
            },
          },
        });
        if (previous) {
          const old = previous.webhookPayload as Record<string, unknown> | null;
          const fields = [
            'id',
            'gateway',
            'accountNumber',
            'subAccount',
            'transactionDate',
            'transferType',
            'transferAmount',
            'code',
            'content',
            'referenceCode',
          ];
          if (
            !old ||
            fields.some((field) => old[field] !== payload.payload[field])
          ) {
            await this.audit.record(
              {
                actor: { type: 'SYSTEM' },
                actionCode: 'SEPAY_WEBHOOK_CONFLICT',
                module: 'PAYMENTS',
                targetType: 'PAYMENT_TRANSACTION',
                targetId: previous.id,
                result: AuditLogResult.FAILED,
                after: {
                  payloadHash: createHash('sha256').update(raw!).digest('hex'),
                },
              },
              tx,
            );
            return;
          }
          if (
            previous.status !==
              PaymentTransactionStatus.PENDING_RECONCILIATION ||
            previous.reconciliationNote !== 'BANK_ACCOUNT_MISMATCH' ||
            previous.transactionType !== 'PAYMENT' ||
            !previous.amount.equals(payload.amount)
          )
            return;
        }
        const code = extractInvoiceCode(payload.code, payload.content);
        const candidate = code
          ? await tx.invoice.findUnique({
              where: { invoiceCode: code },
              select: { id: true },
            })
          : null;
        const invoice = candidate ? await this.lock(tx, candidate.id) : null;
        let reason: string | null = null;
        if (payload.transferType !== 'in') reason = 'OUTGOING_TRANSFER';
        else if (!invoice) reason = 'INVOICE_NOT_MATCHED';
        else if (!invoice.paymentBankCode || !invoice.paymentAccountNumber)
          reason = 'QR_SNAPSHOT_MISSING';
        else if (
          !matchesSepayBankAccount(
            invoice.paymentBankCode,
            invoice.paymentAccountNumber,
            payload,
          )
        )
          reason = 'BANK_ACCOUNT_MISMATCH';
        else if (invoice.status !== 'OPEN') reason = 'INVOICE_VOID';
        else if (invoice.currency !== 'VND') reason = 'CURRENCY_MISMATCH';
        else {
          const summary = await this.invoices.summary(tx, invoice.id);
          if (
            invoice.refundRequestedAt ||
            invoice.refundRequestedAmount !== null ||
            new Prisma.Decimal(summary.refundedAmount).gt(0)
          )
            reason = 'REFUND_WORKFLOW';
        }
        if (previous) {
          if (!invoice || reason || previous.invoiceId !== invoice.id) return;
          const reconciled = await tx.paymentTransaction.updateMany({
            where: {
              id: previous.id,
              invoiceId: invoice.id,
              provider: 'SEPAY',
              externalTransactionId: payload.id,
              transactionType: 'PAYMENT',
              amount: payload.amount,
              status: PaymentTransactionStatus.PENDING_RECONCILIATION,
              reconciliationNote: 'BANK_ACCOUNT_MISMATCH',
            },
            data: {
              status: PaymentTransactionStatus.SUCCESS,
              reconciliationNote: null,
            },
          });
          if (reconciled.count !== 1) return;
          await this.audit.record(
            {
              actor: { type: 'SYSTEM' },
              actionCode: 'SEPAY_PAYMENT_RECONCILE',
              module: 'PAYMENTS',
              targetType: 'PAYMENT_TRANSACTION',
              targetId: previous.id,
              result: AuditLogResult.SUCCESS,
              before: {
                status: previous.status,
                reconciliationReason: previous.reconciliationNote,
              },
              after: {
                invoiceId: invoice.id,
                amount: payload.amount.toString(),
                status: PaymentTransactionStatus.SUCCESS,
              },
            },
            tx,
          );
          return;
        }
        const transaction = await tx.paymentTransaction.create({
          data: {
            invoiceId: invoice?.id ?? null,
            provider: 'SEPAY',
            externalTransactionId: payload.id,
            idempotencyKey,
            transactionType: 'PAYMENT',
            amount: payload.amount,
            status:
              payload.transferType === 'out'
                ? PaymentTransactionStatus.FAILED
                : reason
                  ? PaymentTransactionStatus.PENDING_RECONCILIATION
                  : PaymentTransactionStatus.SUCCESS,
            occurredAt: payload.occurredAt,
            webhookPayload: payload.payload,
            reconciliationNote: reason,
          },
        });
        await this.audit.record(
          {
            actor: { type: 'SYSTEM' },
            actionCode: 'SEPAY_PAYMENT_RECEIVE',
            module: 'PAYMENTS',
            targetType: 'PAYMENT_TRANSACTION',
            targetId: transaction.id,
            result: AuditLogResult.SUCCESS,
            after: {
              invoiceId: invoice?.id ?? null,
              amount: payload.amount.toString(),
              status: transaction.status,
              reconciliationReason: reason,
            },
          },
          tx,
        );
      },
      { isolationLevel: Prisma.TransactionIsolationLevel.ReadCommitted },
    );
    return { success: true };
  }
}
