import type {
  ApprovalRequest,
  ApprovalTableFilterValues,
} from "./types/approvalTypes";

export const APPROVAL_TYPE_OPTIONS: readonly {
  value: ApprovalTableFilterValues["type"];
  label: string;
}[] = [
  { value: "ALL", label: "Loại yêu cầu (Tất cả)" },
  { value: "EMERGENCY_LEAVE", label: "Báo vắng đột xuất" },
  { value: "SWAP_SHIFT", label: "Đổi ca trực" },
  { value: "PLANNED_LEAVE", label: "Nghỉ có kế hoạch" },
  { value: "CROSS_SWAP", label: "Đổi chéo ca" },
];

export const APPROVAL_STATUS_OPTIONS: readonly {
  value: ApprovalTableFilterValues["status"];
  label: string;
}[] = [
  { value: "ALL", label: "Trạng thái (Tất cả)" },
  { value: "URGENT", label: "Khẩn cấp" },
  { value: "PENDING", label: "Chờ duyệt" },
  { value: "APPROVED", label: "Đã duyệt" },
  { value: "REJECTED", label: "Từ chối" },
];

export const INITIAL_APPROVAL_REQUESTS: ApprovalRequest[] = [
  {
    id: "req-1",
    requestCode: "REQ-0091",
    doctorId: "doc-7",
    doctorCode: "DOC-105",
    doctorName: "BS. Nguyễn Văn Hùng",
    specialtyName: "Khoa Ngoại Tiêu hóa",
    type: "EMERGENCY_LEAVE",
    typeName: "Báo vắng đột xuất",
    reason: "Viêm ruột thừa cấp, nhập viện mổ cấp cứu tại BV Chợ Rẫy",
    date: "16/03/2026",
    shiftTime: "Ca sáng · 07:30–12:00",
    status: "URGENT",
    isUrgent: true,
    createdAt: "2026-03-16T06:12:00Z",
  },
  {
    id: "req-2",
    requestCode: "REQ-0089",
    doctorId: "doc-4",
    doctorCode: "DOC-034",
    doctorName: "ThS.BS Hoàng Thu Trang",
    specialtyName: "Khoa Nhi & Sơ sinh",
    type: "SWAP_SHIFT",
    typeName: "Đổi ca trực",
    reason: "Đi hội nghị Nhi khoa miền Nam tại TP.HCM",
    date: "19/03/2026",
    shiftTime: "Sáng ➔ Chiều",
    status: "PENDING",
    targetDoctorId: "doc-1",
    targetDoctorName: "PGS.TS Trần Minh Thảo",
    createdAt: "2026-03-15T14:20:00Z",
  },
  {
    id: "req-3",
    requestCode: "REQ-0087",
    doctorId: "doc-2",
    doctorCode: "DOC-042",
    doctorName: "BS.CKII Vũ Đình Trọng",
    specialtyName: "Khoa Nội tiết & Chuyển hóa",
    type: "PLANNED_LEAVE",
    typeName: "Nghỉ có kế hoạch",
    reason: "Nghỉ phép thường niên",
    date: "17/03/2026",
    shiftTime: "Ca cả ngày",
    status: "PENDING",
    createdAt: "2026-03-14T09:15:00Z",
  },
  {
    id: "req-4",
    requestCode: "REQ-0085",
    doctorId: "doc-5",
    doctorCode: "DOC-077",
    doctorName: "BS.CKI Phạm Minh Đức",
    specialtyName: "Khoa Mắt & Nhãn khoa",
    type: "CROSS_SWAP",
    typeName: "Đổi ca trực",
    reason: "Đổi chéo giữa 2 ca cùng tuần",
    date: "20/03/2026",
    shiftTime: "Ca sáng · 07:30–12:00",
    status: "PENDING",
    createdAt: "2026-03-13T16:45:00Z",
  },
];

export const DEFAULT_PAGE_SIZE = 10;

export const DEFAULT_FILTERS: ApprovalTableFilterValues = {
  search: "",
  type: "ALL",
  status: "ALL",
  page: 1,
  pageSize: DEFAULT_PAGE_SIZE,
};
