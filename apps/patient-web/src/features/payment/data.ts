import { MOCK_RECORDS } from "@/features/appointments/data";

export type ItemIcon = "visit" | "endoscopy" | "lab" | "drug";

export type InvoiceItem = {
  icon: ItemIcon;
  name: string;
  desc: string;
  original: number; // nguyên giá
  bhyt: number; // BHYT chi trả
};

export type Invoice = {
  code: string; // mã phiên khám
  invoiceNo: string;
  basePending: boolean; // trạng thái trong dữ liệu gốc
  doctor: { name: string; dept: string; initials: string };
  location: string;
  time: string;
  diagnosis: string;
  note: string;
  items: InvoiceItem[];
  advance: number; // tạm ứng trước khám
  points: number; // ưu đãi MediPoint
};

const BILLING: Record<string, Omit<Invoice, "code" | "basePending" | "doctor">> = {
  "MDC-2025-9921": {
    invoiceNo: "MDC-VP-889",
    location: "Phòng 402, Tòa A",
    time: "10/10/2026 • 08:30 - 09:30",
    diagnosis: "Viêm niêm mạc hang vị dạ dày nhẹ (GERD)",
    note: "Kèm chỉ định phác đồ thuốc 14 ngày & tái khám định kỳ.",
    items: [
      { icon: "visit", name: "Khám chuyên khoa Tiêu hóa (Bác sĩ Trưởng khoa)", desc: "Khám lâm sàng, chỉ định xét nghiệm ban đầu", original: 300000, bhyt: 200000 },
      { icon: "endoscopy", name: "Nội soi dạ dày không đau (Gây mê hồi sức)", desc: "Kỹ thuật NBI phát hiện sớm tổn thương niêm mạc", original: 1200000, bhyt: 600000 },
      { icon: "lab", name: "Xét nghiệm sinh hóa máu & Vi khuẩn HP (03 chỉ số)", desc: "Test Clo & Định lượng enzyme dạ dày", original: 450000, bhyt: 250000 },
      { icon: "drug", name: "Đơn thuốc điện tử điều trị 14 ngày", desc: "Nexium 40mg (AstraZeneca) • Gaviscon Dual Action", original: 380000, bhyt: 130000 },
    ],
    advance: 450000,
    points: 50000,
  },
};

// TODO: thay bằng API: GET /invoices?visitCode=... (backend kiểm tra phiên khám thuộc
// bệnh nhân đang đăng nhập và tính tiền ở server, không tin số tiền gửi từ client)
export function getInvoice(code: string): Invoice | null {
  const rec = MOCK_RECORDS.find((r) => r.visitCode === code);
  const bill = BILLING[code];
  if (!rec || !bill) return null;
  return {
    code,
    basePending: rec.paymentStatus === "pending",
    doctor: {
      name: rec.doctor.name,
      dept: rec.specialty,
      initials: (rec.doctor.name.trim().split(/\s+/).slice(-1)[0] ?? "").charAt(0).toUpperCase(),
    },
    ...bill,
  };
}

export function totals(inv: Invoice) {
  const gross = inv.items.reduce((s, i) => s + i.original, 0);
  const bhyt = inv.items.reduce((s, i) => s + i.bhyt, 0);
  const remaining = Math.max(0, gross - bhyt - inv.advance - inv.points);
  return { gross, bhyt, advance: inv.advance, points: inv.points, remaining };
}

// Định dạng tiền thủ công để SSR và client luôn cho cùng kết quả
export const fmt = (n: number) => String(n).replace(/\B(?=(\d{3})+(?!\d))/g, ".");