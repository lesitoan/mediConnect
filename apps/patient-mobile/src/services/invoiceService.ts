export type PaymentMethod = 'VNPAY_QR' | 'CASH' | 'CARD';
export type VatStatus = 'ISSUED' | 'PENDING';

export type Invoice = {
  id: string;
  code: string;
  issuedAt: string;
  serviceName: string;
  doctorName: string;
  location: string;
  amount: number;
  paymentMethod: PaymentMethod;
  vatStatus: VatStatus;
};

export type InvoiceOverview = {
  year: number;
  totalPaid: number;
  invoiceCount: number;
  invoices: Invoice[];
};

export const PAYMENT_METHOD_LABELS: Record<PaymentMethod, string> = {
  VNPAY_QR: 'VNPAY-QR',
  CASH: 'Tiền mặt',
  CARD: 'Thẻ ngân hàng',
};

export const formatIssuedDate = (issuedAt: string) => {
  const [year, month, day] = issuedAt.slice(0, 10).split('-');
  return `${day}/${month}/${year}`;
};

export const formatIssuedTime = (issuedAt: string) => issuedAt.slice(11, 16);

export const getIssuedMonthKey = (issuedAt: string) => issuedAt.slice(0, 7);

export const formatIssuedMonth = (monthKey: string) => {
  const [year, month] = monthKey.split('-');
  return `Tháng ${month}/${year}`;
};

const MOCK_INVOICES: Invoice[] = [
  {
    id: 'invoice-88962537',
    code: 'HD-2025-88962537',
    issuedAt: '2025-10-21T09:42',
    serviceName: 'Khám chuyên gia Nội Tim Mạch',
    doctorName: 'TS.BS Lê Quang Huy',
    location: 'Phòng 302, Tòa A',
    amount: 450000,
    paymentMethod: 'VNPAY_QR',
    vatStatus: 'ISSUED',
  },
  {
    id: 'invoice-88962538',
    code: 'HD-2025-88962538',
    issuedAt: '2025-10-20T08:15',
    serviceName: 'Khám chuyên gia Tiết niệu',
    doctorName: 'BS. Nguyễn Thị Mai',
    location: 'Phòng 204, Tòa B',
    amount: 350000,
    paymentMethod: 'VNPAY_QR',
    vatStatus: 'ISSUED',
  },
  {
    id: 'invoice-88962539',
    code: 'HD-2025-88962539',
    issuedAt: '2025-10-19T17:10',
    serviceName: 'Khám chuyên gia Thần kinh',
    doctorName: 'TS.BS Phạm Văn Minh',
    location: 'Phòng 408, Tòa C',
    amount: 320000,
    paymentMethod: 'VNPAY_QR',
    vatStatus: 'ISSUED',
  },
  {
    id: 'invoice-88962301',
    code: 'HD-2025-88962301',
    issuedAt: '2025-09-12T10:20',
    serviceName: 'Khám và xét nghiệm Tiêu hóa',
    doctorName: 'ThS.BS Lê Quốc Bảo',
    location: 'Phòng 105, Tòa B',
    amount: 730000,
    paymentMethod: 'CASH',
    vatStatus: 'ISSUED',
  },
];

export async function getInvoiceOverview(_profileId: string): Promise<InvoiceOverview> {
  const invoices = [...MOCK_INVOICES].sort((a, b) => b.issuedAt.localeCompare(a.issuedAt));
  return {
    year: 2025,
    totalPaid: invoices.reduce((sum, item) => sum + item.amount, 0),
    invoiceCount: invoices.length,
    invoices,
  };
}

export async function getInvoiceById(invoiceId: string): Promise<Invoice | null> {
  return MOCK_INVOICES.find((item) => item.id === invoiceId) ?? null;
}