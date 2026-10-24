import { DEFAULT_PAGE_SIZE } from "@/constants/constants";
import type {
  ExceptionAppointment,
  ExceptionFilterValues,
  ExceptionGroup,
  ExceptionStatus,
  ReplacementDoctor,
} from "./types/exceptionTypes";

export const EMPTY_EXCEPTION_GROUPS: ExceptionGroup[] = [];
export const EXCEPTION_STORAGE_KEY = "mediconnect.staff.exceptions.demo.v1";
export const EXCEPTION_SEARCH_DEBOUNCE_MS = 300;

export const DEFAULT_EXCEPTION_FILTERS: ExceptionFilterValues = {
  search: "",
  status: "ALL",
  urgency: "ALL",
  page: 1,
  pageSize: DEFAULT_PAGE_SIZE,
};

export const EXCEPTION_STATUS_LABELS: Record<ExceptionStatus, string> = {
  PENDING: "Chờ xử lý",
  AWAITING_CONFIRMATION: "Chờ bệnh nhân xác nhận",
  RESOLVED: "Đã xử lý",
  COMPLETED: "Hoàn tất",
};

export const EXCEPTION_STATUS_OPTIONS: {
  value: ExceptionStatus;
  label: string;
}[] = [
  { value: "PENDING", label: "Chờ xử lý" },
  { value: "AWAITING_CONFIRMATION", label: "Chờ xác nhận" },
  { value: "RESOLVED", label: "Đã xử lý" },
  { value: "COMPLETED", label: "Hoàn tất" },
];

export const EXCEPTION_ERROR_MESSAGES = {
  NOT_FOUND:
    "Không tìm thấy lịch hẹn bị ảnh hưởng. Vui lòng tải lại danh sách.",
  STATUS_CHANGED:
    "Lịch hẹn đã được xử lý hoặc đang chờ bệnh nhân xác nhận. Vui lòng kiểm tra lại.",
  DOCTOR_UNAVAILABLE:
    "Bác sĩ thay thế không khả dụng trong khung giờ này. Vui lòng chọn lại.",
  OPERATION_FAILED: "Không thể xử lý ngoại lệ. Vui lòng thử lại.",
  STORAGE_FAILED:
    "Không thể lưu đề xuất. Vui lòng kiểm tra quyền lưu trữ của trình duyệt và thử lại.",
  BROWSER_REQUIRED: "Vui lòng thao tác trên trình duyệt.",
};

export const REASSIGNMENT_SUCCESS_MESSAGE =
  "Đã tạo đề xuất đổi bác sĩ. Lịch hẹn đang chờ bệnh nhân xác nhận.";
export const REASSIGNMENT_DESCRIPTION =
  "Đề xuất đổi bác sĩ sẽ được gửi cho bệnh nhân xem xét. Lịch hẹn chỉ được cập nhật sau khi bệnh nhân đồng ý và hệ thống kiểm tra lại lịch trống.";

const CARDIOLOGY_APPOINTMENT: Omit<
  ExceptionAppointment,
  | "id"
  | "code"
  | "patientId"
  | "patientName"
  | "startTime"
  | "endTime"
  | "status"
> = {
  doctorId: "doc-3",
  doctorName: "TS.BS Lê Quang Huy",
  specialtyId: "spec-3",
  specialtyName: "Tim mạch",
  room: "P.302",
  paymentAmount: 350000,
  paymentStatus: "PAID",
};

const ENDOCRINOLOGY_APPOINTMENT: typeof CARDIOLOGY_APPOINTMENT = {
  doctorId: "doc-2",
  doctorName: "BS.CKII Vũ Đình Trọng",
  specialtyId: "spec-2",
  specialtyName: "Nội tiết & Chuyển hóa",
  room: "P.301",
  paymentAmount: 300000,
  paymentStatus: "PAID",
};

export const INITIAL_EXCEPTION_GROUPS: ExceptionGroup[] = [
  {
    id: "exception-huy-20261016",
    title: "Bác sĩ Lê Quang Huy vắng đột xuất",
    reason: "Bác sĩ vắng đột xuất",
    date: "2026-10-16",
    urgency: "URGENT",
    appointments: [
      {
        ...CARDIOLOGY_APPOINTMENT,
        id: "exception-appointment-1",
        code: "LH-261016-001",
        patientId: "BN-99214",
        patientName: "Nguyễn Thị Thu Hà",
        startTime: "09:00",
        endTime: "09:30",
        status: "PENDING",
      },
      {
        ...CARDIOLOGY_APPOINTMENT,
        id: "exception-appointment-2",
        code: "LH-261016-002",
        patientId: "BN-99215",
        patientName: "Trần Đình Mạnh",
        startTime: "09:30",
        endTime: "10:00",
        status: "PENDING",
      },
      {
        ...CARDIOLOGY_APPOINTMENT,
        id: "exception-appointment-3",
        code: "LH-261016-003",
        patientId: "BN-99213",
        patientName: "Hoàng Mai Linh",
        startTime: "10:00",
        endTime: "10:30",
        status: "AWAITING_CONFIRMATION",
        proposedDoctorId: "replacement-tung",
        proposedDoctorName: "BS.CKI Nguyễn Thanh Tùng",
      },
      {
        ...CARDIOLOGY_APPOINTMENT,
        id: "exception-appointment-4",
        code: "LH-261016-004",
        patientId: "BN-99216",
        patientName: "Đỗ Ngọc Ánh",
        startTime: "10:30",
        endTime: "11:00",
        status: "RESOLVED",
        proposedDoctorId: "replacement-tung",
        proposedDoctorName: "BS.CKI Nguyễn Thanh Tùng",
      },
      {
        ...CARDIOLOGY_APPOINTMENT,
        id: "exception-appointment-5",
        code: "LH-261016-005",
        patientId: "BN-99212",
        patientName: "Vũ Hải Đăng",
        startTime: "11:00",
        endTime: "11:30",
        status: "PENDING",
        paymentStatus: "UNPAID",
      },
      {
        ...CARDIOLOGY_APPOINTMENT,
        id: "exception-appointment-6",
        code: "LH-261016-006",
        patientId: "BN-99207",
        patientName: "Dương Quốc Bảo",
        startTime: "11:30",
        endTime: "12:00",
        status: "COMPLETED",
        proposedDoctorId: "replacement-phuc",
        proposedDoctorName: "ThS.BS Đặng Hồng Phúc",
      },
    ],
  },
  {
    id: "exception-trong-20261015",
    title: "BS.CKII Vũ Đình Trọng thay đổi lịch công tác",
    reason: "Bác sĩ thay đổi lịch công tác",
    date: "2026-10-15",
    urgency: "PLANNED",
    leadTimeLabel: "Có 24h chuẩn bị",
    appointments: [
      {
        ...ENDOCRINOLOGY_APPOINTMENT,
        id: "exception-appointment-7",
        code: "LH-261015-001",
        patientId: "BN-99301",
        patientName: "Lê Văn Hùng",
        startTime: "08:30",
        endTime: "09:00",
        status: "PENDING",
      },
      {
        ...ENDOCRINOLOGY_APPOINTMENT,
        id: "exception-appointment-8",
        code: "LH-261015-002",
        patientId: "BN-99302",
        patientName: "Ngô Thuỳ Dung",
        startTime: "09:00",
        endTime: "09:30",
        status: "AWAITING_CONFIRMATION",
        proposedDoctorId: "replacement-an",
        proposedDoctorName: "BS.CKI Nguyễn Hoài An",
      },
    ],
  },
];

export const REPLACEMENT_DOCTORS: ReplacementDoctor[] = [
  {
    id: "replacement-tung",
    name: "BS.CKI Nguyễn Thanh Tùng",
    specialtyId: "spec-3",
    specialtyName: "Tim mạch",
    room: "Phòng 301",
    workStart: "08:00",
    workEnd: "17:00",
    busySlots: [{ date: "2026-10-16", startTime: "10:30", endTime: "11:00" }],
  },
  {
    id: "replacement-phuc",
    name: "ThS.BS Đặng Hồng Phúc",
    specialtyId: "spec-3",
    specialtyName: "Tim mạch tổng quát",
    room: "Phòng 304",
    workStart: "08:00",
    workEnd: "17:00",
    busySlots: [
      { date: "2026-10-16", startTime: "09:00", endTime: "09:30" },
      { date: "2026-10-16", startTime: "10:00", endTime: "10:30" },
      { date: "2026-10-16", startTime: "11:30", endTime: "12:00" },
    ],
  },
  {
    id: "replacement-an",
    name: "BS.CKI Nguyễn Hoài An",
    specialtyId: "spec-2",
    specialtyName: "Nội tiết & Chuyển hóa",
    room: "Phòng 305",
    workStart: "08:00",
    workEnd: "17:00",
    busySlots: [],
  },
];
