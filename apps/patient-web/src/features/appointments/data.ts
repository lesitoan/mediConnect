export type ApptKind = "confirmed" | "followup" | "completed" | "cancelled";

export type Appointment = {
  code: string;
  kind: ApptKind;
  daysFromNow: number; // âm = đã qua
  time: string; // "HH:mm"
  bookedAt: string;
  doctor: {
    name: string;
    title: string;
    initials: string;
    specialty: string;
    rating: number;
    reviews: number;
  };
  room: string;
  feeLabel: string;
  fee: string;
  feeNote: string;
  note?: { label: string; text: string };
  queue?: string;
  phone: string;
  rescheduleCount?: number; // số lần đã đổi lịch (SRS: tối đa 2 lần/lịch)
};

// TODO: thay bằng API lấy lịch hẹn của chính bệnh nhân đang đăng nhập (UC06)
export const MOCK_APPOINTMENTS: Appointment[] = [
  {
    code: "MDC-2025-9930",
    kind: "confirmed",
    daysFromNow: 3,
    time: "08:30",
    bookedAt: "18/10/2026",
    doctor: {
      name: "TS.BS Lê Quang Huy",
      title: "Trưởng khoa Nội Tiêu Hóa • BV Bạch Mai",
      initials: "LH",
      specialty: "Khoa Nội Tiêu Hóa",
      rating: 4.9,
      reviews: 428,
    },
    room: "Phòng 402, Tầng 4, Tòa A (Khu Chuyên Gia)",
    feeLabel: "Tạm ứng viện phí & BHYT:",
    fee: "450.000",
    feeNote: "Đã thanh toán (BHYT đúng tuyến)",
    note: {
      label: "Dặn dò y khoa:",
      text: "Nhịn ăn sáng tối thiểu 6 tiếng phục vụ xét nghiệm máu & nội soi. Mang kèm kết quả chụp chiếu trước đó nếu có.",
    },
    queue: "STT #04 (Dự kiến khám 08:35)",
    phone: "0912 *** 896",
  },
  {
    code: "MDC-2025-8842",
    kind: "followup",
    daysFromNow: 19,
    time: "14:00",
    bookedAt: "15/09/2026",
    doctor: {
      name: "PGS.TS Trần Mai Lan",
      title: "Cố vấn lâm sàng Viện Tim Mạch Quốc Gia",
      initials: "TL",
      specialty: "Khoa Tim Mạch",
      rating: 4.8,
      reviews: 310,
    },
    room: "Phòng 205, Tầng 2, Tòa A (Đa Chuyên Khoa)",
    feeLabel: "Viện phí tái khám:",
    fee: "350.000",
    feeNote: "Bảo lãnh BHYT tự động",
    note: {
      label: "Ghi chú đo huyết áp:",
      text: "Ghi nhật ký huyết áp sáng - tối trong 3 ngày trước khi đến khám và mang theo sổ theo dõi.",
    },
    phone: "0912 *** 896",
  },
  {
    code: "MDC-2025-5120",
    kind: "cancelled",
    daysFromNow: -40,
    time: "10:30",
    bookedAt: "10/08/2026",
    doctor: {
      name: "PGS.TS Trần Mai Lan",
      title: "Cố vấn lâm sàng Viện Tim Mạch Quốc Gia",
      initials: "TL",
      specialty: "Khoa Tim Mạch",
      rating: 4.8,
      reviews: 310,
    },
    room: "Phòng 205, Tầng 2, Tòa A",
    feeLabel: "Viện phí:",
    fee: "350.000",
    feeNote: "Đã hoàn tiền",
    phone: "0912 *** 896",
  },
];

/* ---------- Hồ sơ phiên khám đã hoàn tất (khám + xét nghiệm) ---------- */

type RecordBase = {
  id: string;
  title: string;
  date: string;
  daysFromNow: number; // âm = đã qua
  visitCode: string; // mã phiếu khám, dùng cho nút đánh giá
  specialty: string;
  doctor: { name: string; dept: string };
  room: string;
  reviewed: boolean;
  paymentStatus: "paid" | "pending";
};

export type VisitRecord = RecordBase & {
  type: "visit";
  recordCode: string;
  conclusion: string;
  prescription?: {
    code: string;
    items: { no: string; name: string; qty: string; dose: string }[];
    advice: string;
    signature: string;
  };
  adherence?: string;
};

export type LabMetric = { label: string; value: string; note: string };

export type LabRecord = RecordBase & {
  type: "lab";
  resultCode: string;
  metrics: LabMetric[];
  attachments: string;
};

export type MedicalRecord = VisitRecord | LabRecord;

// TODO: thay bằng API lấy các phiên khám đã hoàn tất của chính bệnh nhân đang đăng nhập.
// Đây là dữ liệu hồ sơ bệnh án nên backend phải kiểm tra quyền xem.
export const MOCK_RECORDS: MedicalRecord[] = [
  {
    type: "visit",
    id: "rec-gerd",
    title: "Khám Viêm Loét Dạ Dày (GERD)",
    date: "10/10/2026",
    daysFromNow: -14,
    visitCode: "MDC-2025-9921",
    recordCode: "EMR-2026-89102",
    specialty: "Khoa Nội Tiêu Hóa",
    doctor: { name: "TS.BS Lê Quang Huy", dept: "Nội Tiêu Hóa" },
    room: "Phòng 402, Tầng 4, Tòa nhà A (Khu Chuyên gia)",
    reviewed: false,
    paymentStatus: "pending",
    conclusion:
      "Viêm niêm mạc hang vị nhẹ, trào ngược dịch mật độ A, đáp ứng phác đồ điều trị tốt.",
    prescription: {
      code: "DT-1010-092",
      items: [
        {
          no: "01",
          name: "Nexium (Esomeprazole) 40mg",
          qty: "Hộp 28 viên",
          dose: "Liều dùng: Uống 01 viên vào buổi sáng trước bữa ăn 30 phút.",
        },
        {
          no: "02",
          name: "Gaviscon Dual Action",
          qty: "Hộp 24 gói",
          dose: "Liều dùng: Uống 02 gói/ngày sau ăn trưa & tối (hoặc lúc cồn cào).",
        },
      ],
      advice: "Tái khám sau 2 tuần. Kiêng đồ chua cay, dầu mỡ, cà phê và bia rượu.",
      signature: "Ký số: TS.BS Lê Quang Huy (VNPT-CA)",
    },
    adherence: "Bệnh nhân đã tuân thủ 14/14 ngày dùng thuốc",
  },
  {
    type: "visit",
    id: "rec-7310",
    title: "Khám Thần Kinh Sọ Não",
    date: "04/10/2026",
    daysFromNow: -20,
    visitCode: "MDC-2025-7310",
    recordCode: "EMR-2026-77310",
    specialty: "Khoa Thần Kinh",
    doctor: { name: "BSCKII Đỗ Viết Minh", dept: "Thần Kinh" },
    room: "Phòng 310, Tầng 3, Tòa B",
    reviewed: false,
    paymentStatus: "paid",
    conclusion: "Chưa ghi nhận tổn thương thần kinh khu trú, theo dõi và tái khám khi cần.",
  },
  {
    type: "lab",
    id: "rec-checkup",
    title: "Khám Sức Khỏe Tổng Quát & Xét Nghiệm Máu Định Kỳ",
    date: "15/08/2026",
    daysFromNow: -70,
    visitCode: "MDC-2025-4412",
    resultCode: "CLS-2026-4412",
    specialty: "Khoa Nội Tiết",
    doctor: { name: "BSCKII Vũ Đình Hải", dept: "Nội Tiết & Chuyển Hóa" },
    room: "Khu Xét nghiệm, Tầng 1, Tòa B",
    reviewed: false,
    paymentStatus: "paid",
    metrics: [
      { label: "Đường huyết (HbA1c)", value: "5.4%", note: "Bình thường (4.0 - 5.6%)" },
      { label: "Cholesterol Toàn phần", value: "4.8 mmol/L", note: "Chỉ số an toàn" },
      { label: "Men gan (AST / ALT)", value: "24 / 28 U/L", note: "Bình thường" },
      { label: "Siêu âm ổ bụng", value: "Không khối u", note: "Gan nhiễm mỡ nhẹ độ 1" },
    ],
    attachments: "Đính kèm 03 tệp PDF chẩn đoán hình ảnh và xét nghiệm sinh hóa",
  },
  {
    type: "visit",
    id: "rec-6654",
    title: "Khám Nội Tiêu Hóa",
    date: "10/08/2026",
    daysFromNow: -75,
    visitCode: "MDC-2025-6654",
    recordCode: "EMR-2026-66540",
    specialty: "Khoa Nội Tiêu Hóa",
    doctor: { name: "TS.BS Hoàng Thảo Chi", dept: "Nội Tiêu Hóa" },
    room: "Phòng 401, Tầng 4, Tòa A",
    reviewed: true,
    paymentStatus: "paid",
    conclusion: "Rối loạn tiêu hóa chức năng, điều chỉnh chế độ ăn và theo dõi.",
  },
];