"use client";
import { useRef, useState } from "react";
import toast from "react-hot-toast";
import { ClipboardPlus, Microscope, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/Textarea";
import { Card } from "@/components/ui/Card";
import { useModal } from "@/hooks/useModal";
import { EXAMINATION_STATUS } from "../constants";
import type { Examination, ExaminationAction } from "../types/examinationTypes";
import { ExaminationActionDialog } from "./ExaminationActionDialog";
import { ExaminationPatientSummary } from "./ExaminationPatientSummary";
import { ExaminationDrawers } from "./ExaminationDrawers";
import { ExaminationLabOrders } from "./ExaminationLabOrders";
import { ExaminationPrescription } from "./ExaminationPrescription";
import { getExaminationHistory } from "../services/examinationsService";
export function ExaminationSession({
  item,
  onBack,
  onUpdate,
  onTransition,
  onCompleted,
}: {
  item: Examination;
  onBack: () => void;
  onUpdate: (changes: Partial<Examination>) => Promise<Examination>;
  onTransition: (action: "pause" | "resume" | "complete" | "referral" | "incomplete", values: { reason?: string; plan?: string; targetSpecialtyName?: string; priority?: "NORMAL" | "URGENT"; requestedDoctorId?: string; expectedUpdatedAt?: string }) => Promise<Examination>;
  onCompleted: () => void;
}) {
  const action = useModal<ExaminationAction>();
  const [screen, setScreen] = useState<"CLINICAL" | "LABS" | "PRESCRIPTION">(
    "CLINICAL",
  );
  const [hasChanges, setHasChanges] = useState(false);
  const [draft, setDraft] = useState<Partial<Examination>>({});
  const [isSaving, setIsSaving] = useState(false);
  const [isResuming, setIsResuming] = useState(false);
  const savingRef = useRef(false);
  const resumeRef = useRef(false);
  const currentItem = { ...item, ...draft };
  const canEdit =
    currentItem.status === "IN_PROGRESS" && currentItem.isLocked !== true;
  const isReadOnly = !canEdit;
  const update = (changes: Partial<Examination>) => {
    setDraft((previous) => ({ ...previous, ...changes }));
    setHasChanges(true);
  };
  const persist = async (changes: Partial<Examination> = draft) => {
    if (savingRef.current || !canEdit) return false;
    savingRef.current = true;
    setIsSaving(true);
    try {
      const saved = await onUpdate(changes);
      setDraft({});
      setHasChanges(false);
      toast.success("Đã lưu thay đổi.");
      return saved;
    } catch {
      return false;
    } finally {
      savingRef.current = false;
      setIsSaving(false);
    }
  };
  const openHistory = async () => {
    try {
      const historyRecords = await getExaminationHistory(item.careSessionId ?? item.id);
      setDraft((previous) => ({ ...previous, historyRecords }));
      action.open("RECORDS");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Unable to load examination history");
    }
  };
  return (
    <div className="-mb-4 space-y-6 sm:-mb-5 lg:-mb-6">
      <header className="-mx-4 -mt-4 flex flex-wrap items-center justify-between gap-3 border-b border-border bg-surface px-4 py-5 sm:-mx-5 sm:-mt-5 sm:px-5 lg:-mx-6 lg:-mt-6 lg:px-6">
        <div>
          <h1 className="text-display font-bold">Phiên khám #{currentItem.id}</h1>
          <p className="mt-1 text-caption text-muted">
            Ca sáng · {currentItem.queueNumber} · {currentItem.room}
            {screen !== "CLINICAL" && (
              <span>
                {" "}
                · {screen === "LABS" ? "Chỉ định cận lâm sàng" : "Kê đơn thuốc"}
              </span>
            )}
          </p>
        </div>
        <span
          className={`rounded-full border border-current/10 px-3 py-1 text-caption font-semibold ${EXAMINATION_STATUS[currentItem.status].className}`}
        >
          • {EXAMINATION_STATUS[currentItem.status].label}
        </span>
      </header>
      <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-3">
        <ExaminationPatientSummary
          item={currentItem}
          onHistory={() => action.open("HISTORY")}
          onRecords={() => void openHistory()}
        />
        <div className="space-y-4 lg:col-span-2">
          {screen === "LABS" ? (
            <ExaminationLabOrders
              item={currentItem}
              onBack={() => setScreen("CLINICAL")}
              onSave={async (changes) => {
                if (
                  await persist({
                    ...changes,
                    updatedAt: currentItem.updatedAt,
                  })
                )
                  action.open("WAIT_RESULTS");
              }}
            />
          ) : screen === "PRESCRIPTION" ? (
            <ExaminationPrescription
              item={currentItem}
              onUpdate={async (changes) => {
                const saved = await persist(changes);
                if (!saved) throw new Error("Không thể lưu đơn thuốc.");
                return saved;
              }}
              onBack={() => setScreen("CLINICAL")}
            />
          ) : (
            <>
              <Card className="p-4 shadow-none">
                <h2 className="mb-4 text-body font-bold">Sinh hiệu hiện tại</h2>
                <dl className="grid grid-cols-3 gap-3 xl:grid-cols-6">
                  {[
                    ["Huyết áp", "135/85", "mmHg"],
                    ["Nhịp tim", "82", "lần/phút"],
                    ["SpO₂", "98%", "Khí phòng"],
                    ["Nhiệt độ", "36.8°C", "Bình thường"],
                    ["Nhịp thở", "18", "lần/phút"],
                    ["BMI", "21.3", "54kg / 159cm"],
                  ].map(([label, value, unit]) => (
                    <div key={label}>
                      <dt className="text-label text-muted">{label}</dt>
                      <dd
                        className={`mt-1 text-base font-bold ${label === "SpO₂" ? "text-primary" : "text-foreground"}`}
                      >
                        {value}
                        <span className="mt-1 block text-label font-normal text-muted">
                          {unit}
                        </span>
                      </dd>
                    </div>
                  ))}
                </dl>
              </Card>
              <Card className="space-y-4 p-5 shadow-none">
                <h2 className="text-body font-bold">Ghi chú lâm sàng</h2>
                <div>
                  <label
                    htmlFor="examination-complaint"
                    className="mb-2 block text-caption font-semibold"
                  >
                    Lý do vào khám <span className="text-error-text">*</span>
                  </label>
                  <Textarea
                    id="examination-complaint"
                    className="min-h-24 read-only:bg-neutral-bg read-only:text-muted"
                    rows={3}
                    readOnly={isReadOnly}
                    value={currentItem.complaint}
                    onChange={(event) =>
                      update({ complaint: event.target.value })
                    }
                  />
                </div>
                <div>
                  <label
                    htmlFor="examination-notes"
                    className="mb-2 block text-caption font-semibold"
                  >
                    Khám lâm sàng chi tiết{" "}
                    <span className="text-error-text">*</span>
                  </label>
                  <Textarea
                    id="examination-notes"
                    className="min-h-36 read-only:bg-neutral-bg read-only:text-muted"
                    rows={5}
                    readOnly={isReadOnly}
                    value={currentItem.clinicalNotes}
                    onChange={(event) =>
                      update({ clinicalNotes: event.target.value })
                    }
                  />
                </div>
              </Card>
              <Card className="flex items-center gap-3 p-4 shadow-none">
                <div className="flex-1">
                  <h2 className="text-body font-bold">Chẩn đoán</h2>
                  <p className="mt-2 text-caption text-muted">
                    <span className="font-semibold text-primary">
                      {currentItem.diagnosis.split(" — ")[0]}
                    </span>{" "}
                    ·{" "}
                    {currentItem.diagnosis.split(" — ").slice(1).join(" — ") ||
                      "Chưa có chẩn đoán"}{" "}
                    <span className="text-label">(Theo dữ liệu đã lưu)</span>
                  </p>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-auto px-0 text-caption font-medium text-primary"
                  onClick={() => action.open("DIAGNOSIS")}
                >
                  Xem / Cập nhật →
                </Button>
              </Card>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                {[
                  {
                    type: "PRESCRIPTION" as const,
                    title: "Kê đơn thuốc",
                    description: "Mở màn kê đơn hiện có",
                    icon: ClipboardPlus,
                  },
                  {
                    type: "LABS" as const,
                    title: "Chỉ định CLS",
                    description: "Mở màn chỉ định hiện có",
                    icon: Microscope,
                  },
                ].map((tile) => (
                  <button
                    key={tile.type}
                    type="button"
                    onClick={() => setScreen(tile.type)}
                    className="flex items-center gap-3 rounded-app-xl border border-border bg-surface p-4 text-left shadow-xs hover:bg-surface-hover disabled:opacity-60"
                  >
                    <span className="rounded-app-lg bg-primary-light p-3 text-primary">
                      <tile.icon className="size-5" />
                    </span>
                    <span className="flex-1">
                      <span className="block text-body font-bold">
                        {tile.title}
                      </span>
                      <span className="mt-1 block text-label text-muted">
                        {tile.description} →
                      </span>
                    </span>
                    <ChevronRight className="size-4 text-muted" />
                  </button>
                ))}
              </div>
              <div className="flex gap-6">
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-auto p-0 text-caption font-medium text-primary"
                  disabled={!canEdit || isSaving}
                  onClick={() => action.open("TRANSFER")}
                >
                  Chuyển chuyên khoa →
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-auto p-0 text-caption font-medium text-primary"
                  disabled={!canEdit || isSaving}
                  onClick={() => action.open("FOLLOW_UP")}
                >
                  Hẹn tái khám →
                </Button>
              </div>
              {currentItem.transfer && (
                <p
                  role="status"
                  className="rounded-app-md bg-warning-bg p-3 text-caption text-warning"
                >
                  {currentItem.transfer}
                </p>
              )}
            </>
          )}
        </div>
      </div>
      {screen === "CLINICAL" && (
        <footer className="sticky bottom-0 -mx-4 flex flex-wrap items-center justify-between gap-3 border-t border-border bg-surface p-4 sm:-mx-5 sm:px-5 lg:-mx-6 lg:px-6">
          <Button
            variant="ghost"
            className="h-auto p-0 text-caption font-medium text-muted"
            onClick={onBack}
          >
            ← Phiên khám của tôi
          </Button>
          <div className="flex flex-wrap items-center gap-3">
            <span role="status" className="text-label text-muted">
              {isReadOnly ? "Chỉ đọc" : hasChanges ? "Bản nháp minh họa" : ""}
            </span>
            <Button
              variant="outline"
              disabled={
                currentItem.status === "PAUSED"
                  ? currentItem.isLocked === true || isResuming
                  : !canEdit || isSaving
              }
              className="border-error-border text-danger"
              onClick={() => {
                if (currentItem.status === "PAUSED") {
                  if (resumeRef.current || currentItem.isLocked === true) return;
                  resumeRef.current = true;
                  setIsResuming(true);
                  void onTransition("resume", {})
                  .then(() => toast.success("Đã cập nhật trạng thái phiên khám."))
                  .catch((error: unknown) => toast.error(error instanceof Error ? error.message : "Không thể cập nhật phiên khám"))
                  .finally(() => {
                    resumeRef.current = false;
                    setIsResuming(false);
                  });
                  return;
                }
                if (savingRef.current || !canEdit) return;
                savingRef.current = true;
                setIsSaving(true);
                void (currentItem.pauseReason?.trim()
                  ? onTransition("pause", { reason: currentItem.pauseReason })
                  : Promise.reject(new Error("Cần lý do tạm dừng để tiếp tục.")))
                  .then(() => toast.success("Đã cập nhật trạng thái phiên khám."))
                  .catch((error: unknown) => toast.error(error instanceof Error ? error.message : "Không thể cập nhật phiên khám"))
                  .finally(() => {
                    savingRef.current = false;
                    setIsSaving(false);
                  });
              }}
            >
              {currentItem.status === "IN_PROGRESS"
                ? "Tạm dừng khẩn cấp"
                : "Tiếp tục khám"}
            </Button>
            <Button
              variant="outline"
              disabled={!canEdit || isSaving}
              onClick={() => {
                void persist();
              }}
            >
              Lưu nháp
            </Button>
            <Button
              disabled={!canEdit || isSaving}
              onClick={() => action.open("COMPLETE")}
            >
              Hoàn thành khám
            </Button>
          </div>
        </footer>
      )}
      {action.isOpen &&
        action.data &&
        (action.data === "DIAGNOSIS" || action.data === "RECORDS" ? (
          <ExaminationDrawers
            key={action.data}
            mode={action.data}
            item={currentItem}
            onClose={action.close}
            onUpdate={persist}
          />
        ) : (
          action.data !== "LABS" &&
          action.data !== "PRESCRIPTION" && (
            <ExaminationActionDialog
              key={action.data}
              action={action.data}
              item={currentItem}
              onClose={action.close}
              onComplete={async () => {
                const saved = await persist({
                  ...draft,
                  complaint: currentItem.complaint,
                  clinicalNotes: currentItem.clinicalNotes,
                });
                if (!saved || !saved.updatedAt) throw new Error("Không thể lưu nội dung khám trước khi hoàn thành.");
                await onTransition("complete", { expectedUpdatedAt: saved.updatedAt });
                onCompleted();
              }}
              onIncomplete={(reason, plan) => onTransition("incomplete", { reason, plan })}
              onUpdate={async (changes) => {
                if (action.data === "TRANSFER") {
                  await onTransition("referral", {
                    targetSpecialtyName: changes.referralSpecialty,
                    reason: changes.referralReason,
                    priority: changes.referralPriority,
                    requestedDoctorId: changes.referralDoctorId,
                  });
                  return;
                }
                const isSaved = await persist(changes);
                if (isSaved && changes.status === "WAITING_RESULTS") onBack();
              }}
            />
          )
        ))}
    </div>
  );
}
