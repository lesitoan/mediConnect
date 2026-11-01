import type { ApiError } from "@/types/apiTypes";

export function getApiErrorMessage(error: unknown): string {
  if (error && typeof error === "object") {
    const status = (error as Partial<ApiError>).status;
    if (status === 401)
      return "Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.";
    if (status === 403) return "Bạn không có quyền thực hiện thao tác này.";
    if ("message" in error && typeof error.message === "string")
      return error.message;
  }
  return "Không thể thực hiện thao tác. Vui lòng thử lại.";
}
