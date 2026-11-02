"use client";
import { useEffect, useRef, useState } from "react";
import toast from "react-hot-toast";
import {
  AlertTriangle,
  Pencil,
  CheckCircle2,
  LockKeyhole,
  CalendarDays,
  Activity,
  Pill,
  Plus,
  ClipboardPlus,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/Input";
import { Textarea } from "@/components/ui/Textarea";
import { Select } from "@/components/ui/Select";
import { Calendar } from "@/components/ui/Calendar";
import {
  Popover,
  PopoverTrigger,
  PopoverContent,
} from "@/components/ui/Popover";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/Dialog";
import { canCompleteExamination } from "../examinationUtils";
import { searchReceptionSpecialties, listReceptionProviders } from "@/features/reception/services/receptionService";
import type { SpecialtyOption, ReceptionProvider } from "@/features/reception/types/receptionTypes";
import type {
  Examination,
  ExaminationAction,
  HistoryCondition,
} from "../types/examinationTypes";
type ModalAction = Exclude<
  ExaminationAction,
  "DIAGNOSIS" | "RECORDS" | "LABS" | "PRESCRIPTION"
>;
const TITLES: Record<ModalAction, string> = {
  HISTORY: "Cập nhật tiền sử y khoa",
  TRANSFER: "Chuyển chuyên khoa nội bộ",
  FOLLOW_UP: "Hẹn tái khám",
  COMPLETE: "Hoàn thành phiên khám",
  WAIT_RESULTS: "Xác nhận chờ kết quả cận lâm sàng",
};
const LABELS: Record<ModalAction, string> = {
  HISTORY: "Lưu thay đổi",
  TRANSFER: "Xác nhận chuyển khoa",
  FOLLOW_UP: "Lưu đề xuất tái khám",
  COMPLETE: "Hoàn thành khám",
  WAIT_RESULTS: "Xác nhận chuyển trạng thái",
};
export function ExaminationActionDialog({
  action,
  item,
  onClose,
  onUpdate,
  onComplete,
  onIncomplete,
}: {
  action: ModalAction;
  item: Examination;
  onClose: () => void;
  onUpdate: (changes: Partial<Examination>) => Promise<unknown>;
  onComplete: () => Promise<unknown>;
  onIncomplete: (reason: string, plan: string) => Promise<unknown>;
}) {
  const [conditions, setConditions] = useState<HistoryCondition[]>(
    item.historyConditions ?? [],
  );
  const [editing, setEditing] = useState<number | null>(null);
  const [editingMeds, setEditingMeds] = useState(false);
  const [editingSurgery, setEditingSurgery] = useState(false);
  const [specialty, setSpecialty] = useState("");
  const [doctor, setDoctor] = useState("");
  const [specialties, setSpecialties] = useState<SpecialtyOption[]>([]);
  const [doctors, setDoctors] = useState<ReceptionProvider[]>([]);
  const [error, setError] = useState("");
  const [followUpDate, setFollowUpDate] = useState(item.followUpDate);
  const [isDateOpen, setIsDateOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const isSubmitting = useRef(false);
  const [surgery, setSurgery] = useState(item.surgicalHistory ?? "");
  const [medications, setMedications] = useState(item.currentMedications ?? "");
  const [risk, setRisk] = useState(item.riskFactors ?? "");
  useEffect(() => {
    if (action !== "TRANSFER") return;
    void searchReceptionSpecialties().then((values) => {
      setSpecialties(values);
      if (values[0]) setSpecialty(values[0].id);
    }).catch((error: unknown) => toast.error(error instanceof Error ? error.message : "Không thể tải chuyên khoa"));
  }, [action]);
  useEffect(() => {
    if (action !== "TRANSFER" || !specialty) return;
    void listReceptionProviders(specialty).then(setDoctors).catch((error: unknown) => toast.error(error instanceof Error ? error.message : "Không thể tải bác sĩ"));
  }, [action, specialty]);
  const submit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (isSubmitting.current) return;
    const data = new FormData(event.currentTarget);
    let changes: Partial<Examination> = {};
    if (action === "HISTORY") {
      if (conditions.some((value) => !value.name.trim())) {
        setError("Nhập tên bệnh lý trước khi lưu.");
        return;
      }
      changes = {
        historyConditions: conditions,
        history: conditions.map((value) => value.name).join(" · "),
        surgicalHistory: surgery,
        currentMedications: medications,
        riskFactors: risk,
      };
    } else if (action === "TRANSFER") {
      const reason = String(data.get("reason") ?? "").trim();
      if (!specialty || !specialties.some((value) => value.id === specialty)) {
        setError("Vui lòng chọn chuyên khoa tiếp nhận.");
        return;
      }
      if (!reason) {
        setError("Vui lòng nhập lý do chuyển chuyên khoa.");
        return;
      }
      changes = {
        transfer: `${specialties.find((value) => value.id === specialty)?.name ?? ""}: ${reason}`,
        referralSpecialty: specialties.find((value) => value.id === specialty)?.name,
        referralReason: reason,
        referralPriority: String(data.get("priority") ?? "NORMAL") === "URGENT" ? "URGENT" : "NORMAL",
        referralDoctorId: doctor || undefined,
      };
    } else if (action === "FOLLOW_UP") {
      if (!followUpDate || followUpDate < item.date) {
        setError("Vui lòng chọn ngày tái khám từ ngày khám trở đi.");
        return;
      }
      changes = {
        followUpDate: String(data.get("date") ?? ""),
        followUpReason: String(data.get("reason") ?? ""),
        patientAdvice: String(data.get("advice") ?? ""),
      };
    } else if (action === "WAIT_RESULTS")
      changes = { status: "WAITING_RESULTS" };
    else {
      if (!canCompleteExamination(item)) {
        setError("Cần có ghi chú lâm sàng, chẩn đoán và trạng thái đang khám.");
        return;
      }
      changes = { status: "COMPLETED" };
    }
    setIsSaving(true);
    isSubmitting.current = true;
    try {
      if (action === "COMPLETE") await onComplete();
      else await onUpdate(changes);
      toast.success(`${LABELS[action]} thành công.`);
      onClose();
    } catch {
      return;
    } finally {
      isSubmitting.current = false;
      setIsSaving(false);
    }
  };
  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent
        className={
          action === "HISTORY"
            ? "max-h-dvh max-w-xl overflow-y-auto rounded-app-xl"
            : "max-h-dvh max-w-lg overflow-y-auto rounded-app-xl"
        }
      >
        <DialogHeader className="bg-surface p-6">
          <DialogTitle>{TITLES[action]}</DialogTitle>
          <DialogDescription>
            {action === "WAIT_RESULTS"
              ? `Phiên khám ${item.id} · ${item.patientName}`
              : `${item.patientName} · ${action === "HISTORY" ? item.patientCode : item.id}`}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={submit}>
          <div className="space-y-4 p-6">
            {action === "HISTORY" && (
              <>
                <section className="rounded-app-lg border border-error-border bg-error-bg/60 p-4">
                  <div className="flex items-center justify-between gap-2">
                    <h3 className="flex items-center gap-2 text-label font-bold uppercase text-error-text">
                      <AlertTriangle className="size-4" />
                      Dị ứng & chống chỉ định
                    </h3>
                    <span className="bg-danger-bg px-2 py-1 text-label font-semibold text-danger">
                      Nghiêm trọng
                    </span>
                  </div>
                  <p className="mt-2 text-body font-bold">{item.allergy}</p>
                  <p className="mt-2 text-caption text-muted">
                    {item.allergyDetails ?? ""}
                  </p>
                  <div className="mt-3 flex justify-between gap-2 border-t border-error-border pt-2 text-label text-muted">
                    <span>Đã xác nhận bởi BS. CKII Vũ Đình Trọng</span>
                    <span className="text-primary">Xem / Xác nhận nếu cần</span>
                  </div>
                </section>
                <section>
                  <div className="mb-2 flex justify-between">
                    <h3 className="flex items-center gap-2 text-label font-semibold uppercase text-muted">
                      <Activity className="size-4 text-primary" />
                      Tiền sử bệnh lý
                    </h3>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="h-auto p-0 text-caption text-primary"
                      onClick={() => {
                        setConditions([
                          ...conditions,
                          { name: "", note: "", isConfirmed: false },
                        ]);
                        setEditing(conditions.length);
                      }}
                    >
                      <Plus className="size-3" />
                      Thêm
                    </Button>
                  </div>
                  <div className="space-y-2">
                    {conditions.map((condition, index) => (
                      <div
                        key={index}
                        className="flex items-start gap-2 rounded-app-lg border border-border p-3"
                      >
                        <div className="flex-1">
                          {editing === index ? (
                            <div className="space-y-2">
                              <Input
                                aria-label={`Tên bệnh lý ${index + 1}`}
                                value={condition.name}
                                required
                                onChange={(event) =>
                                  setConditions(
                                    conditions.map((value, i) =>
                                      i === index
                                        ? { ...value, name: event.target.value }
                                        : value,
                                    ),
                                  )
                                }
                              />
                              <Input
                                aria-label={`Ghi chú bệnh lý ${index + 1}`}
                                value={condition.note}
                                onChange={(event) =>
                                  setConditions(
                                    conditions.map((value, i) =>
                                      i === index
                                        ? { ...value, note: event.target.value }
                                        : value,
                                    ),
                                  )
                                }
                              />
                            </div>
                          ) : (
                            <>
                              <p className="text-caption font-semibold">
                                {condition.name}
                              </p>
                              <p className="mt-1 text-label text-muted">
                                {condition.note}
                              </p>
                            </>
                          )}
                        </div>
                        <div className="flex items-center gap-1">
                          <span
                            className={
                              condition.isConfirmed
                                ? "whitespace-nowrap text-label text-primary"
                                : "whitespace-nowrap rounded-app-sm bg-primary-light px-2 py-1 text-label text-primary"
                            }
                          >
                            {condition.isConfirmed
                              ? "✓ Đã xác nhận"
                              : "Chờ xác nhận"}
                          </span>
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon-xs"
                            aria-label={`Sửa bệnh lý ${index + 1}`}
                            onClick={() =>
                              setEditing(editing === index ? null : index)
                            }
                          >
                            <Pencil className="size-3" />
                          </Button>
                          {!condition.isConfirmed && (
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              className="h-auto bg-primary-light px-2 text-label text-primary"
                              onClick={() =>
                                setConditions(
                                  conditions.map((value, i) =>
                                    i === index
                                      ? { ...value, isConfirmed: true }
                                      : value,
                                  ),
                                )
                              }
                            >
                              Xác nhận
                            </Button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </section>
                <section>
                  <div className="mb-2 flex justify-between">
                    <label
                      htmlFor="history-surgery"
                      className="flex items-center gap-2 text-label font-semibold uppercase text-muted"
                    >
                      <ClipboardPlus className="size-4 text-primary" />
                      Tiền sử phẫu thuật
                    </label>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="h-auto p-0 text-caption text-primary"
                      onClick={() => setEditingSurgery(true)}
                    >
                      + Thêm
                    </Button>
                  </div>
                  <Textarea
                    id="history-surgery"
                    className="min-h-10 text-caption read-only:bg-surface-hover"
                    rows={1}
                    placeholder="Chưa ghi nhận thông tin phẫu thuật"
                    readOnly={!editingSurgery}
                    value={surgery}
                    onChange={(event) => setSurgery(event.target.value)}
                  />
                </section>
                <section>
                  <div className="mb-2 flex justify-between">
                    <label
                      htmlFor="history-medications"
                      className="flex items-center gap-2 text-label font-semibold uppercase text-muted"
                    >
                      <Pill className="size-4 text-primary" />
                      Thuốc đang sử dụng
                    </label>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="h-auto p-0 text-caption text-primary"
                      onClick={() => setEditingMeds(true)}
                    >
                      Cập nhật
                    </Button>
                  </div>
                  {editingMeds ? (
                    <Textarea
                      id="history-medications"
                      rows={3}
                      value={medications}
                      onChange={(event) => setMedications(event.target.value)}
                    />
                  ) : (
                    <div className="rounded-app-lg border border-border p-3">
                      {medications.split("\n").map((line, index) => (
                        <div
                          key={index}
                          className="flex justify-between gap-3 py-1 text-caption"
                        >
                          <span className="font-medium">
                            {line.split("|")[0]}
                          </span>
                          <span className="text-muted">
                            {line.split("|")[1]}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </section>
                <section>
                  <label
                    htmlFor="history-risk"
                    className="mb-2 block text-label font-semibold uppercase text-muted"
                  >
                    Yếu tố nguy cơ & thói quen sống
                  </label>
                  <Textarea
                    id="history-risk"
                    rows={3}
                    value={risk}
                    onChange={(event) => setRisk(event.target.value)}
                  />
                </section>
              </>
            )}
            {action === "TRANSFER" && (
              <>
                <div>
                  <label
                    htmlFor="transfer-specialty"
                    className="mb-2 block text-caption font-semibold"
                  >
                    Chuyên khoa tiếp nhận{" "}
                    <span className="text-error-text">*</span>
                  </label>
                  <Select
                    id="transfer-specialty"
                    value={specialty}
                    onChange={(event) => {
                      setSpecialty(event.target.value);
                      setDoctor("");
                    }}
                  >
                    {specialties.map((value) => <option key={value.id} value={value.id}>{value.name}</option>)}
                  </Select>
                </div>
                <div>
                  <label
                    htmlFor="transfer-doctor"
                    className="mb-2 block text-caption font-semibold"
                  >
                    Bác sĩ tiếp nhận{" "}
                    <span className="font-normal text-muted">
                      (không bắt buộc)
                    </span>
                  </label>
                  <Select
                    id="transfer-doctor"
                    value={doctor}
                    onChange={(event) => setDoctor(event.target.value)}
                  >
                    <option value="">Chọn bác sĩ (không bắt buộc)</option>
                    {doctors.filter((value) => value.specialty.id === specialty).map((value) => <option key={value.id} value={value.id}>{value.academicTitle ? `${value.academicTitle} ` : ""}{value.user.fullName}</option>)}
                  </Select>
                </div>
                <fieldset>
                  <legend className="mb-2 text-caption font-semibold">
                    Mức độ ưu tiên <span className="text-error-text">*</span>
                  </legend>
                  <div className="flex gap-6 text-body">
                    <label className="flex items-center gap-2">
                      <input
                        type="radio"
                        name="priority"
                        value="NORMAL"
                        defaultChecked
                        className="accent-primary"
                      />
                      Thông thường
                    </label>
                    <label className="flex items-center gap-2">
                      <input
                        type="radio"
                        name="priority"
                        value="URGENT"
                        className="accent-primary"
                      />
                      Khẩn cấp
                    </label>
                  </div>
                </fieldset>
                <div>
                  <label
                    htmlFor="transfer-reason"
                    className="mb-2 block text-caption font-semibold"
                  >
                    Lý do chuyển chuyên khoa{" "}
                    <span className="text-error-text">*</span>
                  </label>
                  <Textarea
                    id="transfer-reason"
                    name="reason"
                    rows={4}
                    required
                    maxLength={1000}
                    defaultValue=""
                  />
                </div>
                <div className="rounded-app-lg border border-border bg-surface-hover p-3">
                  <p className="flex items-center gap-2 text-caption font-semibold">
                    <CalendarDays className="size-4 text-primary" />
                    Khả năng tiếp nhận
                  </p>
                  <p className="mt-1 text-label text-muted">
                    Kiểm tra khung giờ khả dụng của chuyên khoa trước khi xác
                    nhận.
                  </p>
                </div>
              </>
            )}
            {action === "FOLLOW_UP" && (
              <>
                <div>
                  <label
                    htmlFor="follow-up-date"
                    className="mb-2 block text-caption font-semibold"
                  >
                    Ngày tái khám đề xuất
                  </label>
                  <input type="hidden" name="date" value={followUpDate} />
                  <Popover open={isDateOpen} onOpenChange={setIsDateOpen}>
                    <PopoverTrigger
                      render={
                        <Button
                          id="follow-up-date"
                          type="button"
                          variant="outline"
                          className="h-10 w-full justify-start text-body font-normal text-muted"
                        />
                      }
                    >
                      <CalendarDays className="mr-2 size-4" />
                      {followUpDate
                        ? followUpDate.split("-").reverse().join("/")
                        : "Chọn ngày tái khám"}
                    </PopoverTrigger>
                    <PopoverContent>
                      <Calendar
                        mode="single"
                        selected={followUpDate}
                        defaultMonth={new Date(`${item.date}T12:00:00`)}
                        disabled={(date) =>
                          date < new Date(`${item.date}T00:00:00`)
                        }
                        onSelect={(range) => {
                          if (typeof range?.from === "string") {
                            setFollowUpDate(range.from);
                            setError("");
                            setIsDateOpen(false);
                          }
                        }}
                      />
                    </PopoverContent>
                  </Popover>
                </div>
                <div>
                  <label
                    htmlFor="follow-up-reason"
                    className="mb-2 block text-caption font-semibold"
                  >
                    Lý do tái khám
                  </label>
                  <Textarea
                    id="follow-up-reason"
                    name="reason"
                    rows={3}
                    defaultValue={item.followUpReason}
                    placeholder="Nhập hướng dẫn theo dõi và tái khám..."
                    maxLength={1000}
                  />
                </div>
                <div>
                  <label
                    htmlFor="follow-up-advice"
                    className="mb-2 block text-caption font-semibold"
                  >
                    Lời dặn bệnh nhân
                  </label>
                  <Textarea
                    id="follow-up-advice"
                    name="advice"
                    rows={3}
                    defaultValue={item.patientAdvice}
                    placeholder="Nhập hướng dẫn theo dõi và tái khám..."
                    maxLength={1000}
                  />
                </div>
                <p className="text-caption leading-relaxed text-muted">
                  Đây là ngày tái khám do bác sĩ đề xuất, chưa phải một lịch hẹn
                  đã được đặt và xác nhận.
                </p>
              </>
            )}
            {action === "WAIT_RESULTS" && (
              <>
                <h3 className="text-label font-semibold uppercase text-muted">
                  Chỉ định cần thực hiện
                </h3>
                <ol className="list-inside list-decimal space-y-3 text-body text-muted">
                  {item.labOrders
                    .split("; ")
                    .filter(Boolean)
                    .map((name) => (
                      <li key={name}>{name}</li>
                    ))}
                </ol>
                <div className="rounded-app-lg border border-border bg-surface-hover p-4 text-body">
                  <p className="flex justify-between border-b border-border pb-3">
                    <span className="text-muted">Trạng thái hiện tại</span>
                    <span>Đang khám</span>
                  </p>
                  <p className="flex justify-between pt-3">
                    <span className="text-muted">Trạng thái sau xác nhận</span>
                    <span className="font-medium text-primary">
                      • Chờ kết quả CLS
                    </span>
                  </p>
                </div>
                <p className="text-caption leading-relaxed text-muted">
                  Hồ sơ khám được giữ lại. Bác sĩ có thể khám bệnh nhân tiếp
                  theo trong khi chờ kết quả.
                </p>
              </>
            )}
            {action === "COMPLETE" && (
              <>
                <h3 className="text-body font-semibold">Kiểm tra hồ sơ</h3>
                <div className="divide-y divide-border rounded-app-lg border border-border px-3">
                  {[
                    {
                      label: "Ghi chú lâm sàng",
                      value: item.clinicalNotes.trim()
                        ? "Đã ghi nhận"
                        : "Chưa ghi nhận",
                      icon: CheckCircle2,
                      complete: !!item.clinicalNotes.trim(),
                    },
                    {
                      label: "Chẩn đoán",
                      value: item.diagnosis.trim()
                        ? "Đã ghi nhận"
                        : "Chưa ghi nhận",
                      icon: CheckCircle2,
                      complete: !!item.diagnosis.trim(),
                    },
                    {
                      label: "Đơn thuốc",
                      value: item.prescription
                        ? "Đã kê đơn"
                        : "Chưa kê đơn (Tùy chọn)",
                      icon: Pill,
                    },
                    {
                      label: "Chỉ định cận lâm sàng",
                      value: item.labOrders
                        ? "Đã có chỉ định"
                        : "Không có chỉ định",
                      icon: Activity,
                    },
                    {
                      label: "Ngày tái khám đề xuất",
                      value: item.followUpDate || "Chưa đề xuất",
                      icon: CalendarDays,
                    },
                  ].map((field) => (
                    <div
                      key={field.label}
                      className="flex items-center gap-2 py-3 text-caption"
                    >
                      <field.icon className="size-4 text-primary" />
                      <span className="flex-1">{field.label}</span>
                      <span
                        className={
                          field.complete
                            ? "rounded-app-sm bg-primary-light px-2 py-1 font-medium text-primary"
                            : "text-foreground"
                        }
                      >
                        {field.value}
                      </span>
                    </div>
                  ))}
                </div>
                <div className="flex items-start gap-3 rounded-app-lg bg-primary-light p-4">
                  <LockKeyhole className="size-5 shrink-0 text-primary" />
                  <div>
                    <p className="text-body font-semibold">
                      Hồ sơ sẽ được khóa sau khi hoàn thành
                    </p>
                    <p className="mt-1 text-caption text-muted">
                      Các dữ liệu lâm sàng đã ghi sẽ chuyển sang trạng thái chỉ
                      đọc.
                    </p>
                  </div>
                </div>
                {!canCompleteExamination(item) && (
                  <p className="text-caption text-error-text">
                    Cần ghi chú lâm sàng, chẩn đoán và trạng thái đang khám
                    trước khi hoàn tất.
                  </p>
                )}
                <p className="text-label text-muted">
                  Chỉ mô phỏng giao diện, chưa ký số hoặc khóa bệnh án thật.
                </p>
              </>
            )}
            {error && (
              <p role="alert" className="text-caption text-error-text">
                {error}
              </p>
            )}
          </div>
          <DialogFooter className="rounded-b-app-xl px-6">
            {action === "COMPLETE" && (
              <button
                type="button"
                disabled={isSaving || !item.complaint.trim() || !(item.patientAdvice ?? item.clinicalNotes).trim()}
                onClick={async () => {
                  if (isSubmitting.current || !item.complaint.trim()) return;
                  const plan = item.patientAdvice?.trim() || item.clinicalNotes.trim();
                  if (!plan) return;
                  isSubmitting.current = true;
                  setIsSaving(true);
                  try {
                    await onIncomplete(item.complaint.trim(), plan);
                    toast.success("Đã đánh dấu phiên khám chưa hoàn chỉnh.");
                    onClose();
                  } catch {
                    return;
                  } finally {
                    isSubmitting.current = false;
                    setIsSaving(false);
                  }
                }}
                title="Chưa có nghiệp vụ kết thúc chưa hoàn chỉnh trong bản xem thử"
                className="mr-auto text-label text-muted underline"
              >
                Kết thúc chưa hoàn chỉnh
              </button>
            )}
            <Button type="button" variant="outline" disabled={isSaving} onClick={onClose}>
              {["WAIT_RESULTS", "COMPLETE"].includes(action)
                ? "Quay lại"
                : "Hủy bỏ"}
            </Button>
            <Button
              type="submit"
              disabled={
                isSaving ||
                (action === "COMPLETE" && !canCompleteExamination(item)) ||
                (action === "WAIT_RESULTS" &&
                  (item.status !== "IN_PROGRESS" || !item.labOrders.trim()))
              }
            >
              {LABELS[action]}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
