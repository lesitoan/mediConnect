import type {
  ApprovalRequestStatus,
  ApprovalRequestType,
} from "./types/approvalTypes";

export function getApprovalStatusLabel(
  status: ApprovalRequestStatus,
  isUrgent?: boolean,
): string {
  if (isUrgent || status === "URGENT") return "Khẩn cấp";
  switch (status) {
    case "APPROVED":
      return "Đã duyệt";
    case "PENDING":
      return "Chờ duyệt";
    case "REJECTED":
      return "Từ chối";
    default:
      return status;
  }
}

export function getApprovalStatusBadgeVariant(
  status: ApprovalRequestStatus,
  isUrgent?: boolean,
): "danger" | "success" | "warning" | "neutral" {
  if (isUrgent || status === "URGENT") return "danger";
  switch (status) {
    case "APPROVED":
      return "success";
    case "PENDING":
      return "warning";
    case "REJECTED":
      return "neutral";
    default:
      return "neutral";
  }
}

export function getApprovalTypeLabel(type: ApprovalRequestType): string {
  switch (type) {
    case "EMERGENCY_LEAVE":
      return "Báo vắng đột xuất";
    case "SWAP_SHIFT":
      return "Đổi ca trực";
    case "PLANNED_LEAVE":
      return "Nghỉ có kế hoạch";
    case "CROSS_SWAP":
      return "Đổi chéo ca";
    default:
      return type;
  }
}
