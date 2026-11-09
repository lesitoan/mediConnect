import type { Invoice, InvoicePaymentStatus } from "./types/invoiceTypes";

export const PAYMENT_STATUS_LABELS: Record<InvoicePaymentStatus, string> = {
  UNPAID: "Chưa thanh toán",
  PARTIALLY_PAID: "Đã thu một phần",
  PAID: "Đã thanh toán",
  OVERPAID: "Thu thừa",
  PARTIALLY_REFUNDED: "Hoàn một phần",
  REFUNDED: "Đã hoàn tiền",
};

export function parseVnd(value: string): bigint | null {
  const match = /^(\d+)(?:\.0+)?$/.exec(value);
  return match ? BigInt(match[1]) : null;
}

export function formatVnd(value: string | null | undefined): string {
  if (value == null) return "Chưa cấu hình";
  const amount = parseVnd(value);
  return amount === null
    ? `${value} VND`
    : `${new Intl.NumberFormat("vi-VN").format(amount)} ₫`;
}

export function formatBillingDate(value: string | null | undefined): string {
  if (!value || !Number.isFinite(Date.parse(value))) return "—";
  return new Intl.DateTimeFormat("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "Asia/Ho_Chi_Minh",
  }).format(new Date(value));
}

export function collectionBlockedReason(invoice: Invoice): string | null {
  if (invoice.status !== "OPEN") return "Hóa đơn đã hủy, không thể thu tiền.";
  if (invoice.currency !== "VND") return "Hóa đơn không sử dụng VND.";
  if (
    invoice.refundRequestedAt ||
    invoice.refundRequestedAmount !== null ||
    (parseVnd(invoice.refundedAmount) ?? BigInt(0)) > BigInt(0)
  ) {
    return "Hóa đơn đang có yêu cầu hoặc giao dịch hoàn tiền, không thể thu thêm.";
  }
  const outstanding = parseVnd(invoice.outstandingAmount);
  if (outstanding === null)
    return "Không xác định được số tiền còn thiếu. Vui lòng tải lại hóa đơn.";
  if (outstanding === BigInt(0)) return "Hóa đơn không còn số tiền cần thu.";
  return null;
}

export function billingErrorMessage(error: unknown): string {
  const detail = error as {
    status?: number | string;
    message?: string;
    data?: { message?: string | string[] };
  };
  const raw = detail?.data?.message ?? detail?.message ?? "";
  const message = Array.isArray(raw) ? raw.join("; ") : raw;
  if (detail?.status === 403)
    return "Tài khoản chưa có quyền thực hiện thao tác này.";
  if (detail?.status === 401)
    return "Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.";
  if (detail?.status === 404)
    return "Không tìm thấy hóa đơn hoặc phiên khám này.";
  if (/configuration|not configured|unsupported/i.test(message))
    return "Chưa thể tạo QR. Vui lòng kiểm tra cấu hình ngân hàng với quản trị viên.";
  if (/fee/i.test(message))
    return "Chuyên khoa chưa có phí khám hợp lệ. Vui lòng liên hệ quản trị viên.";
  if (/exceeds|outstanding/i.test(message))
    return "Số dư hóa đơn đã thay đổi hoặc số tiền thu vượt phần còn thiếu. Vui lòng kiểm tra lại.";
  if (/Idempotency-Key/i.test(message))
    return "Thông tin khoản thu đang chờ không khớp. Vui lòng liên hệ quản trị viên trước khi thu thêm.";
  if (/completed and locked/i.test(message))
    return "Phiên khám phải hoàn tất và khóa hồ sơ trước khi lập hóa đơn.";
  if (/inactive/i.test(message))
    return "Chuyên khoa đang ngừng hoạt động, chưa thể lập hóa đơn.";
  if (/void|refund|further payments|further collection/i.test(message))
    return "Hóa đơn không còn được phép thu tiền. Vui lòng tải lại chi tiết.";
  if (
    detail?.status === "TIMEOUT_ERROR" ||
    detail?.status === "FETCH_ERROR" ||
    detail?.status === "CANCELED"
  ) {
    return "Chưa nhận được kết quả từ máy chủ. Kiểm tra kết nối và thử lại.";
  }
  return "Không thể hoàn tất thao tác. Vui lòng tải lại dữ liệu và thử lại.";
}

export function isDefinitivePaymentRejection(error: unknown): boolean {
  const detail = error as {
    status?: number;
    message?: string;
    data?: { message?: string | string[] };
  };
  return (
    [400, 403, 404, 409, 422].includes(detail?.status ?? 0) &&
    !/Idempotency-Key/i.test(
      String(detail?.data?.message ?? detail?.message ?? ""),
    )
  );
}

export function invoiceCharges(value: unknown): Array<{
  label: string;
  quantity: number;
  unitPrice: string;
  amount: string;
}> {
  if (!Array.isArray(value)) return [];
  return value.flatMap((entry: unknown) => {
    if (!entry || typeof entry !== "object") return [];
    const row = entry as Record<string, unknown>;
    if (
      typeof row.amount !== "string" ||
      typeof row.unitPrice !== "string" ||
      typeof row.quantity !== "number"
    )
      return [];
    return [
      {
        label:
          typeof row.specialtyName === "string"
            ? `Khám ${row.specialtyName}`
            : "Phí khám",
        quantity: row.quantity,
        unitPrice: row.unitPrice,
        amount: row.amount,
      },
    ];
  });
}
