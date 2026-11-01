"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { Search, FlaskConical, Trash2, Plus } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/Input";
import { Textarea } from "@/components/ui/Textarea";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/Tabs";
import { LAB_CATALOG } from "../constants";
import type { Examination } from "../types/examinationTypes";

interface Props {
  item: Examination;
  onSave: (changes: Partial<Examination>) => void;
  onBack: () => void;
}

interface LabFormValues {
  reason: string;
  notes: string;
}

export function ExaminationLabOrders({ item, onSave, onBack }: Props) {
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("LAB");
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LabFormValues>({
    defaultValues: {
      reason:
        item.labReason ??
        "Theo dõi hội chứng vành cấp trên nền tăng huyết áp, đau ngực trái từng cơn",
      notes:
        item.labNotes ??
        "Bệnh nhân có tiền sử dị ứng Penicillin. Đo ECG tại giường, lấy máu xét nghiệm ngay.",
    },
  });
  const [selected, setSelected] = useState(
    item.labOrders
      ? item.labOrders.split("; ")
      : [LAB_CATALOG[2], LAB_CATALOG[0], LAB_CATALOG[1]].map(
          (service) => service.name,
        ),
  );
  const services = LAB_CATALOG.filter(
    (service) =>
      (category === "LAB" || service.category === category) &&
      `${service.name} ${service.code}`
        .toLocaleLowerCase("vi")
        .includes(search.toLocaleLowerCase("vi")),
  );
  return (
    <form
      id="lab-orders-form"
      onSubmit={handleSubmit((values) => {
        if (!selected.length || item.status === "COMPLETED") return;
        onSave({
          labOrders: selected.join("; "),
          labReason: values.reason.trim(),
          labNotes: values.notes,
        });
      })}
      className="space-y-4"
    >
      <Card className="p-5 shadow-none">
        <div className="flex justify-between">
          <h2 className="text-base font-bold">Chỉ định cận lâm sàng</h2>
          <FlaskConical className="size-4 text-muted" />
        </div>
        <p className="mt-1 text-caption text-muted">
          Lựa chọn dịch vụ xét nghiệm và chẩn đoán phục vụ phiên khám.
        </p>
        <div className="relative mt-4">
          <Search className="absolute left-3 top-2.5 size-4 text-muted" />
          <Input
            className="pl-9"
            aria-label="Tìm dịch vụ CLS"
            placeholder="Tìm tên hoặc mã dịch vụ..."
            value={search}
            onChange={(event) => setSearch(event.target.value)}
          />
        </div>
        <Tabs
          value={category}
          onValueChange={(value) => setCategory(String(value))}
        >
          <TabsList
            className="mt-3 w-full justify-start gap-4 rounded-none border-0 border-b border-border bg-transparent p-0"
            aria-label="Nhóm dịch vụ CLS"
          >
            {[
              { value: "LAB", label: "Xét nghiệm" },
              { value: "IMAGING", label: "Chẩn đoán hình ảnh" },
              { value: "FUNCTION", label: "Thăm dò chức năng" },
            ].map((tab) => (
              <TabsTrigger
                key={tab.value}
                value={tab.value}
                className="rounded-none border-b-2 border-transparent px-0 py-3 text-caption data-[active]:border-primary data-[active]:bg-transparent data-[active]:shadow-none"
              >
                {tab.label}
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>
        <div className="mt-3 divide-y divide-border">
          {services.map((service) => (
            <div key={service.code} className="flex items-center gap-3 py-4">
              <div className="flex-1">
                <p className="text-body font-medium">{service.name}</p>
                <p className="mt-1 text-label text-muted">{service.code}</p>
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="text-primary"
                disabled={
                  selected.includes(service.name) || item.status === "COMPLETED"
                }
                onClick={() => setSelected([...selected, service.name])}
              >
                <Plus className="size-3" />
                Thêm
              </Button>
            </div>
          ))}
          {!services.length && (
            <p className="py-4 text-caption text-muted">
              Không tìm thấy dịch vụ.
            </p>
          )}
        </div>
      </Card>
      <Card className="p-5 shadow-none">
        <div className="flex justify-between border-b border-border pb-3">
          <h2 className="text-body font-bold">Danh sách chỉ định</h2>
          <span className="text-caption text-muted">
            {String(selected.length).padStart(2, "0")} dịch vụ
          </span>
        </div>
        <ol className="divide-y divide-border">
          {selected.map((name, index) => (
            <li key={name} className="flex items-center gap-3 py-4 text-body">
              <span className="text-caption text-muted">{index + 1}.</span>
              <span className="flex-1">{name}</span>
              <Button
                type="button"
                variant="ghost"
                size="icon-xs"
                aria-label={`Xóa chỉ định ${name}`}
                onClick={() =>
                  setSelected(selected.filter((value) => value !== name))
                }
              >
                <Trash2 className="size-3.5 text-muted" />
              </Button>
            </li>
          ))}
        </ol>
        {!selected.length && (
          <p className="py-5 text-caption text-muted">Chưa chọn dịch vụ.</p>
        )}
      </Card>
      <Card className="space-y-4 p-5 shadow-none">
        <h2 className="text-body font-bold">Thông tin chỉ định</h2>
        <div>
          <label
            className="mb-2 block text-caption font-semibold text-muted"
            htmlFor="lab-diagnosis"
          >
            Chẩn đoán liên quan
          </label>
          <Input
            id="lab-diagnosis"
            readOnly
            className="bg-surface-hover text-muted"
            value={`Theo chẩn đoán đã lưu (${item.diagnosis})`}
          />
        </div>
        <div>
          <label
            className="mb-2 block text-caption font-semibold text-muted"
            htmlFor="lab-reason"
          >
            Lý do chỉ định <span className="text-error-text">*</span>
          </label>
          <Textarea
            id="lab-reason"
            {...register("reason", {
              required: "Vui lòng nhập lý do chỉ định.",
              validate: (value) =>
                !!value.trim() || "Vui lòng nhập lý do chỉ định.",
            })}
            rows={3}
            required
            maxLength={1000}
            aria-invalid={!!errors.reason}
            aria-describedby={errors.reason ? "lab-reason-error" : undefined}
          />
          {errors.reason && (
            <p
              id="lab-reason-error"
              role="alert"
              className="mt-1 text-caption text-error-text"
            >
              {errors.reason.message}
            </p>
          )}
        </div>
        <div>
          <label
            className="mb-2 block text-caption font-semibold text-muted"
            htmlFor="lab-notes"
          >
            Ghi chú
          </label>
          <Textarea
            id="lab-notes"
            {...register("notes")}
            rows={3}
            maxLength={1000}
          />
        </div>
      </Card>
      <footer className="sticky bottom-0 flex flex-wrap justify-between gap-3 rounded-app-lg border border-border bg-surface p-4">
        <Button type="button" variant="ghost" onClick={onBack}>
          ← Quay lại phiên khám
        </Button>
        <div className="flex gap-2">
          <Button type="button" variant="outline" onClick={onBack}>
            Hủy bỏ
          </Button>
          <Button
            type="submit"
            disabled={!selected.length || item.status === "COMPLETED"}
          >
            Lưu & Chờ kết quả CLS
          </Button>
        </div>
      </footer>
    </form>
  );
}
