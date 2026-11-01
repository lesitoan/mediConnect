"use client";
import { useState } from "react";
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
export function ExaminationSession({
  item,
  onBack,
  onUpdate,
}: {
  item: Examination;
  onBack: () => void;
  onUpdate: (changes: Partial<Examination>) => void;
}) {
  const action = useModal<ExaminationAction>();
  const [screen, setScreen] = useState<"CLINICAL" | "LABS" | "PRESCRIPTION">(
    "CLINICAL",
  );
  const [hasChanges, setHasChanges] = useState(false);
  const isReadOnly = item.status === "COMPLETED";
  const update = (changes: Partial<Examination>) => {
    onUpdate(changes);
    setHasChanges(true);
  };
  return (
    <div className="-mb-4 space-y-6 sm:-mb-5 lg:-mb-6">
      <header className="-mx-4 -mt-4 flex flex-wrap items-center justify-between gap-3 border-b border-border bg-surface px-4 py-5 sm:-mx-5 sm:-mt-5 sm:px-5 lg:-mx-6 lg:-mt-6 lg:px-6">
        <div>
          <h1 className="text-display font-bold">Phiên khám #{item.id}</h1>
          <p className="mt-1 text-caption text-muted">
            Ca sáng · {item.queueNumber} · {item.room}
            {screen !== "CLINICAL" && (
              <span>
                {" "}
                · {screen === "LABS" ? "Chỉ định cận lâm sàng" : "Kê đơn thuốc"}
              </span>
            )}
          </p>
        </div>
        <span
          className={`rounded-full border border-current/10 px-3 py-1 text-caption font-semibold ${EXAMINATION_STATUS[item.status].className}`}
        >
          • {EXAMINATION_STATUS[item.status].label}
        </span>
      </header>
      <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-3">
        <ExaminationPatientSummary
          item={item}
          onHistory={() => action.open("HISTORY")}
          onRecords={() => action.open("RECORDS")}
        />
        <div className="space-y-4 lg:col-span-2">
          {screen === "LABS" ? (
            <ExaminationLabOrders
              item={item}
              onBack={() => setScreen("CLINICAL")}
              onSave={(changes) => {
                update(changes);
                action.open("WAIT_RESULTS");
              }}
            />
          ) : screen === "PRESCRIPTION" ? (
            <ExaminationPrescription
              item={item}
              onUpdate={update}
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
                    value={item.complaint}
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
                    value={item.clinicalNotes}
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
                      {item.diagnosis.split(" — ")[0]}
                    </span>{" "}
                    ·{" "}
                    {item.diagnosis.split(" — ").slice(1).join(" — ") ||
                      "Chưa có chẩn đoán"}{" "}
                    <span className="text-label">(Theo dữ liệu đã lưu)</span>
                  </p>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-auto px-0 text-caption font-medium text-primary"
                  disabled={isReadOnly}
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
                    disabled={isReadOnly}
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
                  disabled={isReadOnly}
                  onClick={() => action.open("TRANSFER")}
                >
                  Chuyển chuyên khoa →
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-auto p-0 text-caption font-medium text-primary"
                  disabled={isReadOnly}
                  onClick={() => action.open("FOLLOW_UP")}
                >
                  Hẹn tái khám →
                </Button>
              </div>
              {item.transfer && (
                <p
                  role="status"
                  className="rounded-app-md bg-warning-bg p-3 text-caption text-warning"
                >
                  {item.transfer}
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
              disabled={isReadOnly}
              className="border-error-border text-danger"
              onClick={() =>
                update({
                  status:
                    item.status === "IN_PROGRESS" ? "PAUSED" : "IN_PROGRESS",
                })
              }
            >
              {item.status === "IN_PROGRESS"
                ? "Tạm dừng khẩn cấp"
                : "Tiếp tục khám"}
            </Button>
            <Button
              variant="outline"
              disabled={isReadOnly}
              onClick={() => {
                setHasChanges(false);
                toast.success("Đã lưu bản nháp minh họa trong phiên xem.");
              }}
            >
              Lưu nháp
            </Button>
            <Button
              disabled={isReadOnly}
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
            item={item}
            onClose={action.close}
            onUpdate={update}
          />
        ) : (
          action.data !== "LABS" &&
          action.data !== "PRESCRIPTION" && (
            <ExaminationActionDialog
              key={action.data}
              action={action.data}
              item={item}
              onClose={action.close}
              onUpdate={(changes) => {
                update(changes);
                if (changes.status === "WAITING_RESULTS") onBack();
              }}
            />
          )
        ))}
    </div>
  );
}
