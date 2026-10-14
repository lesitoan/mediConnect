"use client";

import { useState } from "react";
import Image from "next/image";
import { Edit2, ShieldCheck } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/Dialog";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/Badge";
import type { Doctor, UpdateDoctorInput, Specialty } from "../types/doctorTypes";

interface EditDoctorModalProps {
  doctor: Doctor | null;
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: UpdateDoctorInput) => void;
  specialties: Specialty[];
}

const DEGREES = [
  "BS - Bác sĩ Đa khoa",
  "ThS.BS - Thạc sĩ Bác sĩ",
  "TS.BS - Tiến sĩ Bác sĩ",
  "BS.CKI - Bác sĩ Chuyên khoa 1",
  "BS.CKII - Bác sĩ Chuyên khoa 2",
  "PGS.TS.BS - Phó Giáo sư Bác sĩ",
  "GS.TS.BS - Giáo sư Bác sĩ",
];

const SCHEDULE_OPTIONS = [
  "Thứ 2, 4, 6 (Ca sáng & chiều)",
  "Thứ 3, 5, 7 (Cả ngày)",
  "Thứ 2 đến Thứ 6 (Ca sáng)",
  "Thứ 2 đến Thứ 6 (Ca chiều)",
  "Thứ 7 & Chủ nhật (Cả ngày)",
  "Lịch trực cố định theo tuần",
];

function EditDoctorForm({
  doctor,
  onClose,
  onSave,
  specialties,
}: {
  doctor: Doctor;
  onClose: () => void;
  onSave: (data: UpdateDoctorInput) => void;
  specialties: Specialty[];
}) {
  const initialDegree =
    DEGREES.find((d) => d.startsWith(doctor.degree)) || doctor.degree;

  const [name, setName] = useState(doctor.name);
  const [degree, setDegree] = useState(initialDegree);
  const [licenseNumber, setLicenseNumber] = useState(
    doctor.licenseNumber || ""
  );
  const [specialtyName, setSpecialtyName] = useState(
    doctor.specialtyName || (specialties[0]?.name ?? "")
  );
  const [experienceYears, setExperienceYears] = useState(
    doctor.experienceYears?.toString() || "1"
  );
  const [room, setRoom] = useState(doctor.room || "");
  const [email, setEmail] = useState(doctor.email || "");
  const [phone, setPhone] = useState(doctor.phone || "");
  const [scheduleSummary, setScheduleSummary] = useState(
    doctor.scheduleSummary || SCHEDULE_OPTIONS[0]
  );
  const [patientLimitPerSession, setPatientLimitPerSession] = useState(
    doctor.patientLimitPerSession?.toString() || "20"
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !licenseNumber.trim()) return;

    onSave({
      id: doctor.id,
      name: name.trim(),
      degree: degree.includes(" - ") ? degree.split(" - ")[0] : degree,
      licenseNumber: licenseNumber.trim(),
      specialtyName,
      experienceYears: parseInt(experienceYears, 10) || 1,
      room: room.trim() || doctor.room,
      email: email.trim() || doctor.email,
      phone: phone.trim() || doctor.phone,
      scheduleSummary,
      patientLimitPerSession: parseInt(patientLimitPerSession, 10) || 20,
      avatarUrl: doctor.avatarUrl,
    });

    onClose();
  };

  const isActive = doctor.status === "ACTIVE";

  return (
    <>
      <DialogHeader className="flex-row items-center gap-3 space-y-0">
        <div className="flex size-9 items-center justify-center rounded-app-lg bg-primary-light text-primary">
          <Edit2 className="size-4.5" />
        </div>
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <DialogTitle>Chỉnh sửa hồ sơ bác sĩ</DialogTitle>
            <Badge variant={isActive ? "success" : "neutral"} shape="pill">
              {isActive ? "Đang hoạt động" : "Tạm ngưng"}
            </Badge>
          </div>
          <DialogDescription>
            Cập nhật văn bằng chứng chỉ, chuyên khoa, phòng khám và lịch làm
            việc.
          </DialogDescription>
        </div>
      </DialogHeader>

      <form onSubmit={handleSubmit}>
        <div className="max-h-[calc(85vh-140px)] space-y-4 overflow-y-auto px-6 py-4">
          {/* Header Card với Avatar preview */}
          <div className="flex items-center gap-3.5 rounded-app-xl border border-border bg-background p-3">
            <div className="relative size-14 shrink-0 overflow-hidden rounded-full border border-border">
              <Image
                src={doctor.avatarUrl}
                alt={doctor.name}
                fill
                sizes="56px"
                className="object-cover"
              />
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-body font-bold text-foreground truncate">
                {name || doctor.name}
              </div>
              <div className="text-caption text-muted truncate">
                Mã bác sĩ:{" "}
                <span className="font-semibold text-foreground">
                  {doctor.id}
                </span>{" "}
                • Đánh giá:{" "}
                <span className="font-semibold text-foreground">
                  {doctor.rating}★ ({doctor.reviewCount})
                </span>
              </div>
              <div className="mt-1 flex items-center gap-2 text-caption text-muted">
                <span>Số ca tuần: {doctor.weeklyAppointments}</span>
              </div>
            </div>
          </div>

          {/* Section 1: Thông tin định danh y khoa */}
          <div className="space-y-3">
            <div className="text-caption font-bold uppercase tracking-wider text-muted">
              1. Định danh y tế & bằng cấp
            </div>

            <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
              <div>
                <label className="mb-1 block text-label font-medium text-foreground">
                  Họ và tên bác sĩ <span className="text-error">*</span>
                </label>
                <Input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="VD: Nguyễn Văn A"
                  className="h-9 text-body"
                />
              </div>

              <div>
                <label className="mb-1 block text-label font-medium text-foreground">
                  Học vị / Bằng cấp <span className="text-error">*</span>
                </label>
                <Select
                  value={degree}
                  onChange={(e) => setDegree(e.target.value)}
                  className="h-9 text-body"
                >
                  {DEGREES.map((d) => (
                    <option key={d} value={d}>
                      {d}
                    </option>
                  ))}
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
              <div>
                <label className="mb-1 block text-label font-medium text-foreground">
                  Số CCHN <span className="text-error">*</span>
                </label>
                <Input
                  type="text"
                  required
                  value={licenseNumber}
                  onChange={(e) => setLicenseNumber(e.target.value)}
                  placeholder="012345/BYT-CCHN"
                  className="h-9 font-mono text-body"
                />
              </div>

              <div>
                <label className="mb-1 block text-label font-medium text-foreground">
                  Chuyên khoa phụ trách <span className="text-error">*</span>
                </label>
                <Select
                  value={specialtyName}
                  onChange={(e) => setSpecialtyName(e.target.value)}
                  className="h-9 text-body"
                >
                  {specialties.map((s) => (
                    <option key={s.id} value={s.name}>
                      {s.name}
                    </option>
                  ))}
                </Select>
              </div>

              <div>
                <label className="mb-1 block text-label font-medium text-foreground">
                  Năm kinh nghiệm
                </label>
                <Input
                  type="number"
                  min="0"
                  max="60"
                  value={experienceYears}
                  onChange={(e) => setExperienceYears(e.target.value)}
                  className="h-9 text-body"
                />
              </div>
            </div>
          </div>

          {/* Section 2: Vị trí phòng khám & Liên hệ */}
          <div className="space-y-3 pt-2">
            <div className="text-caption font-bold uppercase tracking-wider text-muted">
              2. Bố trí phòng khám & liên hệ
            </div>

            <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
              <div>
                <label className="mb-1 block text-label font-medium text-foreground">
                  Phòng khám làm việc <span className="text-error">*</span>
                </label>
                <Input
                  type="text"
                  required
                  value={room}
                  onChange={(e) => setRoom(e.target.value)}
                  placeholder="Phòng 302 - Khu A"
                  className="h-9 text-body"
                />
              </div>

              <div>
                <label className="mb-1 block text-label font-medium text-foreground">
                  Số điện thoại <span className="text-error">*</span>
                </label>
                <Input
                  type="tel"
                  required
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="0912 345 678"
                  className="h-9 text-body"
                />
              </div>

              <div>
                <label className="mb-1 block text-label font-medium text-foreground">
                  Email bệnh viện <span className="text-error">*</span>
                </label>
                <Input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="bs.a@mediconnect.vn"
                  className="h-9 text-body"
                />
              </div>
            </div>
          </div>

          {/* Section 3: Lịch khám & Chỉ tiêu */}
          <div className="space-y-3 pt-2">
            <div className="text-caption font-bold uppercase tracking-wider text-muted">
              3. Lịch khám & Giới hạn phiên
            </div>

            <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
              <div>
                <label className="mb-1 block text-label font-medium text-foreground">
                  Khung lịch làm việc cố định
                </label>
                <Select
                  value={scheduleSummary}
                  onChange={(e) => setScheduleSummary(e.target.value)}
                  className="h-9 text-body"
                >
                  {SCHEDULE_OPTIONS.map((opt) => (
                    <option key={opt} value={opt}>
                      {opt}
                    </option>
                  ))}
                </Select>
              </div>

              <div>
                <label className="mb-1 block text-label font-medium text-foreground">
                  Giới hạn số bệnh nhân / ca
                </label>
                <Input
                  type="number"
                  min="5"
                  max="60"
                  value={patientLimitPerSession}
                  onChange={(e) => setPatientLimitPerSession(e.target.value)}
                  className="h-9 text-body"
                />
              </div>
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
          <Button type="submit" variant="default" size="sm" className="gap-1.5">
            <ShieldCheck className="size-4" />
            <span>Lưu thay đổi hồ sơ</span>
          </Button>
        </DialogFooter>
      </form>
    </>
  );
}

export function EditDoctorModal({
  doctor,
  isOpen,
  onClose,
  onSave,
  specialties,
}: EditDoctorModalProps) {
  if (!doctor) return null;

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-[760px] p-0">
        <EditDoctorForm
          key={doctor.id}
          doctor={doctor}
          onClose={onClose}
          onSave={onSave}
          specialties={specialties}
        />
      </DialogContent>
    </Dialog>
  );
}
