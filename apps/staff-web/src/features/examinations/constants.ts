import type { Examination, ExaminationStatus } from "./types/examinationTypes";
export const EXAMINATION_STATUS: Record<
  ExaminationStatus,
  { label: string; className: string }
> = {
  IN_PROGRESS: { label: "Đang khám", className: "bg-success-bg text-success" },
  WAITING_RESULTS: {
    label: "Chờ kết quả CLS",
    className: "bg-primary-light text-primary",
  },
  PAUSED: { label: "Tạm dừng", className: "bg-warning-bg text-warning" },
  COMPLETED: { label: "Hoàn tất", className: "bg-neutral-bg text-muted" },
};
export const EXAMINATION_FILTERS = {
  visit: "",
  search: "",
  status: "ALL",
  date: "",
  page: 1,
  pageSize: 7,
};
// shortcut: synthetic UI records stay in memory; replace with doctor-scoped queries when those endpoints exist.
export function createDemoExaminations(date: string): Examination[] {
  return [
    {
      id: "PK-8896",
      patientName: "Nguyễn Thị Thu Hà",
      patientCode: "BN-99214",
      demographics: "Nữ · 32 tuổi",
      queueNumber: "STT A-023",
      room: "P.302",
      date,
      shift: "Ca sáng (07:30–12:00)",
      status: "IN_PROGRESS",
      allergy: "Penicillin / Amoxicillin",
      history: "Tăng huyết áp · Rối loạn lipid máu",
      complaint:
        "Hồi hộp, đánh trống ngực từng cơn, đau tức nhẹ vùng ngực trái khi gắng sức (đi bộ lên lầu 3) xuất hiện khoảng 3 ngày nay. Cơn kéo dài khoảng 3–5 phút, giảm khi nghỉ ngơi hoàn toàn. Không khó thở về đêm, không phù chân.",
      clinicalNotes:
        "- Tim mạch: Lồng ngực cân đối, mỏm tim đập ở khoang liên sườn V đường trung đòn trái, diện đập 1.5 cm. T1, T2 đều, rõ, tần số 82 ck/p. Không nghe tiếng thổi bệnh lý tại các van, không có tiếng T3, T4. Không có tiếng cọ màng tim.\n- Hô hấp: Lồng ngực di động đều theo nhịp thở. Rì rào phế nang êm dịu 2 phế trường, không ran ẩm, không ran rít.\n- Bụng: Mềm, không chướng. Gan lách không sờ thấy.",
      diagnosis: "I20.0 — Cơn đau thắt ngực không ổn định",
      prescription: "",
      labOrders: "",
      followUpDate: "",
      transfer: "",
    },
    {
      id: "PK-8892",
      patientName: "Trần Đình Mạnh",
      patientCode: "BN-08417",
      demographics: "Nam · 48 tuổi",
      queueNumber: "STT A-024",
      room: "P.302",
      date,
      shift: "Ca sáng (07:30–12:00)",
      status: "WAITING_RESULTS",
      allergy: "Chưa ghi nhận",
      history: "Chưa ghi nhận",
      complaint: "Tái khám theo lịch hẹn.",
      clinicalNotes: "",
      diagnosis: "",
      prescription: "",
      labOrders: "Công thức máu (đang chờ)",
      followUpDate: "",
      transfer: "",
    },
    {
      id: "PK-8889",
      patientName: "Đỗ Ngọc An",
      patientCode: "BN-08321",
      demographics: "Nam · 27 tuổi",
      queueNumber: "STT A-023",
      room: "P.302",
      date,
      shift: "Ca sáng (07:30–12:00)",
      status: "PAUSED",
      allergy: "Chưa ghi nhận",
      history: "Chưa ghi nhận",
      complaint: "Khám theo hẹn.",
      clinicalNotes: "",
      diagnosis: "",
      prescription: "",
      labOrders: "",
      followUpDate: "",
      transfer: "",
    },
  ];
}

export const DIAGNOSIS_CATALOG = [
  { code: "I20.0", name: "Cơn đau thắt ngực không ổn định" },
  { code: "I20.9", name: "Đau thắt ngực, không xác định (Angina pectoris)" },
  { code: "I10", name: "Tăng huyết áp vô căn (nguyên phát)" },
  { code: "E78.0", name: "Rối loạn lipid máu nhẹ" },
];
export const LAB_CATALOG = [
  {
    code: "TDCN-01",
    name: "Điện tâm đồ thường (ECG 12 chuyển đạo)",
    category: "FUNCTION",
  },
  { code: "CDHA-03", name: "Siêu âm tim Doppler màu", category: "IMAGING" },
  {
    code: "XN-SH-09",
    name: "Troponin T định lượng (hs-cTnT)",
    category: "LAB",
  },
];
export const ALLERGY_DETAILS =
  "Tiền sử sốc phản vệ độ II, phù mạch (Quincke) & mày đay lan tỏa năm 2021. Tuyệt đối chống chỉ định kháng sinh nhóm Beta-lactam.";
