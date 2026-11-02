import type { ExaminationStatus } from "./types/examinationTypes";
import { QUEUE_STATUS_PRESENTATION } from "@/features/queues/constants";

export const EXAMINATION_STATUS: Record<
  ExaminationStatus,
  { label: string; className: string }
> = {
  CALLED: {
    label: QUEUE_STATUS_PRESENTATION.CALLED.label,
    className: "bg-primary-light text-primary",
  },
  IN_PROGRESS: {
    label: QUEUE_STATUS_PRESENTATION.IN_CONSULTATION.label,
    className: "bg-success-bg text-success",
  },
  WAITING_RESULTS: {
    label: "Chờ kết quả CLS",
    className: "bg-primary-light text-primary",
  },
  PAUSED: { label: "Tạm dừng", className: "bg-warning-bg text-warning" },
  INCOMPLETE: { label: "Chưa hoàn chỉnh", className: "bg-warning-bg text-warning" },
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
