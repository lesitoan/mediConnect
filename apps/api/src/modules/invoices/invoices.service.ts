import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { randomBytes } from 'node:crypto';
import {
  AuditLogResult,
  CareSessionStatus,
  InvoiceStatus,
  Prisma,
  UserRole,
} from '../../generated/prisma/client';
import type { CurrentUserDto } from '../users/dto/responses/current-user.dto';
import { AuditLogsService } from '../audit-logs/audit-logs.service';
import { PrismaService } from '../database/services/prisma.service';
import { sqlTable } from '../database/utils/sql-table';
import { PaginationUtils } from '../../common/utils/pagination.utils';
import { BillingCandidateQueryDto } from './dto/staff/billing-candidate-query.dto';
import { CreateInvoiceDto } from './dto/staff/create-invoice.dto';

type LockedConsultationForInvoice = {
  consultationId: string;
  careSessionStatus: CareSessionStatus;
  completedAt: Date | null;
  lockedAt: Date | null;
  appointmentId: string;
  specialtyId: string;
  specialtyName: string;
  specialtyIsActive: boolean;
  consultationFee: string | null;
};

type BillingCandidateRow = {
  consultationId: string;
  careSessionId: string;
  appointmentId: string;
  appointmentCode: string;
  completedAt: Date;
  patientId: string;
  patientCode: string;
  patientName: string;
  patientPhone: string | null;
  specialtyId: string;
  specialtyName: string;
  roomCode: string;
  consultationFee: string | null;
  specialtyIsActive: boolean;
  doctorId: string;
  doctorCode: string;
  doctorName: string;
};

const INVOICE_SELECT = {
  id: true,
  invoiceCode: true,
  consultationId: true,
  appointmentId: true,
  currency: true,
  chargeDetails: true,
  totalAmount: true,
  status: true,
  createdAt: true,
} satisfies Prisma.InvoiceSelect;

@Injectable()
export class InvoicesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditLogsService,
  ) {}

  async listBillingCandidates(query: BillingCandidateQueryDto) {
    if (!!query.completedFrom !== !!query.completedTo)
      throw new BadRequestException(
        'completedFrom and completedTo must be provided together',
      );
    if (query.completedFrom && query.completedTo) {
      const from = new Date(`${query.completedFrom}T00:00:00+07:00`);
      const to = new Date(`${query.completedTo}T00:00:00+07:00`);
      if (from > to)
        throw new BadRequestException(
          'completedFrom must be before or equal to completedTo',
        );
    }

    const page = new PaginationUtils().extractSkipTakeFromPagination(query);
    const conditions: Prisma.Sql[] = [];
    if (query.patientId)
      conditions.push(Prisma.sql`AND a.patient_id = ${query.patientId}::uuid`);
    if (query.search) {
      const search = `%${query.search}%`;
      conditions.push(Prisma.sql`
        AND (
          a.appointment_code ILIKE ${search}
          OR p.patient_code ILIKE ${search}
          OR p.full_name ILIKE ${search}
          OR COALESCE(p.phone, '') ILIKE ${search}
        )
      `);
    }
    if (query.completedFrom && query.completedTo) {
      const start = new Date(`${query.completedFrom}T00:00:00+07:00`);
      const endExclusive = new Date(
        new Date(`${query.completedTo}T00:00:00+07:00`).getTime() + 86_400_000,
      );
      conditions.push(
        Prisma.sql`AND c.completed_at >= ${start} AND c.completed_at < ${endExclusive}`,
      );
    }

    const where = conditions.length
      ? Prisma.join(conditions, ' ')
      : Prisma.empty;
    const appointments = sqlTable(this.prisma.schemaName, 'appointments');
    const careSessions = sqlTable(this.prisma.schemaName, 'care_sessions');
    const consultations = sqlTable(this.prisma.schemaName, 'consultations');
    const specialties = sqlTable(this.prisma.schemaName, 'specialties');
    const patients = sqlTable(this.prisma.schemaName, 'patients');
    const appointmentSlots = sqlTable(
      this.prisma.schemaName,
      'appointment_slots',
    );
    const doctorSchedules = sqlTable(
      this.prisma.schemaName,
      'doctor_schedules',
    );
    const doctors = sqlTable(this.prisma.schemaName, 'doctors');
    const users = sqlTable(this.prisma.schemaName, 'users');
    const fromSql = Prisma.sql`
      FROM ${consultations} AS c
      INNER JOIN ${careSessions} AS cs ON cs.id = c.care_session_id
      INNER JOIN ${appointments} AS a ON a.id = cs.appointment_id
      INNER JOIN ${patients} AS p ON p.id = a.patient_id
      INNER JOIN ${specialties} AS sp ON sp.id = cs.specialty_id
      INNER JOIN ${appointmentSlots} AS aps ON aps.id = cs.appointment_slot_id
      INNER JOIN ${doctorSchedules} AS ds ON ds.id = aps.doctor_schedule_id
      INNER JOIN ${doctors} AS d ON d.id = ds.doctor_id
      INNER JOIN ${users} AS u ON u.id = d.user_id
      WHERE cs.status::text = ${CareSessionStatus.COMPLETED}
        AND c.completed_at IS NOT NULL
        AND c.locked_at IS NOT NULL
        AND NOT EXISTS (
          SELECT 1
          FROM ${sqlTable(this.prisma.schemaName, 'invoices')} AS i
          WHERE i.consultation_id = c.id
        )
        ${where}
    `;

    const [items, countRows] = await this.prisma.$transaction(
      async (tx) =>
        Promise.all([
          tx.$queryRaw<BillingCandidateRow[]>(Prisma.sql`
            SELECT
              c.id AS "consultationId",
              cs.id AS "careSessionId",
              a.id AS "appointmentId",
              a.appointment_code AS "appointmentCode",
              c.completed_at AS "completedAt",
              p.id AS "patientId",
              p.patient_code AS "patientCode",
              p.full_name AS "patientName",
              p.phone AS "patientPhone",
              sp.id AS "specialtyId",
              sp.name AS "specialtyName",
              sp.room_code AS "roomCode",
              sp.consultation_fee::text AS "consultationFee",
              sp.is_active AS "specialtyIsActive",
              d.id AS "doctorId",
              d.doctor_code AS "doctorCode",
              u.full_name AS "doctorName"
            ${fromSql}
            ORDER BY c.completed_at DESC, c.id DESC
            LIMIT ${page.take} OFFSET ${page.skip}
          `),
          tx.$queryRaw<{ total: number }[]>(Prisma.sql`
            SELECT COUNT(*)::int AS total
            ${fromSql}
          `),
        ]),
      { isolationLevel: Prisma.TransactionIsolationLevel.RepeatableRead },
    );

    return {
      items: items.map((item) => ({
        consultationId: item.consultationId,
        careSessionId: item.careSessionId,
        appointmentId: item.appointmentId,
        appointmentCode: item.appointmentCode,
        completedAt: item.completedAt,
        patient: {
          id: item.patientId,
          patientCode: item.patientCode,
          fullName: item.patientName,
          phone: item.patientPhone,
        },
        doctor: {
          id: item.doctorId,
          doctorCode: item.doctorCode,
          fullName: item.doctorName,
        },
        specialty: {
          id: item.specialtyId,
          name: item.specialtyName,
          roomCode: item.roomCode,
        },
        consultationFee: item.consultationFee,
        canCreateInvoice:
          item.specialtyIsActive && item.consultationFee !== null,
        blockedReason: !item.specialtyIsActive
          ? 'SPECIALTY_INACTIVE'
          : item.consultationFee === null
            ? 'FEE_NOT_CONFIGURED'
            : null,
      })),
      pagination: page.convertPaginationResponseDtoFromTotalRecords(
        countRows[0]?.total ?? 0,
      ),
    };
  }

  async createFromConsultation(input: CreateInvoiceDto, actor: CurrentUserDto) {
    const result = await this.prisma.$transaction(async (tx) => {
      const [consultation] = await tx.$queryRaw<LockedConsultationForInvoice[]>`
        SELECT
          c.id AS "consultationId",
          cs.status AS "careSessionStatus",
          c.completed_at AS "completedAt",
          c.locked_at AS "lockedAt",
          cs.appointment_id AS "appointmentId",
          cs.specialty_id AS "specialtyId",
          sp.name AS "specialtyName",
          sp.is_active AS "specialtyIsActive",
          sp.consultation_fee::text AS "consultationFee"
        FROM ${sqlTable(this.prisma.schemaName, 'consultations')} AS c
        INNER JOIN ${sqlTable(this.prisma.schemaName, 'care_sessions')} AS cs
          ON cs.id = c.care_session_id
        INNER JOIN ${sqlTable(this.prisma.schemaName, 'specialties')} AS sp
          ON sp.id = cs.specialty_id
        WHERE c.id = ${input.consultationId}::uuid
        FOR UPDATE OF c, cs, sp
      `;

      if (!consultation) throw new NotFoundException('Consultation not found');
      if (
        consultation.careSessionStatus !== CareSessionStatus.COMPLETED ||
        consultation.completedAt === null ||
        consultation.lockedAt === null
      )
        throw new ConflictException(
          'Consultation must be completed and locked before invoicing',
        );

      const existingInvoice = await tx.invoice.findUnique({
        where: { consultationId: input.consultationId },
        select: INVOICE_SELECT,
      });
      if (existingInvoice) {
        if (existingInvoice.status === InvoiceStatus.VOID)
          throw new ConflictException(
            'A void invoice already exists for this consultation',
          );
        return {
          invoice: this.serializeInvoice(existingInvoice),
          created: false,
        };
      }

      if (!consultation.specialtyIsActive)
        throw new ConflictException('The consultation specialty is inactive');
      if (consultation.consultationFee === null)
        throw new ConflictException(
          'A positive whole-number consultation fee must be configured',
        );
      const fee = new Prisma.Decimal(consultation.consultationFee);
      if (!fee.isPositive() || !fee.isInteger())
        throw new ConflictException(
          'A positive whole-number consultation fee must be configured',
        );

      const amount = fee.toFixed(0);
      const invoice = await tx.invoice.create({
        data: {
          invoiceCode: `MDC${randomBytes(12).toString('hex').toUpperCase()}`,
          consultationId: consultation.consultationId,
          appointmentId: consultation.appointmentId,
          currency: 'VND',
          totalAmount: fee,
          chargeDetails: [
            {
              code: 'CONSULTATION_FEE',
              specialtyId: consultation.specialtyId,
              specialtyName: consultation.specialtyName,
              quantity: 1,
              unitPrice: amount,
              amount,
            },
          ],
        },
        select: INVOICE_SELECT,
      });

      await this.audit.record(
        {
          actor: {
            type: 'USER',
            id: actor.id,
            name: actor.name,
            role: UserRole.RECEPTIONIST,
          },
          actionCode: 'INVOICE_CREATE',
          module: 'INVOICES',
          targetType: 'INVOICE',
          targetId: invoice.id,
          result: AuditLogResult.SUCCESS,
          after: {
            invoiceCode: invoice.invoiceCode,
            consultationId: consultation.consultationId,
            appointmentId: consultation.appointmentId,
            specialtyId: consultation.specialtyId,
            totalAmount: amount,
            currency: invoice.currency,
          },
        },
        tx,
      );

      return { invoice: this.serializeInvoice(invoice), created: true };
    });

    return result;
  }

  private serializeInvoice<T extends { totalAmount: Prisma.Decimal }>(
    invoice: T,
  ) {
    return {
      ...invoice,
      totalAmount: invoice.totalAmount.toFixed(0),
    };
  }
}
