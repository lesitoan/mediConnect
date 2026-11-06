"use client";
import { useState } from "react";
import toast from "react-hot-toast";
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle, DrawerDescription, DrawerFooter } from "@/components/ui/Drawer";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/Dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/Input";
import { Textarea } from "@/components/ui/Textarea";
import { Badge } from "@/components/ui/Badge";
import { DIAGNOSTIC_CATEGORY_LABELS, DIAGNOSTIC_STATUS_LABELS, type DiagnosticOrder } from "../types/diagnosticTypes";
import { getCompletionError, validateDiagnosticFiles } from "../diagnosticUtils";
import { DiagnosticImageGallery } from "./DiagnosticImageGallery";
import { completeDiagnosticResult, receiveDiagnosticResult, removeDiagnosticImage, uploadDiagnosticImage } from "../services/diagnosticResultsService";

export function DiagnosticResultEditor({ order: initialOrder, onClose, onViewRecord, onChanged }: { order: DiagnosticOrder; onClose: () => void; onViewRecord: (sessionId: string) => void; onChanged: () => Promise<void> }) {
  const [order, setOrder] = useState(initialOrder);
  const [conclusion, setConclusion] = useState(initialOrder.conclusion);
  const [isBusy, setIsBusy] = useState(false);
  const [isConfirming, setIsConfirming] = useState(false);
  const [error, setError] = useState("");
  const isReadOnly = order.status !== "IN_PROGRESS";
  const completionError = getCompletionError({ ...order, conclusion });
  const receive = async () => {
    if (isBusy) return;
    setIsBusy(true);
    try { const updated = await receiveDiagnosticResult(order as DiagnosticOrder & { expectedUpdatedAt: string }); setOrder((current) => ({ ...current, ...updated, status: "IN_PROGRESS" })); await onChanged(); toast.success("Đã tiếp nhận chỉ định."); }
    catch (cause) { toast.error(cause instanceof Error ? cause.message : "Không thể tiếp nhận chỉ định."); }
    finally { setIsBusy(false); }
  };
  const addImages = async (files: File[]) => {
    const invalid = validateDiagnosticFiles(files, order.images.length);
    if (invalid) { setError(invalid); return; }
    setIsBusy(true); setError("");
    try {
      for (const file of files) {
        await createImageBitmap(file).then((bitmap) => bitmap.close());
        const response = await uploadDiagnosticImage(order as DiagnosticOrder & { expectedUpdatedAt: string }, file);
        setOrder((current) => ({ ...current, ...response }));
        await onChanged();
      }
    } catch (cause) { setError(cause instanceof Error ? cause.message : "Không thể tải ảnh lên."); }
    finally { setIsBusy(false); }
  };
  const removeImage = async (publicId: string) => {
    if (isBusy) return;
    setIsBusy(true);
    try { const updated = await removeDiagnosticImage(order as DiagnosticOrder & { expectedUpdatedAt: string }, publicId); setOrder((current) => ({ ...current, ...updated })); await onChanged(); }
    catch (cause) { toast.error(cause instanceof Error ? cause.message : "Không thể xóa ảnh."); }
    finally { setIsBusy(false); }
  };
  const complete = async () => {
    if (isBusy) return;
    setIsBusy(true);
    try { await completeDiagnosticResult(order as DiagnosticOrder & { expectedUpdatedAt: string }, conclusion); setOrder((current) => ({ ...current, status: "COMPLETED", conclusion, completedAt: new Date().toISOString() })); setIsConfirming(false); await onChanged(); toast.success("Đã hoàn tất và trả kết quả."); }
    catch (cause) { setIsConfirming(false); setError(cause instanceof Error ? cause.message : "Không thể hoàn tất kết quả."); }
    finally { setIsBusy(false); }
  };
  return <Drawer open onOpenChange={(open) => { if (!open && !isBusy && !isConfirming) onClose(); }}><DrawerContent className="w-full max-w-3xl"><DrawerHeader><DrawerTitle>{order.status === "COMPLETED" ? "Kết quả đã hoàn tất" : "Trả kết quả chỉ định"}</DrawerTitle><DrawerDescription>{order.visit.patientName} · {order.visit.patientCode} · Phiên {order.visit.examinationCode}</DrawerDescription></DrawerHeader><div className="min-h-0 flex-1 space-y-5 overflow-y-auto p-5 sm:p-6"><div className="rounded-app-xl border border-border bg-background p-4"><div className="mb-2 flex flex-wrap items-center gap-2"><Badge variant="brand">{DIAGNOSTIC_CATEGORY_LABELS[order.category]}</Badge><Badge variant={order.status === "COMPLETED" ? "success" : order.status === "IN_PROGRESS" ? "warning" : "neutral"}>{DIAGNOSTIC_STATUS_LABELS[order.status]}</Badge></div><h2 className="text-title font-bold">{order.service}</h2><p className="mt-1 text-caption text-muted">{order.serviceCode} · {order.visit.demographics} · Phòng khám {order.visit.room}</p><dl className="mt-4 space-y-2 text-body"><div><dt className="text-muted">Lý do chỉ định</dt><dd>{order.visit.reason || "Chưa ghi nhận"}</dd></div>{order.visit.instructions && <div><dt className="text-muted">Lưu ý thực hiện</dt><dd>{order.visit.instructions}</dd></div>}</dl></div>{order.status === "WAITING" ? <div className="rounded-app-lg border border-dashed border-border-strong p-5 text-body text-muted">Tiếp nhận chỉ định để đính kèm ảnh và nhập kết quả.</div> : <><section className="space-y-3"><div><h3 className="text-heading font-bold">Ảnh kết quả</h3><p className="mt-1 text-caption text-muted">JPG, PNG hoặc WebP. Tối đa 6 ảnh, mỗi ảnh không quá 5 MB.</p></div>{!isReadOnly && <label className="block space-y-2 rounded-app-xl border border-dashed border-border-strong bg-background p-4 text-body font-medium">Chọn ảnh phiếu xét nghiệm / chụp chiếu<Input aria-label="Chọn ảnh kết quả" type="file" accept="image/jpeg,image/png,image/webp" multiple disabled={isBusy} onChange={(event) => { const files = Array.from(event.target.files ?? []); event.target.value = ""; if (files.length) void addImages(files); }} /></label>}<DiagnosticImageGallery images={order.images} disabled={isBusy} onRemove={isReadOnly ? undefined : removeImage} />{!order.images.length && <p className="text-body text-muted">Chưa có ảnh đính kèm.</p>}</section><label className="block space-y-2 text-body font-semibold">Nhận xét / Kết luận<Textarea value={conclusion} readOnly={isReadOnly} disabled={isBusy} rows={5} maxLength={10000} onChange={(event) => setConclusion(event.target.value)} /></label></>}{error && <p role="alert" className="rounded-app-lg bg-error-bg p-3 text-body text-error">{error}</p>}{!isReadOnly && completionError && <p className="text-caption text-muted">{completionError}</p>}</div><DrawerFooter className="flex-wrap gap-2"><Button variant="outline" disabled={isBusy} onClick={onClose}>Đóng</Button>{order.status === "WAITING" ? <Button disabled={isBusy} onClick={() => void receive()}>Tiếp nhận chỉ định</Button> : order.status === "COMPLETED" ? <Button onClick={() => onViewRecord(order.visit.careSessionId)}>Xem trong hồ sơ khám</Button> : <Button disabled={isBusy || !!completionError} onClick={() => setIsConfirming(true)}>Hoàn tất & Trả kết quả</Button>}</DrawerFooter><Dialog open={isConfirming} onOpenChange={setIsConfirming}><DialogContent><DialogHeader><DialogTitle>Xác nhận trả kết quả</DialogTitle><DialogDescription>Đối chiếu đúng bệnh nhân và dịch vụ trước khi hoàn tất.</DialogDescription></DialogHeader><div className="space-y-2 p-5 text-body"><p className="font-bold">{order.visit.patientName} · {order.visit.patientCode}</p><p>Phiên khám: {order.visit.examinationCode}</p><p>{order.service} · {order.images.length} ảnh</p><p className="text-muted">Kết quả sẽ được lưu vào hồ sơ khám của phiên này.</p></div><DialogFooter><Button variant="outline" disabled={isBusy} onClick={() => setIsConfirming(false)}>Kiểm tra lại</Button><Button disabled={isBusy} onClick={() => void complete()}>Xác nhận hoàn tất</Button></DialogFooter></DialogContent></Dialog></DrawerContent></Drawer>;
}
