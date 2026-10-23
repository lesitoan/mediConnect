"use client";

import { useState, useMemo } from "react";
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
import { Textarea } from "@/components/ui/Textarea";
import { Badge } from "@/components/ui/Badge";
import {
  UserPlus,
  ArrowRight,
  ArrowLeft,
  CheckCircle2,
  AlertCircle,
  User,
  Stethoscope,
  Search,
  ChevronRight,
  Plus,
  X,
  FileText,
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  SPECIALTY_OPTIONS,
  SERVICE_PACKAGES,
  DOCTORS_BY_SPECIALTY,
  TIME_SLOTS,
  EXISTING_PATIENT_PROFILES,
} from "../constants";
import { searchPatientProfiles } from "../services/receptionService";
import type { WalkInReceptionInput, PatientProfile } from "../types/receptionTypes";

interface WalkInReceptionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: WalkInReceptionInput) => void;
}

function getInitials(name: string): string {
  const parts = name.trim().split(" ");
  if (parts.length >= 2) {
    return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
  }
  return name.slice(0, 2).toUpperCase();
}

export function WalkInReceptionModal({
  isOpen,
  onClose,
  onSubmit,
}: WalkInReceptionModalProps) {
  // Step 1: Tra cứu hồ sơ (Search) | Step 2: Form phân bổ dịch vụ | Step 3: Xác nhận
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [isNewProfile, setIsNewProfile] = useState(false);

  // Search states (Default query "Nguyễn Hoàng Long" to perfectly match Figma preview)
  const [searchQuery, setSearchQuery] = useState("Nguyễn Hoàng Long");
  const [selectedPatient, setSelectedPatient] = useState<PatientProfile | null>(
    EXISTING_PATIENT_PROFILES[0] || null
  );

  // Form states
  const [patientName, setPatientName] = useState("");
  const [patientPhone, setPatientPhone] = useState("");
  const [patientGender, setPatientGender] = useState<"MALE" | "FEMALE">("MALE");
  const [patientBirthYear, setPatientBirthYear] = useState("1992");
  const [nationalId, setNationalId] = useState("");
  const [address, setAddress] = useState("");
  const [patientCode, setPatientCode] = useState<string | undefined>(undefined);

  const [specialtyName, setSpecialtyName] = useState(SPECIALTY_OPTIONS[0]);
  const [servicePackage, setServicePackage] = useState(SERVICE_PACKAGES[0]);

  const availableDoctors = DOCTORS_BY_SPECIALTY[specialtyName] || [
    { name: "Nguyễn Văn An", degree: "BS.CKII", room: "P.302" },
  ];
  const [doctorIndex, setDoctorIndex] = useState(0);

  const selectedDoctor = availableDoctors[doctorIndex] || availableDoctors[0];
  const [selectedTimeSlot, setSelectedTimeSlot] = useState(TIME_SLOTS[4]); // "08:30 - 08:45"
  const [reason, setReason] = useState("");

  // Search results computed from service helper
  const searchResults = useMemo(() => {
    return searchPatientProfiles(searchQuery, EXISTING_PATIENT_PROFILES);
  }, [searchQuery]);

  // Handle select patient from search results
  const handleSelectPatient = (patient: PatientProfile) => {
    setSelectedPatient(patient);
  };

  // Click "+ Tạo hồ sơ"
  const handleCreateNewProfile = () => {
    setIsNewProfile(true);
    setSelectedPatient(null);
    setPatientCode(undefined);
    setPatientName("");
    setPatientPhone("");
    setPatientGender("MALE");
    setPatientBirthYear("1995");
    setNationalId("");
    setAddress("");
    setStep(2);
  };

  // Click "Tiếp tục" from Step 1 (Search)
  const handleProceedWithExisting = () => {
    if (!selectedPatient) return;
    setIsNewProfile(false);
    setPatientCode(selectedPatient.patientCode);
    setPatientName(selectedPatient.name);
    setPatientPhone(selectedPatient.phone);
    setPatientGender(selectedPatient.gender);
    setPatientBirthYear(String(selectedPatient.birthYear));
    setNationalId(selectedPatient.nationalId || "");
    setAddress(selectedPatient.address || "");
    setStep(2);
  };

  // Click "Tiếp tục" from Step 2 (Form) -> Go to Step 3 (Confirmation)
  const handleNextToConfirm = (e: React.FormEvent) => {
    e.preventDefault();
    if (!patientName.trim() || !patientPhone.trim()) return;
    setStep(3);
  };

  // Click "Xác nhận & Cấp STT" from Step 3
  const handleConfirm = () => {
    onSubmit({
      patientCode,
      patientName: patientName.trim(),
      patientPhone: patientPhone.trim(),
      patientGender,
      patientBirthYear: parseInt(patientBirthYear, 10) || 1990,
      nationalId: nationalId.trim(),
      address: address.trim(),
      specialtyName,
      doctorName: selectedDoctor.name,
      room: selectedDoctor.room,
      servicePackage,
      appointmentDate: "Hôm nay - 16/03/2026",
      timeSlot: selectedTimeSlot,
      reason: reason.trim(),
    });

    handleClose();
  };

  const handleClose = () => {
    setStep(1);
    setIsNewProfile(false);
    setSearchQuery("Nguyễn Hoàng Long");
    setSelectedPatient(EXISTING_PATIENT_PROFILES[0] || null);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && handleClose()}>
      <DialogContent
        className={cn(
          "p-0 overflow-hidden flex flex-col max-h-[calc(100dvh-32px)] sm:max-h-[88vh]",
          step === 1 ? "max-w-[560px]" : "max-w-[640px]"
        )}
      >
        {/* ========================================================================= */}
        {/* STEP 1: TÌM KIẾM HỒ SƠ BỆNH NHÂN TRƯỚC KHI TIẾP NHẬN (FIGMA SCREEN)      */}
        {/* ========================================================================= */}
        {step === 1 && (
          <>
            <DialogHeader className="shrink-0 p-4 sm:p-5 pb-2.5">
              <DialogTitle className="text-title font-bold text-foreground">
                Tiếp nhận bệnh nhân vãng lai
              </DialogTitle>
              <DialogDescription className="text-caption text-muted mt-0.5">
                Tìm hồ sơ bệnh nhân trước khi tiếp nhận
              </DialogDescription>
            </DialogHeader>

            <div className="flex-1 overflow-y-auto space-y-3 px-4 sm:px-5 pb-4">
              {/* Ô TÌM KIẾM BỆNH NHÂN */}
              <div className="space-y-1">
                <label className="text-[11px] font-bold uppercase tracking-wider text-muted block pt-3">
                  Tìm kiếm bệnh nhân
                </label>
                <div className="relative">
                  <Search className="size-4 text-muted absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <Input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Nhập họ tên, mã bệnh nhân (BN-xxxx), SĐT hoặc CCCD..."
                    className="h-9.5 pl-10 pr-9 text-body bg-background rounded-app-xl border-border focus-visible:ring-primary"
                    autoFocus
                  />
                  {searchQuery && (
                    <button
                      type="button"
                      onClick={() => setSearchQuery("")}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted hover:text-foreground p-1"
                    >
                      <X className="size-3.5" />
                    </button>
                  )}
                </div>
              </div>

              {/* CARD: KẾT QUẢ TRA CỨU */}
              <div className="rounded-app-xl border border-border p-3.5 bg-surface space-y-2.5">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <h4 className="text-body font-bold text-foreground">
                      Kết quả tra cứu
                    </h4>
                    <p className="text-caption text-muted">
                      Hiển thị hồ sơ khớp với thông tin tìm kiếm từ hệ thống.
                    </p>
                  </div>
                  {searchResults.length > 0 && (
                    <Badge variant="outline" className="text-[11px] px-2 py-0.5 text-muted">
                      {searchResults.length} hồ sơ
                    </Badge>
                  )}
                </div>

                {searchResults.length > 0 ? (
                  <div className="max-h-[220px] overflow-y-auto space-y-2 pr-1">
                    {searchResults.map((patient) => {
                      const isSelected = selectedPatient?.id === patient.id;
                      return (
                        <div
                          key={patient.id}
                          role="button"
                          tabIndex={0}
                          onClick={() => handleSelectPatient(patient)}
                          onKeyDown={(e) => {
                            if (e.key === "Enter" || e.key === " ") {
                              handleSelectPatient(patient);
                            }
                          }}
                          className={cn(
                            "rounded-app-lg p-2.5 flex items-center justify-between cursor-pointer transition-all border text-left",
                            isSelected
                              ? "border-2 border-primary bg-primary/5 ring-1 ring-primary/20 shadow-xs"
                              : "border-border hover:border-border-strong hover:bg-secondary/40 bg-surface"
                          )}
                        >
                          <div className="flex items-center gap-2.5 min-w-0">
                            <div
                              className={cn(
                                "size-9 rounded-full flex items-center justify-center font-bold text-caption shrink-0 transition-colors",
                                isSelected
                                  ? "bg-primary text-white"
                                  : "bg-secondary text-foreground"
                              )}
                            >
                              {getInitials(patient.name)}
                            </div>
                            <div className="min-w-0 space-y-0.5">
                              <div className="flex items-center gap-2">
                                <span className="font-bold text-body text-foreground truncate">
                                  {patient.name}
                                </span>
                                <Badge
                                  variant="outline"
                                  className="bg-primary-light text-primary border-primary/20 font-semibold text-[11px] px-2 py-0.5 rounded-full"
                                >
                                  {patient.patientCode}
                                </Badge>
                              </div>
                              <div className="text-caption text-muted truncate">
                                {patient.gender === "MALE" ? "Nam" : "Nữ"} •{" "}
                                {patient.birthYear} • SĐT: {patient.phone} •{" "}
                                {patient.address}
                              </div>
                            </div>
                          </div>
                          <ChevronRight
                            className={cn(
                              "size-4 shrink-0 transition-colors ml-2",
                              isSelected ? "text-primary" : "text-muted"
                            )}
                          />
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="rounded-app-xl border border-dashed border-border p-4 text-center text-caption text-muted">
                    Không tìm thấy hồ sơ nào khớp với từ khóa tra cứu.
                  </div>
                )}
              </div>

              {/* CARD: BỆNH NHÂN CHƯA CÓ HỒ SƠ? */}
              <div className="rounded-app-xl border border-border p-3 bg-surface flex items-center justify-between">
                <div className="space-y-0.5">
                  <h4 className="text-body font-bold text-foreground">
                    Bệnh nhân chưa có hồ sơ?
                  </h4>
                  <p className="text-caption text-muted">
                    Tạo hồ sơ mới sau khi tra cứu
                  </p>
                </div>
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  onClick={handleCreateNewProfile}
                  className="h-8 px-3 text-caption font-semibold gap-1.5 rounded-app-lg"
                >
                  <Plus className="size-3.5" />
                  <span>Tạo hồ sơ</span>
                </Button>
              </div>
            </div>

            <DialogFooter className="shrink-0 gap-2.5 p-3.5 sm:px-5 border-t border-border bg-secondary/10">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleClose}
                className="px-4 text-body text-foreground"
              >
                Đóng
              </Button>
              <Button
                type="button"
                variant="default"
                size="sm"
                disabled={!selectedPatient}
                onClick={handleProceedWithExisting}
                className="px-5 text-body font-semibold"
              >
                Tiếp tục
              </Button>
            </DialogFooter>
          </>
        )}

        {/* ========================================================================= */}
        {/* STEP 2: PHÂN BỔ DỊCH VỤ KHÁM & THÔNG TIN TIẾP NHẬN                        */}
        {/* ========================================================================= */}
        {step === 2 && (
          <>
            <DialogHeader className="flex-row items-center gap-3 space-y-0 p-5 pb-3 border-b border-border">
              <div className="flex size-9 items-center justify-center rounded-app-lg bg-primary-light text-primary">
                {isNewProfile ? (
                  <UserPlus className="size-4.5" />
                ) : (
                  <FileText className="size-4.5" />
                )}
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <DialogTitle className="text-title font-bold text-foreground">
                    {isNewProfile
                      ? "Tạo hồ sơ bệnh nhân mới"
                      : "Phân bổ chuyên khoa & dịch vụ"}
                  </DialogTitle>
                  <Badge variant="brand" shape="pill">
                    Bước 2/3
                  </Badge>
                </div>
                <DialogDescription className="text-caption text-muted">
                  {isNewProfile
                    ? "Nhập thông tin hành chính bệnh nhân và phân bổ ca khám trực tiếp."
                    : "Chọn chuyên khoa, bác sĩ và khung giờ khám cho bệnh nhân."}
                </DialogDescription>
              </div>
            </DialogHeader>

            <form onSubmit={handleNextToConfirm}>
              <div className="max-h-[calc(80vh-140px)] space-y-4 overflow-y-auto px-6 py-4">
                {/* Nếu là bệnh nhân đã có hồ sơ -> hiển thị Card tóm tắt có nút Đổi hồ sơ */}
                {!isNewProfile && selectedPatient && (
                  <div className="rounded-app-xl border border-primary/20 bg-primary/5 p-3.5 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="size-10 rounded-full bg-primary text-white flex items-center justify-center font-bold text-caption">
                        {getInitials(selectedPatient.name)}
                      </div>
                      <div className="space-y-0.5">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-body text-foreground">
                            {selectedPatient.name}
                          </span>
                          <Badge
                            variant="outline"
                            className="bg-primary-light text-primary border-primary/20 font-semibold text-[11px] px-2 py-0.5 rounded-full"
                          >
                            {selectedPatient.patientCode}
                          </Badge>
                        </div>
                        <p className="text-caption text-muted">
                          {selectedPatient.gender === "MALE" ? "Nam" : "Nữ"} •{" "}
                          {selectedPatient.birthYear} • SĐT: {selectedPatient.phone}
                        </p>
                      </div>
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => setStep(1)}
                      className="text-primary hover:text-primary-hover text-caption font-semibold"
                    >
                      Đổi hồ sơ
                    </Button>
                  </div>
                )}

                {/* Nếu là bệnh nhân MỚI -> Form nhập thông tin bệnh nhân */}
                {isNewProfile && (
                  <div className="space-y-3">
                    <div className="text-caption font-bold uppercase tracking-wider text-muted flex items-center gap-1.5">
                      <User className="size-3.5 text-primary" />
                      <span>1. Thông tin bệnh nhân</span>
                    </div>

                    <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                      <div>
                        <label className="mb-1 block text-label font-medium text-foreground">
                          Họ và tên bệnh nhân <span className="text-error">*</span>
                        </label>
                        <Input
                          type="text"
                          required
                          value={patientName}
                          onChange={(e) => setPatientName(e.target.value)}
                          placeholder="VD: Nguyễn Văn Nam"
                          className="h-8.5 text-body"
                        />
                      </div>

                      <div>
                        <label className="mb-1 block text-label font-medium text-foreground">
                          Số điện thoại liên hệ <span className="text-error">*</span>
                        </label>
                        <Input
                          type="tel"
                          required
                          value={patientPhone}
                          onChange={(e) => setPatientPhone(e.target.value)}
                          placeholder="0912 345 678"
                          className="h-8.5 text-body"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                      <div>
                        <label className="mb-1 block text-label font-medium text-foreground">
                          Năm sinh <span className="text-error">*</span>
                        </label>
                        <Input
                          type="number"
                          min="1920"
                          max="2026"
                          required
                          value={patientBirthYear}
                          onChange={(e) => setPatientBirthYear(e.target.value)}
                          className="h-8.5 text-body"
                        />
                      </div>

                      <div>
                        <label className="mb-1 block text-label font-medium text-foreground">
                          Giới tính
                        </label>
                        <Select
                          value={patientGender}
                          onChange={(e) =>
                            setPatientGender(e.target.value as "MALE" | "FEMALE")
                          }
                          className="h-8.5 text-body"
                        >
                          <option value="MALE">Nam</option>
                          <option value="FEMALE">Nữ</option>
                        </Select>
                      </div>

                      <div>
                        <label className="mb-1 block text-label font-medium text-foreground">
                          Số CCCD / BHYT
                        </label>
                        <Input
                          type="text"
                          value={nationalId}
                          onChange={(e) => setNationalId(e.target.value)}
                          placeholder="001290012345"
                          className="h-8.5 text-body"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="mb-1 block text-label font-medium text-foreground">
                        Địa chỉ cư trú
                      </label>
                      <Input
                        type="text"
                        value={address}
                        onChange={(e) => setAddress(e.target.value)}
                        placeholder="Số nhà, tên đường, quận/huyện..."
                        className="h-8.5 text-body"
                      />
                    </div>
                  </div>
                )}

                {/* Phần chọn Chuyên khoa & Bác sĩ */}
                <div className="space-y-3 pt-2">
                  <div className="text-caption font-bold uppercase tracking-wider text-muted flex items-center gap-1.5">
                    <Stethoscope className="size-3.5 text-primary" />
                    <span>
                      {isNewProfile
                        ? "2. Thông tin lượt khám & phòng khám"
                        : "Thông tin lượt khám & phòng khám"}
                    </span>
                  </div>

                  <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                    <div>
                      <label className="mb-1 block text-label font-medium text-foreground">
                        Chuyên khoa cần khám <span className="text-error">*</span>
                      </label>
                      <Select
                        value={specialtyName}
                        onChange={(e) => {
                          setSpecialtyName(e.target.value);
                          setDoctorIndex(0);
                        }}
                        className="h-8.5 text-body font-semibold text-primary"
                      >
                        {SPECIALTY_OPTIONS.map((spec) => (
                          <option key={spec} value={spec}>
                            {spec}
                          </option>
                        ))}
                      </Select>
                    </div>

                    <div>
                      <label className="mb-1 block text-label font-medium text-foreground">
                        Bác sĩ / Phòng khám phụ trách <span className="text-error">*</span>
                      </label>
                      <Select
                        value={doctorIndex}
                        onChange={(e) =>
                          setDoctorIndex(parseInt(e.target.value, 10))
                        }
                        className="h-8.5 text-body"
                      >
                        {availableDoctors.map((doc, idx) => (
                          <option key={doc.name} value={idx}>
                            {doc.degree} {doc.name} ({doc.room})
                          </option>
                        ))}
                      </Select>
                    </div>
                  </div>

                  <div>
                    <label className="mb-1 block text-label font-medium text-foreground">
                      Dịch vụ / Gói khám <span className="text-error">*</span>
                    </label>
                    <Select
                      value={servicePackage}
                      onChange={(e) => setServicePackage(e.target.value)}
                      className="h-8.5 text-body"
                    >
                      {SERVICE_PACKAGES.map((pkg) => (
                        <option key={pkg} value={pkg}>
                          {pkg}
                        </option>
                      ))}
                    </Select>
                  </div>

                  {/* Khung giờ còn trống */}
                  <div>
                    <label className="mb-1.5 block text-label font-medium text-foreground flex items-center justify-between">
                      <span>Khung giờ khám còn trống trong ca sáng:</span>
                      <span className="text-caption font-semibold text-primary">
                        Ngày hôm nay
                      </span>
                    </label>
                    <div className="grid grid-cols-3 gap-1.5 sm:grid-cols-4">
                      {TIME_SLOTS.slice(0, 8).map((slot) => {
                        const isSelected = selectedTimeSlot === slot;
                        return (
                          <button
                            key={slot}
                            type="button"
                            onClick={() => setSelectedTimeSlot(slot)}
                            className={cn(
                              "rounded-app-md py-1.5 px-2 text-center text-caption font-medium transition-all duration-150 border",
                              isSelected
                                ? "bg-primary text-white border-primary font-bold shadow-xs"
                                : "bg-surface border-border text-foreground hover:bg-secondary/60 hover:border-border-strong"
                            )}
                          >
                            {slot}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  <div>
                    <label className="mb-1 block text-label font-medium text-foreground">
                      Lý do khám / Triệu chứng sơ bộ
                    </label>
                    <Textarea
                      rows={2}
                      value={reason}
                      onChange={(e) => setReason(e.target.value)}
                      placeholder="Mô tả triệu chứng bệnh nhân phản ánh tại quầy..."
                      className="text-body"
                    />
                  </div>
                </div>
              </div>

              <DialogFooter className="gap-2 p-4 border-t border-border bg-secondary/20">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setStep(1)}
                  className="gap-1.5 text-muted hover:text-foreground"
                >
                  <ArrowLeft className="size-4" />
                  <span>Quay lại</span>
                </Button>
                <Button type="submit" variant="default" size="sm" className="gap-1.5">
                  <span>Tiếp tục: Xác nhận</span>
                  <ArrowRight className="size-4" />
                </Button>
              </DialogFooter>
            </form>
          </>
        )}

        {/* ========================================================================= */}
        {/* STEP 3: XÁC NHẬN TIẾP NHẬN & CẤP SỐ THỨ TỰ (FIGMA CONFIRMATION FRAME)     */}
        {/* ========================================================================= */}
        {step === 3 && (
          <>
            <DialogHeader className="flex-row items-center gap-3 space-y-0 p-5 pb-3 border-b border-border">
              <div className="flex size-9 items-center justify-center rounded-app-lg bg-primary-light text-primary">
                <CheckCircle2 className="size-5" />
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <DialogTitle className="text-title font-bold text-foreground">
                    Xác nhận tiếp nhận vãng lai
                  </DialogTitle>
                  <Badge variant="success" shape="pill">
                    Bước 3/3: Xác nhận
                  </Badge>
                </div>
                <DialogDescription className="text-caption text-muted">
                  Kiểm tra lại toàn bộ thông tin trước khi tạo lượt tiếp nhận và xuất số thứ tự.
                </DialogDescription>
              </div>
            </DialogHeader>

            <div className="space-y-4 px-6 py-4">
              {/* Thông tin bệnh nhân */}
              <div className="space-y-2 rounded-app-xl border border-border bg-background p-4 text-caption">
                <div className="text-caption font-bold uppercase tracking-wider text-muted">
                  Thông tin bệnh nhân
                </div>
                <div className="flex items-center justify-between py-1 border-b border-border/60">
                  <span className="text-muted">Họ và tên:</span>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-foreground text-body">
                      {patientName}
                    </span>
                    {patientCode && (
                      <Badge
                        variant="outline"
                        className="bg-primary-light text-primary border-primary/20 text-[11px]"
                      >
                        {patientCode}
                      </Badge>
                    )}
                  </div>
                </div>
                <div className="flex items-center justify-between py-1 border-b border-border/60">
                  <span className="text-muted">Số điện thoại:</span>
                  <span className="font-semibold text-foreground">
                    {patientPhone}
                  </span>
                </div>
                <div className="flex items-center justify-between py-1 border-b border-border/60">
                  <span className="text-muted">Giới tính & Năm sinh:</span>
                  <span className="text-foreground">
                    {patientGender === "MALE" ? "Nam" : "Nữ"} • {patientBirthYear}
                  </span>
                </div>
                {address && (
                  <div className="flex items-center justify-between py-1">
                    <span className="text-muted">Địa chỉ:</span>
                    <span className="text-foreground truncate max-w-[240px]">
                      {address}
                    </span>
                  </div>
                )}
              </div>

              {/* Thông tin lượt khám */}
              <div className="space-y-2 rounded-app-xl border border-border bg-background p-4 text-caption">
                <div className="text-caption font-bold uppercase tracking-wider text-muted">
                  Thông tin lượt khám
                </div>
                <div className="flex items-center justify-between py-1 border-b border-border/60">
                  <span className="text-muted">Chuyên khoa:</span>
                  <span className="font-semibold text-primary">
                    {specialtyName}
                  </span>
                </div>
                <div className="flex items-center justify-between py-1 border-b border-border/60">
                  <span className="text-muted">Bác sĩ phụ trách:</span>
                  <span className="font-semibold text-foreground">
                    {selectedDoctor.degree} {selectedDoctor.name} ({selectedDoctor.room})
                  </span>
                </div>
                <div className="flex items-center justify-between py-1 border-b border-border/60">
                  <span className="text-muted">Khung giờ tiếp nhận:</span>
                  <span className="font-bold text-foreground tabular-nums">
                    {selectedTimeSlot}
                  </span>
                </div>
                <div className="flex items-center justify-between py-1">
                  <span className="text-muted">Gói dịch vụ:</span>
                  <span className="font-medium text-foreground text-right max-w-[280px]">
                    {servicePackage}
                  </span>
                </div>
              </div>

              {/* Callout thông báo khớp Figma */}
              <div className="flex items-start gap-2.5 rounded-app-lg border border-primary/20 bg-primary-light/40 p-3 text-caption text-primary">
                <AlertCircle className="size-4 shrink-0 mt-0.5" />
                <span>
                  Hệ thống sẽ kiểm tra lại khung giờ trước khi tạo lượt tiếp nhận và đưa bệnh nhân vào hàng chờ.
                </span>
              </div>
            </div>

            <DialogFooter className="gap-2 p-4 border-t border-border bg-secondary/20">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setStep(2)}
                className="gap-1.5 text-muted hover:text-foreground"
              >
                <ArrowLeft className="size-4" />
                <span>Quay lại chỉnh sửa</span>
              </Button>
              <Button
                type="button"
                variant="default"
                size="sm"
                onClick={handleConfirm}
                className="gap-1.5"
              >
                <CheckCircle2 className="size-4" />
                <span>Xác nhận tiếp nhận</span>
              </Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
