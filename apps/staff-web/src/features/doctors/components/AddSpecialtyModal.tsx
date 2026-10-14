"use client";

import { useState } from "react";
import {
  Stethoscope,
  HeartPulse,
  Baby,
  Activity,
  Sparkles,
  Eye,
  Bone,
  ShieldAlert,
  Building2,
  Plus,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/Dialog";
import { Input } from "@/components/ui/Input";
import { Textarea } from "@/components/ui/Textarea";
import { Select } from "@/components/ui/Select";
import { Button } from "@/components/ui/button";
import type { CreateSpecialtyInput } from "../types/doctorTypes";

interface AddSpecialtyModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: CreateSpecialtyInput) => void;
}

const ICON_OPTIONS = [
  { value: "Stethoscope", label: "Ống nghe y khoa (Đa khoa)", icon: Stethoscope },
  { value: "HeartPulse", label: "Nhịp tim (Tim mạch)", icon: HeartPulse },
  { value: "Baby", label: "Trẻ sơ sinh (Nhi & Sơ sinh)", icon: Baby },
  { value: "Activity", label: "Biểu đồ nhịp (Nội tiết & Chuyển hóa)", icon: Activity },
  { value: "Sparkles", label: "Tỏa sáng (Da liễu & Thẩm mỹ)", icon: Sparkles },
  { value: "Eye", label: "Mắt (Mắt & Nhãn khoa)", icon: Eye },
  { value: "Bone", label: "Xương khớp (Chỉnh hình)", icon: Bone },
  { value: "ShieldAlert", label: "Khiên bảo vệ (Tiêu hóa & Gan mật)", icon: ShieldAlert },
];

export function AddSpecialtyModal({
  isOpen,
  onClose,
  onSubmit,
}: AddSpecialtyModalProps) {
  const [name, setName] = useState("");
  const [code, setCode] = useState("");
  const [description, setDescription] = useState("");
  const [headDoctorName, setHeadDoctorName] = useState("");
  const [activeRooms, setActiveRooms] = useState("2");
  const [iconName, setIconName] = useState("Stethoscope");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !code.trim()) return;

    onSubmit({
      name: name.trim(),
      code: code.trim().toUpperCase(),
      description: description.trim() || "Chẩn đoán và điều trị bệnh lý chuyên khoa",
      headDoctorName: headDoctorName.trim() || "Đang phân công",
      activeRooms: parseInt(activeRooms, 10) || 1,
      iconName,
    });

    // Reset form
    setName("");
    setCode("");
    setDescription("");
    setHeadDoctorName("");
    setActiveRooms("2");
    setIconName("Stethoscope");

    onClose();
  };

  const SelectedIcon =
    ICON_OPTIONS.find((i) => i.value === iconName)?.icon || Stethoscope;

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-[620px] p-0">
        <DialogHeader className="flex-row items-center gap-3 space-y-0">
          <div className="flex size-9 items-center justify-center rounded-app-lg bg-primary text-primary-foreground shadow-xs">
            <Building2 className="size-5" />
          </div>
          <div>
            <DialogTitle>Thêm chuyên khoa mới</DialogTitle>
            <DialogDescription className="mt-0.5">
              Thiết lập mã định danh, mô tả chuyên môn và phòng khám chuyên khoa
            </DialogDescription>
          </div>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="flex flex-col">
          <div className="max-h-[65vh] space-y-4 overflow-y-auto p-5 sm:p-6">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="space-y-1.5 sm:col-span-2">
                <label
                  htmlFor="specialty-name"
                  className="text-caption font-semibold text-foreground"
                >
                  Tên chuyên khoa lâm sàng <span className="text-destructive">*</span>
                </label>
                <Input
                  id="specialty-name"
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Ví dụ: Thần kinh & Đột quỵ"
                />
              </div>

              <div className="space-y-1.5">
                <label
                  htmlFor="specialty-code"
                  className="text-caption font-semibold text-foreground"
                >
                  Mã định danh khoa <span className="text-destructive">*</span>
                </label>
                <Input
                  id="specialty-code"
                  type="text"
                  required
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  placeholder="Ví dụ: SPEC-NEU"
                />
              </div>

              <div className="space-y-1.5">
                <label
                  htmlFor="specialty-rooms"
                  className="text-caption font-semibold text-foreground"
                >
                  Số phòng khám hoạt động
                </label>
                <Input
                  id="specialty-rooms"
                  type="number"
                  min="1"
                  max="20"
                  value={activeRooms}
                  onChange={(e) => setActiveRooms(e.target.value)}
                />
              </div>

              <div className="space-y-1.5 sm:col-span-2">
                <label
                  htmlFor="specialty-head"
                  className="text-caption font-semibold text-foreground"
                >
                  Bác sĩ Trưởng khoa đảm nhiệm
                </label>
                <Input
                  id="specialty-head"
                  type="text"
                  value={headDoctorName}
                  onChange={(e) => setHeadDoctorName(e.target.value)}
                  placeholder="Ví dụ: TS.BS Nguyễn Văn An"
                />
              </div>

              <div className="space-y-1.5 sm:col-span-2">
                <label
                  htmlFor="specialty-icon"
                  className="text-caption font-semibold text-foreground"
                >
                  Biểu tượng chuyên khoa
                </label>
                <div className="flex items-center gap-3">
                  <div className="flex size-9.5 shrink-0 items-center justify-center rounded-app-lg bg-primary-light text-primary border border-border">
                    <SelectedIcon className="size-5" />
                  </div>
                  <Select
                    id="specialty-icon"
                    value={iconName}
                    onChange={(e) => setIconName(e.target.value)}
                    className="flex-1"
                  >
                    {ICON_OPTIONS.map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </Select>
                </div>
              </div>

              <div className="space-y-1.5 sm:col-span-2">
                <label
                  htmlFor="specialty-desc"
                  className="text-caption font-semibold text-foreground"
                >
                  Mô tả phạm vi hoạt động & điều trị
                </label>
                <Textarea
                  id="specialty-desc"
                  rows={3}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Mô tả các dịch vụ khám chữa bệnh chính của chuyên khoa..."
                />
              </div>
            </div>
          </div>

          <DialogFooter className="gap-2 sm:gap-3">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={onClose}
              className="text-muted hover:text-foreground"
            >
              Hủy bỏ
            </Button>
            <Button
              type="submit"
              variant="default"
              size="sm"
              className="gap-1.5"
            >
              <Plus className="size-4" />
              <span>Thêm chuyên khoa</span>
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
