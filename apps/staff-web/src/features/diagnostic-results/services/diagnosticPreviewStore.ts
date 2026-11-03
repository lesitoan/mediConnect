import { LAB_CATALOG } from "@/features/examinations/constants";
import type { Examination } from "@/features/examinations/types/examinationTypes";
import { getCompletionError } from "../diagnosticUtils";
import {
  MAX_DIAGNOSTIC_IMAGES,
  type DiagnosticImage,
  type DiagnosticOrder,
  type DiagnosticVisit,
} from "../types/diagnosticTypes";

const EMPTY_ORDERS: readonly DiagnosticOrder[] = [];
let orders: readonly DiagnosticOrder[] = EMPTY_ORDERS;
let ownerId: string | undefined;
const listeners = new Set<() => void>();
function publish(next: readonly DiagnosticOrder[]) {
  orders = next;
  listeners.forEach((listener) => listener());
}
export function subscribeDiagnosticPreview(listener: () => void) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}
export function getDiagnosticPreview() {
  return orders;
}
export function getServerDiagnosticPreview() {
  return EMPTY_ORDERS;
}
function orderId(sessionId: string, service: string) {
  return sessionId + "::" + service;
}

// shortcut: UI-only state lives in this tab's memory; replace with staff APIs before clinical use.
export function registerDiagnosticOrders(
  item: Pick<
    Examination,
    | "id"
    | "careSessionId"
    | "patientName"
    | "patientCode"
    | "demographics"
    | "room"
    | "labOrders"
    | "labReason"
    | "labNotes"
    | "status"
    | "isLocked"
  >,
) {
  if (
    item.isLocked ||
    !["IN_PROGRESS", "WAITING_RESULTS"].includes(item.status)
  )
    return;
  const careSessionId = item.careSessionId ?? item.id;
  const services = [
    ...new Set(
      item.labOrders
        .split(";")
        .map((value) => value.trim())
        .filter(Boolean),
    ),
  ];
  const visit: DiagnosticVisit = {
    careSessionId,
    examinationCode: item.id,
    patientName: item.patientName,
    patientCode: item.patientCode,
    demographics: item.demographics,
    room: item.room,
    reason: item.labReason ?? "",
    instructions: item.labNotes ?? "",
  };
  const removed = orders.filter(
    (order) =>
      order.visit.careSessionId === careSessionId &&
      order.status !== "COMPLETED" &&
      !services.includes(order.service),
  );
  const existing = orders.filter((order) => !removed.includes(order));
  let hasChanges = removed.length > 0;
  const next = existing.map((order) => {
    if (
      order.visit.careSessionId !== careSessionId ||
      JSON.stringify(order.visit) === JSON.stringify(visit)
    )
      return order;
    hasChanges = true;
    return { ...order, visit };
  });
  for (const service of services) {
    const id = orderId(careSessionId, service);
    if (next.some((order) => order.id === id)) continue;
    const catalog = LAB_CATALOG.find(
      (entry) => entry.name === service || entry.code === service,
    );
    next.push({
      id,
      visit,
      service,
      serviceCode: catalog?.code ?? "CLS",
      category:
        catalog?.category === "IMAGING"
          ? "IMAGING"
          : catalog?.category === "FUNCTION"
            ? "FUNCTION"
            : "LAB",
      status: "WAITING",
      orderedAt: new Date().toISOString(),
      conclusion: "",
      images: [],
    });
    hasChanges = true;
  }
  if (hasChanges) {
    publish(next);
    removed.forEach((order) =>
      order.images.forEach((image) => URL.revokeObjectURL(image.url)),
    );
  }
}
function changeOrder(
  id: string,
  change: (order: DiagnosticOrder) => DiagnosticOrder,
) {
  const current = orders.find((order) => order.id === id);
  if (!current) throw new Error("Không tìm thấy chỉ định.");
  publish(orders.map((order) => (order.id === id ? change(current) : order)));
}
function assertDraft(order: DiagnosticOrder) {
  if (order.status !== "IN_PROGRESS")
    throw new Error("Chỉ định chưa tiếp nhận hoặc đã hoàn tất.");
}
export function receiveDiagnosticOrder(id: string) {
  changeOrder(id, (order) => {
    if (order.status !== "WAITING")
      throw new Error("Chỉ định đã được tiếp nhận.");
    return { ...order, status: "IN_PROGRESS" };
  });
}
export function updateDiagnosticConclusion(id: string, conclusion: string) {
  changeOrder(id, (order) => {
    assertDraft(order);
    return { ...order, conclusion: conclusion.slice(0, 10000) };
  });
}
export function appendDiagnosticImages(id: string, images: DiagnosticImage[]) {
  changeOrder(id, (order) => {
    assertDraft(order);
    if (order.images.length + images.length > MAX_DIAGNOSTIC_IMAGES)
      throw new Error("Mỗi chỉ định tối đa 6 ảnh.");
    return { ...order, images: [...order.images, ...images] };
  });
}
export function removeDiagnosticImage(id: string, imageId: string) {
  const current = orders.find((order) => order.id === id);
  const image = current?.images.find((image) => image.id === imageId);
  changeOrder(id, (order) => {
    assertDraft(order);
    return {
      ...order,
      images: order.images.filter((image) => image.id !== imageId),
    };
  });
  if (image) URL.revokeObjectURL(image.url);
}
export function completeDiagnosticOrder(id: string, recordedBy: string) {
  changeOrder(id, (order) => {
    const error = getCompletionError(order);
    if (error) throw new Error(error);
    return {
      ...order,
      status: "COMPLETED",
      conclusion: order.conclusion.trim(),
      completedAt: new Date().toISOString(),
      recordedBy,
    };
  });
}
export function ensureDiagnosticDemoOrders() {
  if (orders.some((order) => order.visit.careSessionId.startsWith("demo-cls-")))
    return;
  registerDiagnosticOrders({
    status: "IN_PROGRESS",
    id: "DEMO-001",
    careSessionId: "demo-cls-001",
    patientName: "Nguyễn Minh An (minh họa)",
    patientCode: "BN-DEMO-001",
    demographics: "Nam · 36 tuổi",
    room: "P101",
    labOrders: "Troponin T định lượng (hs-cTnT); Siêu âm tim Doppler màu",
    labReason: "Theo dõi đau ngực, bổ sung kết quả cho phiên khám.",
    labNotes: "Đối chiếu họ tên và mã bệnh nhân trước khi trả kết quả.",
  });
  registerDiagnosticOrders({
    status: "IN_PROGRESS",
    id: "DEMO-002",
    careSessionId: "demo-cls-002",
    patientName: "Trần Hà Linh (minh họa)",
    patientCode: "BN-DEMO-002",
    demographics: "Nữ · 42 tuổi",
    room: "P102",
    labOrders: "Troponin T định lượng (hs-cTnT)",
    labReason: "Kiểm tra theo chỉ định bác sĩ.",
    labNotes: "",
  });
}

export function getDiagnosticPreviewOwner() {
  return ownerId;
}
export function setDiagnosticPreviewOwner(nextOwner: string | undefined) {
  if (nextOwner === ownerId) return;
  const previous = orders;
  ownerId = nextOwner;
  publish(EMPTY_ORDERS);
  previous.forEach((order) =>
    order.images.forEach((image) => URL.revokeObjectURL(image.url)),
  );
}
