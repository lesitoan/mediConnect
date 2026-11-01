import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '../../generated/prisma/client';
import { PaginationUtils } from '../../common/utils/pagination.utils';
import { PrismaService } from '../database/services/prisma.service';
import { sqlTable } from '../database/utils/sql-table';
import {
  InvoiceQueryDto,
  PAYMENT_STATUSES,
} from './dto/staff/invoice-query.dto';

type InvoiceSummary = {
  id: string;
  invoiceCode: string;
  consultationId: string | null;
  appointmentId: string;
  appointmentCode: string;
  patient: {
    id: string;
    patientCode: string;
    fullName: string;
    phone: string | null;
  };
  status: string;
  currency: string;
  chargeDetails: Prisma.JsonValue;
  totalAmount: string;
  receivedAmount: string;
  refundedAmount: string;
  outstandingAmount: string;
  overpaidAmount: string;
  paymentStatus: (typeof PAYMENT_STATUSES)[number];
  hasPendingReconciliation: boolean;
  refundRequestedAmount: string | null;
  refundRequestedAt: Date | null;
  paymentGraceUntil: Date | null;
  createdAt: Date;
};

@Injectable()
export class InvoiceQueriesService {
  constructor(private readonly prisma: PrismaService) {}

  private billingSql() {
    return Prisma.sql`
      WITH ledger AS (
        SELECT invoice_id,
          COALESCE(SUM(amount) FILTER (WHERE status = 'SUCCESS' AND transaction_type = 'PAYMENT'), 0) AS received,
          COALESCE(SUM(amount) FILTER (WHERE status = 'SUCCESS' AND transaction_type = 'REFUND'), 0) AS refunded,
          BOOL_OR(status = 'PENDING_RECONCILIATION') AS pending
        FROM ${sqlTable(this.prisma.schemaName, 'payment_transactions')}
        WHERE invoice_id IS NOT NULL
        GROUP BY invoice_id
      ), balances AS (
        SELECT i.*, a.appointment_code, a.patient_id,
          p.patient_code, p.full_name, p.phone,
          COALESCE(l.received, 0) AS received,
          COALESCE(l.refunded, 0) AS refunded,
          COALESCE(l.received, 0) - COALESCE(l.refunded, 0) AS net_paid,
          COALESCE(l.pending, false) AS pending
        FROM ${sqlTable(this.prisma.schemaName, 'invoices')} i
        JOIN ${sqlTable(this.prisma.schemaName, 'appointments')} a ON a.id = i.appointment_id
        JOIN ${sqlTable(this.prisma.schemaName, 'patients')} p ON p.id = a.patient_id
        LEFT JOIN ledger l ON l.invoice_id = i.id
      ), billing AS (
        SELECT balances.*,
          CASE
            WHEN refunded > 0 AND net_paid <= 0 THEN 'REFUNDED'
            WHEN refunded > 0 THEN 'PARTIALLY_REFUNDED'
            WHEN net_paid > total_amount THEN 'OVERPAID'
            WHEN net_paid = total_amount THEN 'PAID'
            WHEN net_paid > 0 THEN 'PARTIALLY_PAID'
            ELSE 'UNPAID'
          END AS payment_status
        FROM balances
      )
    `;
  }

  private selectSql() {
    return Prisma.sql`
      SELECT id, invoice_code AS "invoiceCode", consultation_id AS "consultationId",
        appointment_id AS "appointmentId", appointment_code AS "appointmentCode",
        jsonb_build_object('id', patient_id, 'patientCode', patient_code, 'fullName', full_name, 'phone', phone) AS patient,
        status, currency, charge_details AS "chargeDetails", total_amount::text AS "totalAmount",
        received::text AS "receivedAmount", refunded::text AS "refundedAmount",
        GREATEST(total_amount - net_paid, 0)::text AS "outstandingAmount",
        GREATEST(net_paid - total_amount, 0)::text AS "overpaidAmount",
        payment_status AS "paymentStatus", pending AS "hasPendingReconciliation",
        refund_requested_amount::text AS "refundRequestedAmount",
        refund_requested_at AS "refundRequestedAt", payment_grace_until AS "paymentGraceUntil",
        created_at AS "createdAt"
      FROM billing
    `;
  }

  async list(query: InvoiceQueryDto) {
    if (
      !!query.createdFrom !== !!query.createdTo ||
      (query.createdFrom &&
        query.createdTo &&
        query.createdFrom > query.createdTo)
    )
      throw new BadRequestException(
        'createdFrom and createdTo must be provided together in chronological order',
      );
    const page = new PaginationUtils().extractSkipTakeFromPagination(query);
    const filters: Prisma.Sql[] = [Prisma.sql`TRUE`];
    if (query.patientId)
      filters.push(Prisma.sql`patient_id = ${query.patientId}::uuid`);
    if (query.status) filters.push(Prisma.sql`status::text = ${query.status}`);
    if (query.paymentStatus)
      filters.push(Prisma.sql`payment_status = ${query.paymentStatus}`);
    if (query.search) {
      const term = `%${query.search}%`;
      filters.push(
        Prisma.sql`(invoice_code ILIKE ${term} OR patient_code ILIKE ${term} OR full_name ILIKE ${term} OR phone ILIKE ${term})`,
      );
    }
    if (query.createdFrom && query.createdTo) {
      const start = new Date(`${query.createdFrom}T00:00:00+07:00`);
      const end = new Date(
        new Date(`${query.createdTo}T00:00:00+07:00`).getTime() + 86_400_000,
      );
      filters.push(Prisma.sql`created_at >= ${start} AND created_at < ${end}`);
    }
    const where = Prisma.join(filters, ' AND ');
    const [items, counts] = await this.prisma.$transaction(
      async (tx) => {
        const items = await tx.$queryRaw<InvoiceSummary[]>(Prisma.sql`
        ${this.billingSql()} ${this.selectSql()} WHERE ${where}
        ORDER BY created_at DESC, id DESC LIMIT ${page.take} OFFSET ${page.skip}
      `);
        const counts = await tx.$queryRaw<{ total: number }[]>(Prisma.sql`
        ${this.billingSql()} SELECT COUNT(*)::int AS total FROM billing WHERE ${where}
      `);
        return [items, counts] as const;
      },
      { isolationLevel: Prisma.TransactionIsolationLevel.RepeatableRead },
    );
    return {
      items,
      pagination: page.convertPaginationResponseDtoFromTotalRecords(
        counts[0]?.total ?? 0,
      ),
    };
  }

  async get(id: string) {
    return this.prisma.$transaction(
      async (tx) => {
        const [invoice] = await tx.$queryRaw<InvoiceSummary[]>(Prisma.sql`
        ${this.billingSql()} ${this.selectSql()} WHERE id = ${id}::uuid
      `);
        if (!invoice) throw new NotFoundException('Invoice not found');
        const transactions = await tx.paymentTransaction.findMany({
          where: { invoiceId: id },
          orderBy: [{ occurredAt: 'desc' }, { id: 'desc' }],
          select: {
            id: true,
            provider: true,
            transactionType: true,
            amount: true,
            status: true,
            occurredAt: true,
            createdAt: true,
          },
        });
        return {
          ...invoice,
          transactions: transactions.map((t) => ({
            ...t,
            amount: t.amount.toString(),
          })),
        };
      },
      { isolationLevel: Prisma.TransactionIsolationLevel.RepeatableRead },
    );
  }

  async summary(tx: Prisma.TransactionClient, id: string) {
    const [invoice] = await tx.$queryRaw<InvoiceSummary[]>(Prisma.sql`
      ${this.billingSql()} ${this.selectSql()} WHERE id = ${id}::uuid
    `);
    if (!invoice) throw new NotFoundException('Invoice not found');
    return invoice;
  }
}
