import {
  MAX_DIAGNOSTIC_IMAGES,
  MAX_DIAGNOSTIC_IMAGE_BYTES,
  type DiagnosticOrder,
} from "./types/diagnosticTypes";

export function validateDiagnosticFiles(
  files: readonly Pick<File, "type" | "size">[],
  existingCount: number,
): string | null {
  if (!files.length) return "Chưa chọn ảnh kết quả.";
  if (existingCount + files.length > MAX_DIAGNOSTIC_IMAGES)
    return "Mỗi chỉ định được đính kèm tối đa 6 ảnh.";
  if (
    files.some(
      (file) =>
        !["image/jpeg", "image/png", "image/webp"].includes(file.type) ||
        !file.size ||
        file.size > MAX_DIAGNOSTIC_IMAGE_BYTES,
    )
  )
    return "Chọn ảnh JPG, PNG hoặc WebP, mỗi ảnh tối đa 5 MB.";
  return null;
}
export function getCompletionError(order: DiagnosticOrder): string | null {
  if (order.status !== "IN_PROGRESS")
    return "Chỉ có thể hoàn tất chỉ định đang thực hiện.";
  if (!order.images.length) return "Cần đính kèm ít nhất một ảnh kết quả.";
  if (!order.conclusion.trim())
    return "Nhập nhận xét hoặc kết luận trước khi hoàn tất.";
  return null;
}
export function getPublishedDiagnosticResults(
  orders: readonly DiagnosticOrder[],
  careSessionId: string,
) {
  return orders.filter(
    (order) =>
      order.visit.careSessionId === careSessionId &&
      order.status === "COMPLETED",
  );
}
export function formatDiagnosticTime(value: string) {
  return new Intl.DateTimeFormat("vi-VN", {
    dateStyle: "short",
    timeStyle: "short",
    timeZone: "Asia/Ho_Chi_Minh",
  }).format(new Date(value));
}
