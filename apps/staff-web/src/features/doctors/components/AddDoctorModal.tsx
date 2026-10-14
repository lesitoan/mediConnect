"use client";

import { useState } from "react";
import { UserPlus, Upload, Info } from "lucide-react";
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
import type { CreateDoctorInput, Specialty } from "../types/doctorTypes";

interface AddDoctorModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: CreateDoctorInput) => void;
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
];

export function AddDoctorModal({
  isOpen,
  onClose,
  onSubmit,
  specialties,
}: AddDoctorModalProps) {
  const [name, setName] = useState("");
  const [degree, setDegree] = useState("BS.CKII - Bác sĩ Chuyên khoa 2");
  const [licenseNumber, setLicenseNumber] = useState("");
  const [specialtyName, setSpecialtyName] = useState(
    specialties[0]?.name || "Nhi & Sơ sinh"
  );
  const [experienceYears, setExperienceYears] = useState("10");
  const [room, setRoom] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [scheduleSummary, setScheduleSummary] = useState(SCHEDULE_OPTIONS[0]);
  const [patientLimitPerSession, setPatientLimitPerSession] = useState("20");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !licenseNumber.trim()) return;

    onSubmit({
      name: name.trim(),
      degree: degree.split(" - ")[0],
      licenseNumber: licenseNumber.trim(),
      specialtyName,
      experienceYears: parseInt(experienceYears, 10) || 1,
      room: room.trim() || "Phòng khám Đa khoa",
      email: email.trim() || "bacsi@mediconnect.vn",
      phone: phone.trim() || "0912 345 678",
      scheduleSummary,
      patientLimitPerSession: parseInt(patientLimitPerSession, 10) || 20,
      avatarUrl: "/images/doctors/doctor-1-4a0be7.png",
    });

    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-[760px] p-0">
        <DialogHeader className="flex-row items-center gap-3 space-y-0">
          <div className="flex size-9 items-center justify-center rounded-app-lg bg-brand-secondary-light text-primary">
            <UserPlus className="size-5" />
          </div>
          <div>
            <DialogTitle>Thêm bác sĩ mới vào hệ thống</DialogTitle>
            <DialogDescription className="mt-0.5">
              Nhập thông tin nhân sự y tế, chứng chỉ hành nghề và định danh chuyên khoa
            </DialogDescription>
          </div>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="flex flex-col">
          <div className="max-h-[65vh] space-y-4 overflow-y-auto p-5 sm:p-6">
            <div className="flex items-center gap-4 rounded-app-xl border border-border bg-primary-light/50 p-4">
              <div className="flex size-16 shrink-0 flex-col items-center justify-center rounded-full border-2 border-dashed border-muted bg-secondary text-muted">
                <Upload className="size-5" />
                <span className="text-label font-medium">Tải ảnh</span>
              </div>
              <div className="space-y-1 text-label">
                <div className="font-semibold text-foreground">
                  Ảnh chân dung chuyên môn
                </div>
                <div className="text-muted">
                  Định dạng JPG, PNG dung lượng dưới 5MB. Khuyến nghị tỷ lệ vuông 1:1.
                </div>
                <div className="flex items-center gap-2 pt-1">
                  <Button
                    type="button"
                    variant="outline"
                    size="xs"
                    className="border-border text-primary font-semibold"
                  >
                    Chọn tệp tin
                  </Button>
                  <span className="text-muted">Chưa có tệp nào được chọn</span>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <label
                  htmlFor="doctor-fullname"
                  className="text-label font-semibold text-foreground"
                >
                  Họ và tên bác sĩ <span className="text-destructive">*</span>
                </label>
                <Input
                  id="doctor-fullname"
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Ví dụ: BS.CKII Phan Hải Nam"
                />
              </div>

              <div className="space-y-1.5">
                <label
                  htmlFor="doctor-degree"
                  className="text-label font-semibold text-foreground"
                >
                  Học hàm & Học vị <span className="text-destructive">*</span>
                </label>
                <Select
                  id="doctor-degree"
                  value={degree}
                  onChange={(e) => setDegree(e.target.value)}
                >
                  {DEGREES.map((d) => (
                    <option key={d} value={d}>
                      {d}
                    </option>
                  ))}
                </Select>
              </div>

              <div className="space-y-1.5">
                <label
                  htmlFor="doctor-license"
                  className="text-label font-semibold text-foreground"
                >
                  Mã định danh / CCHN <span className="text-destructive">*</span>
                </label>
                <Input
                  id="doctor-license"
                  type="text"
                  required
                  value={licenseNumber}
                  onChange={(e) => setLicenseNumber(e.target.value)}
                  placeholder="Ví dụ: CCHN-01048/BYT"
                />
              </div>

              <div className="space-y-1.5">
                <label
                  htmlFor="doctor-specialty"
                  className="text-label font-semibold text-foreground"
                >
                  Chuyên khoa lâm sàng <span className="text-destructive">*</span>
                </label>
                <Select
                  id="doctor-specialty"
                  value={specialtyName}
                  onChange={(e) => setSpecialtyName(e.target.value)}
                >
                  {specialties.map((spec) => (
                    <option key={spec.id} value={spec.name}>
                      {spec.name}
                    </option>
                  ))}
                </Select>
              </div>

              <div className="space-y-1.5">
                <label
                  htmlFor="doctor-experience"
                  className="text-label font-semibold text-foreground"
                >
                  Số năm kinh nghiệm
                </label>
                <div className="relative">
                  <Input
                    id="doctor-experience"
                    type="number"
                    min="1"
                    max="60"
                    value={experienceYears}
                    onChange={(e) => setExperienceYears(e.target.value)}
                    className="pr-14"
                  />
                  <span className="pointer-events-none absolute top-1/2 right-3 -translate-y-1/2 text-label text-muted">
                    năm
                  </span>
                </div>
              </div>

              <div className="space-y-1.5">
                <label
                  htmlFor="doctor-room"
                  className="text-label font-semibold text-foreground"
                >
                  Phòng khám phụ trách
                </label>
                <Input
                  id="doctor-room"
                  type="text"
                  value={room}
                  onChange={(e) => setRoom(e.target.value)}
                  placeholder="Ví dụ: Phòng can thiệp Tim mạch A1-04"
                />
              </div>

              <div className="space-y-1.5">
                <label
                  htmlFor="doctor-email"
                  className="text-label font-semibold text-foreground"
                >
                  Email công vụ
                </label>
                <Input
                  id="doctor-email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="hainam.phan@mediconnect.vn"
                />
              </div>

              <div className="space-y-1.5">
                <label
                  htmlFor="doctor-phone"
                  className="text-label font-semibold text-foreground"
                >
                  Số điện thoại liên hệ
                </label>
                <Input
                  id="doctor-phone"
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="0918 842 119"
                />
              </div>

              <div className="space-y-1.5">
                <label
                  htmlFor="doctor-schedule"
                  className="text-label font-semibold text-foreground"
                >
                  Lịch khám dự kiến
                </label>
                <Select
                  id="doctor-schedule"
                  value={scheduleSummary}
                  onChange={(e) => setScheduleSummary(e.target.value)}
                >
                  {SCHEDULE_OPTIONS.map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </Select>
              </div>

              <div className="space-y-1.5">
                <label
                  htmlFor="doctor-patient-limit"
                  className="text-label font-semibold text-foreground"
                >
                  Giới hạn bệnh nhân / phiên khám
                </label>
                <div className="relative">
                  <Input
                    id="doctor-patient-limit"
                    type="number"
                    min="5"
                    max="50"
                    value={patientLimitPerSession}
                    onChange={(e) => setPatientLimitPerSession(e.target.value)}
                    className="pr-16"
                  />
                  <span className="pointer-events-none absolute top-1/2 right-3 -translate-y-1/2 text-label text-muted">
                    BN/ca
                  </span>
                </div>
              </div>
            </div>

            <div className="flex items-start gap-2.5 rounded-app-lg border border-border bg-secondary p-3 text-label text-muted">
              <Info className="size-4 shrink-0 text-primary mt-0.5" />
              <span>
                Sau khi tạo hồ sơ thành công, hệ thống sẽ tự động kích hoạt tài khoản nhân viên y tế và gửi thông báo xác nhận lịch khám đến email công vụ của bác sĩ.
              </span>
            </div>
          </div>

          <DialogFooter className="flex-row items-center justify-between sm:justify-between">
            <div className="flex items-center gap-2 text-label text-muted">
              <span className="size-2 rounded-full bg-success" />
              <span>Trạng thái ban đầu: Đang hoạt động</span>
            </div>

            <div className="flex items-center gap-3">
              <Button
                type="button"
                variant="outline"
                size="default"
                onClick={onClose}
              >
                Hủy bỏ
              </Button>
              <Button type="submit" variant="default" size="default">
                Tạo hồ sơ bác sĩ
              </Button>
            </div>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
