import type {
  ConsultationSession,
  ConsultationTab,
} from "./types/consultationTypes";

export const CONSULTATION_PAGE_SIZE = 3;

export const CONSULTATION_TABS: readonly {
  id: ConsultationTab;
  label: string;
}[] = [
  { id: "ALL", label: "Tất cả phiên khám" },
  { id: "IN_PROGRESS", label: "Đang khám" },
  { id: "WAITING_LAB", label: "Chờ kết quả CLS" },
  { id: "PAUSED", label: "Tạm dừng" },
];

export const CONSULTATION_SESSIONS: readonly ConsultationSession[] = [
  {
    id: "consultation-8896",
    patientName: "Nguyễn Thị Thu Hà",
    patientAge: 32,
    patientGender: "FEMALE",
    patientCode: "BN-99214",
    sessionCode: "PK-8896",
    queueNumber: "A-023",
    room: "P.302",
    status: "IN_PROGRESS",
    dateLabel: "Hôm nay",
    shiftLabel: "Ca sáng (07:30–12:00)",
    actionLabel: "Tiếp tục khám",
  },
  {
    id: "consultation-8892",
    patientName: "Trần Đình Mạnh",
    patientAge: 48,
    patientGender: "MALE",
    patientCode: "BN-84102",
    sessionCode: "PK-8892",
    queueNumber: "A-024",
    room: "P.302",
    status: "WAITING_LAB",
    dateLabel: "Hôm nay",
    shiftLabel: "Ca sáng (07:30–12:00)",
    actionLabel: "Xem KQ & Tiếp tục",
  },
  {
    id: "consultation-8889",
    patientName: "Đỗ Ngọc Ánh",
    patientAge: 27,
    patientGender: "FEMALE",
    patientCode: "BN-66231",
    sessionCode: "PK-8889",
    queueNumber: "A-025",
    room: "P.302",
    status: "PAUSED",
    dateLabel: "Hôm nay",
    shiftLabel: "Ca sáng (07:30–12:00)",
    actionLabel: "Tiếp tục khám",
  },
];
