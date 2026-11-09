import type { CatalogPage } from "@/types/apiTypes";

export type InvoicePaymentStatus =
  | "UNPAID"
  | "PARTIALLY_PAID"
  | "PAID"
  | "OVERPAID"
  | "PARTIALLY_REFUNDED"
  | "REFUNDED";

export interface InvoiceFilterValues {
  search: string;
  from: string;
  to: string;
  paymentStatus: InvoicePaymentStatus | "ALL";
  status: "ALL" | "OPEN" | "VOID";
}

export interface Invoice {
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
  status: "OPEN" | "VOID";
  currency: string;
  chargeDetails: unknown;
  totalAmount: string;
  receivedAmount: string;
  refundedAmount: string;
  outstandingAmount: string;
  overpaidAmount: string;
  paymentStatus: InvoicePaymentStatus;
  hasPendingReconciliation: boolean;
  refundRequestedAmount: string | null;
  refundRequestedAt: string | null;
  paymentGraceUntil: string | null;
  createdAt: string;
}

export interface InvoiceTransaction {
  id: string;
  provider: "COUNTER" | "SEPAY";
  transactionType: "PAYMENT" | "REFUND";
  amount: string;
  status: "PENDING" | "SUCCESS" | "FAILED" | "PENDING_RECONCILIATION";
  occurredAt: string;
  createdAt: string;
  processedBy: string | null;
  processedByUser: { id: string; fullName: string } | null;
  reconciliationNote: string | null;
}

export interface InvoiceDetail extends Invoice {
  transactions: InvoiceTransaction[];
}

export interface BillingCandidate {
  consultationId: string;
  careSessionId: string;
  appointmentId: string;
  appointmentCode: string;
  completedAt: string;
  patient: Invoice["patient"];
  doctor: { id: string; doctorCode: string; fullName: string };
  specialty: { id: string; name: string; roomCode: string };
  consultationFee: string | null;
  canCreateInvoice: boolean;
  blockedReason: "SPECIALTY_INACTIVE" | "FEE_NOT_CONFIGURED" | null;
}

export type BillingPage<T> = Pick<CatalogPage<T>, "data" | "pagination">;

export interface InvoiceListQuery {
  page: number;
  limit: number;
  search?: string;
  createdFrom?: string;
  createdTo?: string;
  paymentStatus?: InvoicePaymentStatus;
  status?: "OPEN" | "VOID";
}

export interface BillingCandidateQuery {
  page: number;
  limit: number;
  search?: string;
  completedFrom?: string;
  completedTo?: string;
}

export interface CashPaymentInput {
  amount: string;
  method: "CASH";
  note?: string;
}

export interface CashPaymentReceipt {
  transactionId: string;
  receiptCode: string;
  invoiceId: string;
  amount: string;
  outstandingAmount: string;
  paymentStatus: InvoicePaymentStatus;
}

export interface InvoiceQr {
  invoiceId: string;
  paymentCode: string;
  amount: string;
  bankCode: string;
  accountNumber: string;
  accountName: string;
  qrImageUrl: string;
}
