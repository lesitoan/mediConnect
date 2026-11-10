import { DEFAULT_PAGE_SIZE } from "@/constants/constants";
import type { UserRoleFilter, UserStatusFilter } from "./types/userTypes";
export interface UserTableFilterValues {
  role: UserRoleFilter;
  status: UserStatusFilter;
  specialtyId: string;
  search: string;
  page: number;
  pageSize: number;
}
export const PAGE_SIZE_OPTIONS = [7, 10, 20, 50] as const;
export const DEFAULT_FILTERS: UserTableFilterValues = {
  role: "ALL",
  status: "ALL",
  specialtyId: "",
  search: "",
  page: 1,
  pageSize: DEFAULT_PAGE_SIZE,
};
export interface LockReasonOption {
  value: string;
  label: string;
}

export const LOCK_REASON_OPTIONS: readonly LockReasonOption[] = [
  {
    value: "Thay đổi nhân sự / Nghỉ việc",
    label: "Thay đổi nhân sự / Nghỉ việc",
  },
  {
    value: "Phát hiện đăng nhập bất thường",
    label: "Phát hiện đăng nhập bất thường / Nghi vấn bảo mật",
  },
  {
    value: "Yêu cầu tạm ngưng từ Ban Giám đốc",
    label: "Yêu cầu tạm ngưng từ Ban Giám đốc",
  },
  {
    value: "Vi phạm chính sách bảo mật HIPAA/BYT",
    label: "Vi phạm chính sách bảo mật HIPAA / BYT",
  },
  {
    value: "Khác",
    label: "Lý do khác",
  },
] as const;
