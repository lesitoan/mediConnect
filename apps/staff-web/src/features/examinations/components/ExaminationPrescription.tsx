"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { ClipboardPlus, PlusCircle, List, Trash2, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/Input";
import { Textarea } from "@/components/ui/Textarea";
import { Card } from "@/components/ui/Card";
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "@/components/ui/Table";
import type { Examination, PrescriptionItem } from "../types/examinationTypes";

interface Props {
  item: Examination;
  onUpdate: (changes: Partial<Examination>) => void;
  onBack: () => void;
}

type PrescriptionFormValues = Omit<PrescriptionItem, "id">;

export function ExaminationPrescription({ item, onUpdate, onBack }: Props) {
  const [rows, setRows] = useState<PrescriptionItem[]>(
    item.prescriptionItems ?? [],
  );
  const [isSaved, setIsSaved] = useState(false);
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<PrescriptionFormValues>();

  const add = (values: PrescriptionFormValues) => {
    setRows((previous) => [
      ...previous,
      { ...values, id: crypto.randomUUID(), name: values.name.trim() },
    ]);
    setIsSaved(false);
    reset();
  };

  return (
    <div className="space-y-4">
      <Card className="flex items-center gap-3 p-4 shadow-none">
        <div className="rounded-app-lg bg-primary-light p-3 text-primary">
          <ClipboardPlus className="size-6" />
        </div>
        <div className="flex-1">
          <h2 className="text-heading font-bold">Kê đơn thuốc</h2>
          <p className="mt-1 text-caption text-muted">
            Đơn thuốc minh họa cho phiên khám hiện tại, chưa phát hành đơn thật.
          </p>
        </div>
        <span
          role="status"
          className="rounded-full bg-primary-light px-2 py-1 text-label text-primary"
        >
          • {isSaved ? "Đã lưu bản xem thử" : "Theo dữ liệu đã lưu"}
        </span>
      </Card>
      <Card className="p-5 shadow-none">
        <h3 className="mb-4 flex items-center gap-2 border-b border-border pb-3 text-body font-bold">
          <PlusCircle className="size-4 text-primary" />
          Thêm thuốc vào đơn
        </h3>
        <form onSubmit={handleSubmit(add)} className="space-y-4">
          <div>
            <label
              htmlFor="drug-name"
              className="mb-2 block text-caption font-semibold"
            >
              Tên thuốc / Hoạt chất <span className="text-error-text">*</span>
            </label>
            <Input
              id="drug-name"
              {...register("name", {
                required: "Vui lòng nhập tên thuốc.",
                validate: (value) =>
                  !!value.trim() || "Vui lòng nhập tên thuốc.",
              })}
              placeholder="Tìm hoặc nhập tên thuốc..."
              required
              maxLength={150}
              aria-invalid={!!errors.name}
              aria-describedby={errors.name ? "drug-name-error" : undefined}
            />
            {errors.name && (
              <p
                id="drug-name-error"
                role="alert"
                className="mt-1 text-caption text-error-text"
              >
                {errors.name.message}
              </p>
            )}
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {(
              [
                {
                  name: "strength",
                  label: "Hàm lượng / Dạng thuốc",
                  type: "text",
                },
                { name: "dose", label: "Liều mỗi lần", type: "text" },
                { name: "route", label: "Đường dùng", type: "text" },
                { name: "frequency", label: "Tần suất sử dụng", type: "text" },
                { name: "days", label: "Số ngày", type: "number" },
                { name: "quantity", label: "Số lượng kê", type: "number" },
              ] as const
            ).map((field) => (
              <div key={field.name}>
                <label
                  htmlFor={`drug-${field.name}`}
                  className="mb-2 block text-caption font-semibold"
                >
                  {field.label}
                </label>
                <Input
                  id={`drug-${field.name}`}
                  {...register(field.name, {
                    required: "Vui lòng nhập thông tin thuốc.",
                    ...(field.type === "number"
                      ? { valueAsNumber: true, min: 1, max: 10000 }
                      : {}),
                  })}
                  type={field.type}
                  placeholder="Nhập hoặc chọn"
                  min={field.type === "number" ? 1 : undefined}
                  max={field.type === "number" ? 10000 : undefined}
                  step={field.type === "number" ? 1 : undefined}
                  maxLength={150}
                  required
                />
              </div>
            ))}
          </div>
          <div>
            <label
              htmlFor="drug-instructions"
              className="mb-2 block text-caption font-semibold"
            >
              Hướng dẫn sử dụng
            </label>
            <Textarea
              id="drug-instructions"
              {...register("instructions")}
              rows={2}
              maxLength={1000}
              placeholder="Nhập hướng dẫn dùng thuốc..."
            />
          </div>
          <div className="flex justify-end">
            <Button type="submit" disabled={item.status === "COMPLETED"}>
              <Plus className="size-4" />
              Thêm thuốc
            </Button>
          </div>
        </form>
      </Card>
      <Card className="p-4 shadow-none">
        <h3 className="mb-3 flex items-center gap-2 border-b border-border pb-3 text-body font-bold">
          <List className="size-4 text-primary" />
          Danh sách thuốc đã kê{" "}
          <span className="rounded-full bg-secondary px-2 py-1 text-label text-muted">
            {rows.length} mục
          </span>
        </h3>
        <Table>
          <TableHeader>
            <TableRow>
              {[
                "STT",
                "Tên thuốc / Hàm lượng",
                "Liều & Đường dùng",
                "Tần suất",
                "Thời gian",
                "Số lượng",
                "Thao tác",
              ].map((label) => (
                <TableHead key={label} className="bg-primary-light text-label">
                  {label}
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((row, index) => (
              <TableRow key={row.id}>
                <TableCell>{index + 1}</TableCell>
                <TableCell>
                  <p className="font-semibold">{row.name}</p>
                  <p className="text-caption text-muted">{row.strength}</p>
                </TableCell>
                <TableCell>
                  {row.dose} · {row.route}
                </TableCell>
                <TableCell>{row.frequency}</TableCell>
                <TableCell>{row.days} ngày</TableCell>
                <TableCell>{row.quantity}</TableCell>
                <TableCell>
                  <Button
                    variant="ghost"
                    size="icon-xs"
                    aria-label={`Xóa thuốc ${row.name}`}
                    onClick={() => {
                      setRows(rows.filter((value) => value.id !== row.id));
                      setIsSaved(false);
                    }}
                  >
                    <Trash2 className="size-3.5 text-muted" />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
        {!rows.length && (
          <div className="flex min-h-48 flex-col items-center justify-center gap-4 px-6 text-center">
            <div className="rounded-full bg-secondary p-3 text-muted">
              <ClipboardPlus className="size-5" />
            </div>
            <p className="text-body text-muted">
              Chưa có thuốc trong đơn. Vui lòng nhập thông tin thuốc phía trên
              để thêm vào đơn.
            </p>
          </div>
        )}
      </Card>
      <footer className="sticky bottom-0 flex flex-wrap justify-between gap-3 rounded-app-lg border border-border bg-surface p-4">
        <Button variant="ghost" onClick={onBack}>
          ← Quay lại phiên khám
        </Button>
        <div className="flex gap-2">
          <Button variant="outline" onClick={onBack}>
            Quay lại
          </Button>
          <Button
            disabled={item.status === "COMPLETED"}
            onClick={() => {
              onUpdate({
                prescriptionItems: rows,
                prescription: rows
                  .map(
                    (row) =>
                      `${row.name} ${row.strength}: ${row.dose}, ${row.frequency}, ${row.days} ngày`,
                  )
                  .join("\n"),
              });
              setIsSaved(true);
            }}
          >
            Lưu đơn thuốc
          </Button>
        </div>
      </footer>
    </div>
  );
}
