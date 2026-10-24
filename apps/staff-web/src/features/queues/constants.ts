import type {
  QueueAction,
  QueueActionContent,
  QueueFilterValues,
  QueueItem,
  QueueStatus,
} from "./types/queueTypes";

export const EMPTY_QUEUE_ITEMS: QueueItem[] = [];

export const QUEUE_STORAGE_KEY = "mediconnect.staff.queues.demo.v1";

export const QUEUE_STATUSES: QueueStatus[] = [
  "WAITING",
  "CALLING",
  "IN_PROGRESS",
  "SKIPPED",
];

export const QUEUE_SEARCH_DEBOUNCE_MS = 300;

export const QUEUE_ERROR_MESSAGES = {
  NOT_FOUND: "Không tìm thấy lượt chờ. Vui lòng làm mới danh sách.",
  STATUS_CHANGED:
    "Trạng thái lượt chờ đã thay đổi. Vui lòng kiểm tra lại trước khi thao tác.",
  STATUS_CHANGED_HINT:
    "Trạng thái lượt chờ đã thay đổi. Vui lòng đóng hộp thoại và kiểm tra lại.",
  UPDATE_FAILED: "Không thể cập nhật lượt chờ. Vui lòng thử lại.",
  OPERATION_FAILED: "Không thể xử lý hàng chờ. Vui lòng thử lại.",
  BROWSER_REQUIRED: "Vui lòng thao tác trên trình duyệt.",
  STORAGE_FAILED:
    "Không thể lưu thay đổi hàng chờ. Vui lòng kiểm tra quyền lưu trữ của trình duyệt và thử lại.",
};

export const DEFAULT_QUEUE_FILTERS: QueueFilterValues = {
  search: "",
  specialtyId: "ALL",
  doctorId: "ALL",
};

export const QUEUE_COLUMNS: { status: QueueStatus; label: string }[] = [
  { status: "WAITING", label: "Đang chờ" },
  { status: "CALLING", label: "Đang gọi" },
  { status: "IN_PROGRESS", label: "Đang khám" },
  { status: "SKIPPED", label: "Bỏ qua lượt" },
];

export const QUEUE_STATUS_LABELS: Record<QueueStatus, string> = {
  WAITING: "Đang chờ",
  CALLING: "Đang gọi",
  IN_PROGRESS: "Đang khám",
  SKIPPED: "Bỏ qua lượt",
};

export const QUEUE_ACTION_LABELS: Record<QueueAction, string> = {
  CALL: "Gọi khám",
  SKIP: "Bỏ qua",
  RESTORE: "Đưa trở lại",
};

export const QUEUE_TRANSITIONS: Record<
  QueueAction,
  { from: QueueStatus; to: QueueStatus }
> = {
  CALL: { from: "WAITING", to: "CALLING" },
  SKIP: { from: "CALLING", to: "SKIPPED" },
  RESTORE: { from: "SKIPPED", to: "WAITING" },
};

export const QUEUE_ACTION_CONTENT: Record<QueueAction, QueueActionContent> = {
  CALL: {
    title: "Xác nhận gọi bệnh nhân",
    confirmLabel: "Xác nhận gọi",
    description: "Sau xác nhận, lượt chờ được chuyển sang Đang gọi.",
    successMessage: "Đã chuyển bệnh nhân sang danh sách Đang gọi.",
  },
  SKIP: {
    title: "Bỏ qua lượt khám",
    confirmLabel: "Xác nhận bỏ qua",
    description:
      "Bệnh nhân sẽ chuyển sang danh sách Bỏ qua lượt và có thể được đưa trở lại hàng chờ theo quy tắc hệ thống.",
    successMessage: "Đã bỏ qua lượt khám của bệnh nhân.",
  },
  RESTORE: {
    title: "Đưa trở lại hàng chờ",
    confirmLabel: "Xác nhận đưa trở lại",
    description:
      "Hệ thống tính lại vị trí hàng chờ theo quy tắc đã định, không đưa bệnh nhân xuống cuối danh sách.",
    successMessage:
      "Đã đưa bệnh nhân trở lại hàng chờ theo thứ tự ưu tiên ban đầu.",
  },
};

export const INITIAL_QUEUE_ITEMS: QueueItem[] = [
  {
    id: "queue-23",
    queueNumber: "A-023",
    queuePosition: 23,
    patientId: "BN-99214",
    patientName: "Nguyễn Thị Thu Hà",
    appointmentStart: "09:00",
    appointmentEnd: "09:30",
    doctorId: "doc-3",
    doctorName: "TS.BS Lê Quang Huy",
    specialtyId: "spec-3",
    specialtyName: "Tim mạch Can thiệp",
    room: "P.302",
    visitType: "APPOINTMENT",
    arrivalStatus: "ON_TIME",
    status: "WAITING",
  },
  {
    id: "queue-24",
    queueNumber: "A-024",
    queuePosition: 24,
    patientId: "BN-99215",
    patientName: "Trần Đình Mạnh",
    appointmentStart: "09:15",
    appointmentEnd: "09:45",
    doctorId: "doc-2",
    doctorName: "BS.CKII Vũ Đình Trọng",
    specialtyId: "spec-2",
    specialtyName: "Nội tiết & Chuyển hóa",
    room: "P.301",
    visitType: "APPOINTMENT",
    arrivalStatus: "LATE",
    status: "WAITING",
  },
  {
    id: "queue-22",
    queueNumber: "A-022",
    queuePosition: 22,
    patientId: "BN-99213",
    patientName: "Hoàng Mai Linh",
    appointmentStart: "08:45",
    appointmentEnd: "09:15",
    doctorId: "doc-3",
    doctorName: "TS.BS Lê Quang Huy",
    specialtyId: "spec-3",
    specialtyName: "Tim mạch Can thiệp",
    room: "P.302",
    visitType: "APPOINTMENT",
    arrivalStatus: "ON_TIME",
    status: "CALLING",
  },
  {
    id: "queue-25",
    queueNumber: "A-025",
    queuePosition: 25,
    patientId: "BN-99216",
    patientName: "Đỗ Ngọc Anh",
    appointmentStart: "09:30",
    appointmentEnd: "10:00",
    doctorId: "doc-3",
    doctorName: "TS.BS Lê Quang Huy",
    specialtyId: "spec-3",
    specialtyName: "Tim mạch Can thiệp",
    room: "P.302",
    visitType: "APPOINTMENT",
    arrivalStatus: "ON_TIME",
    status: "CALLING",
  },
  {
    id: "queue-21",
    queueNumber: "A-021",
    queuePosition: 21,
    patientId: "BN-99212",
    patientName: "Vũ Hải Đăng",
    appointmentStart: "08:30",
    appointmentEnd: "09:00",
    doctorId: "doc-3",
    doctorName: "TS.BS Lê Quang Huy",
    specialtyId: "spec-3",
    specialtyName: "Tim mạch Can thiệp",
    room: "P.302",
    visitType: "APPOINTMENT",
    arrivalStatus: "ON_TIME",
    status: "IN_PROGRESS",
  },
  {
    id: "queue-16",
    queueNumber: "A-016",
    queuePosition: 16,
    patientId: "BN-99207",
    patientName: "Dương Quốc Bảo",
    appointmentStart: "08:00",
    appointmentEnd: "08:30",
    doctorId: "doc-1",
    doctorName: "PGS.TS.BS Trần Minh Thảo",
    specialtyId: "spec-1",
    specialtyName: "Nhi & Sơ sinh",
    room: "P.205",
    visitType: "APPOINTMENT",
    arrivalStatus: "LATE",
    status: "SKIPPED",
  },
];
