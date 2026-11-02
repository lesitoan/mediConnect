"use client";
import { useState } from "react";
import toast from "react-hot-toast";
import { X, Search, Pencil, AlertTriangle, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/Input";
import { Textarea } from "@/components/ui/Textarea";
import { Card } from "@/components/ui/Card";
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerDescription,
  DrawerFooter,
} from "@/components/ui/Drawer";
import { DIAGNOSIS_CATALOG } from "../constants";
import type { Examination, Diagnosis } from "../types/examinationTypes";
export function ExaminationDrawers({
  mode,
  item,
  onClose,
  onUpdate,
}: {
  mode: "DIAGNOSIS" | "RECORDS";
  item: Examination;
  onClose: () => void;
  onUpdate: (value: Partial<Examination>) => Promise<unknown>;
}) {
  const [isSaving, setIsSaving] = useState(false);
  const initialPrimary = DIAGNOSIS_CATALOG.find((diagnosis) =>
    item.diagnosis.startsWith(`${diagnosis.code} —`),
  ) ?? (() => {
    const [code = "", ...nameParts] = item.diagnosis.split(" — ");
    return { code: code.trim(), name: nameParts.join(" — ").trim() };
  })();
  const [primary, setPrimary] = useState(initialPrimary);
  const [secondary, setSecondary] = useState<Diagnosis[]>(
    item.secondaryDiagnoses ?? [],
  );
  const [search, setSearch] = useState("");
  const [notes, setNotes] = useState(
    item.diagnosisNotes ?? "",
  );
  const isReadOnly =
    item.status !== "IN_PROGRESS" || item.isLocked === true;
  const results = DIAGNOSIS_CATALOG.filter((diagnosis) =>
    `${diagnosis.code} ${diagnosis.name}`
      .toLocaleLowerCase("vi")
      .includes(search.toLocaleLowerCase("vi")),
  );
  return (
    <Drawer open onOpenChange={(value) => !value && onClose()}>
      <DrawerContent className={mode === "RECORDS" ? "sm:w-xl" : "sm:w-lg"}>
        <DrawerHeader className="relative bg-surface pr-12">
          <DrawerTitle>
            {mode === "RECORDS" ? "Hồ sơ & Lịch sử khám" : "Chẩn đoán"}
          </DrawerTitle>
          <DrawerDescription>
            {mode === "RECORDS"
              ? `${item.patientName} · ${item.patientCode}`
              : `Phiên khám ${item.id} · ${item.patientName}`}
          </DrawerDescription>
          <Button
            variant="ghost"
            size="icon-sm"
            className="absolute right-4 top-4"
            aria-label="Đóng drawer"
            onClick={onClose}
          >
            <X className="size-4" />
          </Button>
        </DrawerHeader>
        {mode === "RECORDS" ? (
          <div className="flex-1 space-y-6 overflow-y-auto bg-surface-hover p-6">
            <section>
              <div className="flex justify-between">
                <h3 className="text-body font-semibold">Thông tin bệnh nhân</h3>
                <span className="text-caption text-muted">Chỉ đọc</span>
              </div>
              <p className="mt-2 text-caption text-muted">
                {item.demographics} · Thông tin liên hệ theo hồ sơ
              </p>
              <div className="mt-3 rounded-app-lg border border-error-border bg-error-bg/60 p-4">
                <p className="flex justify-between text-body font-semibold text-error-text">
                  Dị ứng {item.allergy}
                  <AlertTriangle className="size-4" />
                </p>
                <p className="mt-2 text-caption leading-relaxed text-muted">
                  Xem chi tiết dị ứng đã ghi nhận trong hồ sơ ({item.allergyDetails ?? ""}
                  )
                </p>
              </div>
            </section>
            <section className="border-t border-border pt-5">
              <div className="mb-4 flex justify-between">
                <h3 className="text-body font-semibold">Các lần khám trước</h3>
                <span className="text-caption text-muted">Mới nhất trước</span>
              </div>
              {(item.historyRecords ?? []).map((visit, index) => (
                <details
                  key={visit.date}
                  open={index === 0}
                  className="group mb-3 rounded-app-xl border border-border bg-surface"
                >
                  <summary className="relative cursor-pointer list-none p-4 pr-10 text-body font-semibold [&::-webkit-details-marker]:hidden">
                    {visit.date} · {visit.name}
                    <ChevronDown className="absolute right-4 top-4 size-4 text-muted group-open:rotate-180" />
                    <span className="mt-1 block text-caption font-normal text-muted">
                      {visit.doctor}
                    </span>
                  </summary>
                  <div className="space-y-3 border-t border-border p-4 text-caption leading-relaxed">
                    <p className="italic text-muted">
                      Chẩn đoán, ghi chú lâm sàng và đơn thuốc của lần khám được
                      chọn:
                    </p>
                    <div className="rounded-app-md bg-primary-light p-3">
                      <p className="text-caption text-primary">{visit.diagnosis}</p>
                    </div>
                    <div>
                      <p className="font-semibold">Ghi chú lâm sàng:</p>
                      <p className="text-muted">{visit.clinicalNotes}</p>
                    </div>
                    <div>
                      <p className="font-semibold">
                        Đơn thuốc đã cấp (30 ngày):
                      </p>
                      <p className="text-muted">{visit.prescription}</p>
                    </div>
                    <div>
                      <p className="font-semibold">Kết quả cận lâm sàng:</p>
                      <p className="text-muted">{visit.labResults}</p>
                    </div>
                  </div>
                </details>
              ))}
            </section>
            <p className="text-label text-muted">
              Hồ sơ minh họa · Không phải dữ liệu bệnh nhân thật.
            </p>
          </div>
        ) : (
          <>
            <div className="flex-1 space-y-6 overflow-y-auto p-6">
              <section>
                <h3 className="mb-3 text-body font-semibold">
                  Chẩn đoán đã chọn
                </h3>
                <Card className="bg-surface-hover p-4 shadow-none">
                  <div className="flex justify-between gap-2">
                    <p className="text-body font-semibold">
                      {primary.code} · {primary.name}
                    </p>
                    <Pencil className="size-4 shrink-0 text-muted" />
                  </div>
                  <p className="mt-2 text-label text-muted">
                    <span className="rounded-app-sm bg-primary-light px-2 py-1 font-semibold text-primary">
                      • Chẩn đoán chính
                    </span>{" "}
                    {item.diagnosisNotes}
                  </p>
                  <div className="mt-4 space-y-2 border-t border-border pt-3">
                    {secondary.map((diagnosis) => (
                      <div
                        key={diagnosis.code}
                        className="flex items-center gap-2 text-caption"
                      >
                        <span className="rounded-app-sm bg-secondary px-1 font-semibold">
                          {diagnosis.code}
                        </span>
                        <span className="flex-1">{diagnosis.name}</span>
                        <Button
                          variant="ghost"
                          className="h-auto p-0 text-label text-muted"
                          disabled={isReadOnly || isSaving}
                          onClick={() => {
                            setSecondary([
                              ...secondary.filter(
                                (value) => value.code !== diagnosis.code,
                              ),
                              primary,
                            ]);
                            setPrimary(diagnosis);
                          }}
                        >
                          Đặt làm CĐ chính
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon-xs"
                          disabled={isReadOnly || isSaving}
                          aria-label={`Xóa ${diagnosis.code}`}
                          onClick={() =>
                            setSecondary(
                              secondary.filter(
                                (value) => value.code !== diagnosis.code,
                              ),
                            )
                          }
                        >
                          <X className="size-3" />
                        </Button>
                      </div>
                    ))}
                  </div>
                </Card>
              </section>
              <section>
                <label
                  htmlFor="diagnosis-search"
                  className="mb-3 block text-body font-semibold"
                >
                  Thêm chẩn đoán
                </label>
                <div className="relative">
                  <Input
                    id="diagnosis-search"
                    value={search}
                    disabled={isReadOnly || isSaving}
                    onChange={(event) => setSearch(event.target.value)}
                    placeholder="Tìm mã hoặc tên chẩn đoán..."
                  />
                  <Search className="absolute right-3 top-2.5 size-4 text-muted" />
                </div>
                {results.map((diagnosis) => (
                  <Card
                    key={diagnosis.code}
                    className="mt-2 flex items-center gap-3 p-3 shadow-none"
                  >
                    <div className="flex-1">
                      <p className="text-body font-medium">{diagnosis.name}</p>
                      <p className="mt-1 text-label text-muted">
                        Mã: {diagnosis.code} · Nhóm bệnh Tim thiếu máu cục bộ
                      </p>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="bg-primary-light text-primary"
                      disabled={
                        isReadOnly ||
                        isSaving ||
                        secondary.length >= 20 ||
                        primary.code === diagnosis.code ||
                        secondary.some((value) => value.code === diagnosis.code)
                      }
                      onClick={() => setSecondary([...secondary, diagnosis])}
                    >
                      Chọn
                    </Button>
                  </Card>
                ))}
                {!results.length && (
                  <p className="mt-3 text-caption text-muted">
                    Không tìm thấy chẩn đoán.
                  </p>
                )}
                <p className="mt-2 text-label text-muted">
                  Sau khi chọn, đặt chẩn đoán chính hoặc phụ.
                </p>
              </section>
              <section>
                <label
                  htmlFor="diagnosis-notes"
                  className="mb-3 block text-body font-semibold"
                >
                  Ghi chú chẩn đoán
                </label>
                <Textarea
                  id="diagnosis-notes"
                  rows={4}
                  value={notes}
                  disabled={isReadOnly || isSaving}
                  onChange={(event) => setNotes(event.target.value)}
                />
              </section>
            </div>
            <DrawerFooter className="justify-end gap-3">
              <Button variant="outline" onClick={onClose}>
                Hủy bỏ
              </Button>
              <Button
                disabled={isReadOnly || isSaving || !primary.name.trim()}
                onClick={async () => {
                  const code = primary.code.trim();
                  const name = primary.name.trim();
                  if (!code) {
                    toast.error("Cần nhập mã chẩn đoán");
                    return;
                  }
                  const secondaryDiagnoses = secondary.map((diagnosis) => ({
                    code: diagnosis.code.trim(),
                    name: diagnosis.name.trim(),
                  }));
                  if (secondaryDiagnoses.some((diagnosis) => Boolean(diagnosis.code) !== Boolean(diagnosis.name))) {
                    toast.error("Chẩn đoán phụ cần đủ mã và tên");
                    return;
                  }
                  const validSecondaryDiagnoses = secondaryDiagnoses.filter(
                    (diagnosis) => diagnosis.code && diagnosis.name,
                  );
                  setIsSaving(true);
                  try {
                    await onUpdate({
                      diagnosis: `${code} — ${name}`,
                      secondaryDiagnoses: validSecondaryDiagnoses,
                      diagnosisNotes: notes,
                      updatedAt: item.updatedAt,
                    });
                    onClose();
                  } catch {
                    return;
                  } finally {
                    setIsSaving(false);
                  }
                }}
              >
                Lưu chẩn đoán
              </Button>
            </DrawerFooter>
          </>
        )}
      </DrawerContent>
    </Drawer>
  );
}
