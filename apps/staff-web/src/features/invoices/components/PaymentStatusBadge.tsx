import { PAYMENT_STATUS_LABELS } from "../invoiceUtils";
import type { InvoicePaymentStatus } from "../types/invoiceTypes";

export function PaymentStatusBadge({
  status,
  isVoid = false,
}: {
  status: InvoicePaymentStatus;
  isVoid?: boolean;
}) {
  const className = isVoid
    ? "bg-neutral-bg text-neutral"
    : status === "PAID"
      ? "bg-success-bg text-success"
      : ["OVERPAID", "PARTIALLY_REFUNDED", "REFUNDED"].includes(status)
        ? "bg-error-bg text-error-text"
        : "bg-warning-bg text-warning";
  return (
    <span
      className={`inline-flex whitespace-nowrap rounded-full px-2.5 py-1 text-caption font-semibold ${className}`}
    >
      {isVoid ? "Đã hủy" : PAYMENT_STATUS_LABELS[status]}
    </span>
  );
}
