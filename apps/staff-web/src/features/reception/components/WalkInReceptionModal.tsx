"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  AlertCircle,
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  Search,
  UserPlus,
  X,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/Dialog";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Textarea } from "@/components/ui/Textarea";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  createReceptionWalkIn,
  findNearestWalkInDate,
  getReceptionError,
  listReceptionProviders,
  listWalkInSlots,
  searchReceptionPatients,
  searchReceptionSpecialties,
} from "../services/receptionService";
import type {
  ReceptionAppointmentDetail,
  ReceptionPatient,
  ReceptionProvider,
  SpecialtyOption,
  WalkInRequest,
  WalkInSlot,
} from "../types/receptionTypes";

interface WalkInReceptionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (appointment: ReceptionAppointmentDetail) => void;
}

type FormErrors = Partial<
  Record<
    | "fullName"
    | "phone"
    | "birthYear"
    | "nationalId"
    | "address"
    | "reason"
    | "specialtyId"
    | "doctorId"
    | "slot",
    string
  >
>;

const PHONE_PATTERN = /^(0|\+84)(3|5|7|8|9)\d{8}$/;
const NATIONAL_ID_PATTERN = /^\d{12}$/;

function normalizePhone(value: string): string {
  const trimmed = value.trim();
  return trimmed.startsWith("+84") ? `0${trimmed.slice(3)}` : trimmed;
}

function clinicToday(): string {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Ho_Chi_Minh",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(new Date());
  const values = Object.fromEntries(
    parts
      .filter(({ type }) => type !== "literal")
      .map(({ type, value }) => [type, value]),
  );
  return `${values.year}-${values.month}-${values.day}`;
}

function formatSlot(slot: WalkInSlot): string {
  const format = (value: string) =>
    new Intl.DateTimeFormat("vi-VN", {
      timeZone: "Asia/Ho_Chi_Minh",
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    }).format(new Date(value));
  return `${format(slot.startsAt)} - ${format(slot.endsAt)}`;
}

export function WalkInReceptionModal({
  isOpen,
  onClose,
  onSuccess,
}: WalkInReceptionModalProps) {
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [searchQuery, setSearchQuery] = useState("");
  const [patients, setPatients] = useState<ReceptionPatient[]>([]);
  const [selectedPatient, setSelectedPatient] =
    useState<ReceptionPatient | null>(null);
  const [isNewProfile, setIsNewProfile] = useState(false);
  const [patientName, setPatientName] = useState("");
  const [patientPhone, setPatientPhone] = useState("");
  const [patientGender, setPatientGender] = useState<
    "MALE" | "FEMALE" | "OTHER"
  >("MALE");
  const [birthYear, setBirthYear] = useState("");
  const [nationalId, setNationalId] = useState("");
  const [address, setAddress] = useState("");
  const [reason, setReason] = useState("");
  const [specialties, setSpecialties] = useState<SpecialtyOption[]>([]);
  const [providers, setProviders] = useState<ReceptionProvider[]>([]);
  const [slots, setSlots] = useState<WalkInSlot[]>([]);
  const [specialtyId, setSpecialtyId] = useState("");
  const [doctorId, setDoctorId] = useState("");
  const [selectedSlotId, setSelectedSlotId] = useState("");
  const [date, setDate] = useState(clinicToday());
  const [shouldCheckIn, setShouldCheckIn] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [isLoadingProviders, setIsLoadingProviders] = useState(false);
  const [isLoadingSlots, setIsLoadingSlots] = useState(false);
  const [isFindingNearestDate, setIsFindingNearestDate] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [errors, setErrors] = useState<FormErrors>({});
  const searchRequestId = useRef(0);
  const providerRequestId = useRef(0);
  const slotRequestId = useRef(0);
  const nearestDateRequestId = useRef(0);

  const selectedSpecialty = specialties.find(({ id }) => id === specialtyId);
  const selectedProvider = providers.find(({ id }) => id === doctorId);
  const selectedSlot = slots.find(({ id }) => id === selectedSlotId);
  const maximumDate = useMemo(() => {
    const value = new Date(`${clinicToday()}T00:00:00+07:00`);
    value.setDate(value.getDate() + 31);
    return new Intl.DateTimeFormat("en-CA", {
      timeZone: "Asia/Ho_Chi_Minh",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    }).format(value);
  }, []);
  const hasDraft =
    Boolean(
      searchQuery ||
        patientName ||
        patientPhone ||
        birthYear ||
        nationalId ||
        address ||
        reason ||
        specialtyId ||
        doctorId ||
        selectedSlotId,
    ) || selectedPatient !== null;

  const resetState = () => {
    setStep(1);
    setSearchQuery("");
    setPatients([]);
    setSelectedPatient(null);
    setIsNewProfile(false);
    setPatientName("");
    setPatientPhone("");
    setPatientGender("MALE");
    setBirthYear("");
    setNationalId("");
    setAddress("");
    setReason("");
    setSpecialtyId("");
    setDoctorId("");
    setSelectedSlotId("");
    setDate(clinicToday());
    setShouldCheckIn(false);
    setProviders([]);
    setSlots([]);
    setErrors({});
    setErrorMessage(null);
  };

  useEffect(() => {
    if (!isOpen) return;
    const timer = window.setTimeout(() => {
      void searchReceptionSpecialties().then(
        setSpecialties,
        (error: unknown) => setErrorMessage(getReceptionError(error).message),
      );
    }, 0);
    return () => window.clearTimeout(timer);
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen || searchQuery.trim().length < 2) {
      const timer = window.setTimeout(() => setPatients([]), 0);
      return () => window.clearTimeout(timer);
    }
    const requestId = ++searchRequestId.current;
    const timer = window.setTimeout(() => {
      setIsSearching(true);
      void searchReceptionPatients(searchQuery).then(
        (items) => {
          if (requestId === searchRequestId.current) setPatients(items);
        },
        (error: unknown) => {
          if (requestId === searchRequestId.current) {
            setErrorMessage(getReceptionError(error).message);
          }
        },
      ).finally(() => {
        if (requestId === searchRequestId.current) setIsSearching(false);
      });
    }, 400);
    return () => window.clearTimeout(timer);
  }, [isOpen, searchQuery]);

  useEffect(() => {
    if (!specialtyId) {
      const timer = window.setTimeout(() => {
        setProviders([]);
        setDoctorId("");
        setSlots([]);
        setSelectedSlotId("");
      }, 0);
      return () => window.clearTimeout(timer);
    }
    const requestId = ++providerRequestId.current;
    const timer = window.setTimeout(() => {
      setIsLoadingProviders(true);
      setDoctorId("");
      setSelectedSlotId("");
      setSlots([]);
      void listReceptionProviders(specialtyId).then(
        (items) => {
          if (requestId === providerRequestId.current) setProviders(items);
        },
        (error: unknown) => {
          if (requestId === providerRequestId.current) {
            setErrorMessage(getReceptionError(error).message);
          }
        },
      ).finally(() => {
        if (requestId === providerRequestId.current) setIsLoadingProviders(false);
      });
    }, 0);
    return () => window.clearTimeout(timer);
  }, [specialtyId]);

  useEffect(() => {
    if (!specialtyId || !doctorId || !date) {
      const timer = window.setTimeout(() => {
        setSlots([]);
        setSelectedSlotId("");
      }, 0);
      return () => window.clearTimeout(timer);
    }
    const requestId = ++slotRequestId.current;
    const timer = window.setTimeout(() => {
      setIsLoadingSlots(true);
      setSelectedSlotId("");
      void listWalkInSlots(date, specialtyId, doctorId).then(
        (items) => {
          if (requestId === slotRequestId.current) setSlots(items);
        },
        (error: unknown) => {
          if (requestId === slotRequestId.current) {
            setErrorMessage(getReceptionError(error).message);
          }
        },
      ).finally(() => {
        if (requestId === slotRequestId.current) setIsLoadingSlots(false);
      });
    }, 0);
    return () => window.clearTimeout(timer);
  }, [date, doctorId, specialtyId]);

  const openStepTwoForPatient = (patient: ReceptionPatient | null) => {
    setSelectedPatient(patient);
    setIsNewProfile(patient === null);
    if (patient) {
      setPatientName(patient.fullName);
      setPatientPhone(patient.phone);
      setPatientGender(patient.gender);
      setBirthYear(String(new Date(patient.dateOfBirth).getFullYear()));
      setNationalId(patient.nationalId ?? "");
      setAddress(patient.address ?? "");
    } else {
      setPatientName("");
      setPatientPhone("");
      setPatientGender("MALE");
      setBirthYear("");
      setNationalId("");
      setAddress("");
    }
    setStep(2);
    setErrorMessage(null);
  };

  const getStepTwoErrors = (): FormErrors => {
    const nextErrors: FormErrors = {};
    const currentYear = new Date().getFullYear();
    const trimmedName = patientName.trim();
    const normalizedPhone = normalizePhone(patientPhone);
    const trimmedNationalId = nationalId.trim();
    const trimmedAddress = address.trim();
    const trimmedReason = reason.trim();
    if (isNewProfile && (trimmedName.length < 2 || trimmedName.length > 100)) {
      nextErrors.fullName = "Họ tên phải từ 2 đến 100 ký tự.";
    } else if (isNewProfile && /\d/.test(trimmedName)) {
      nextErrors.fullName = "Họ tên không được chứa chữ số.";
    }
    if (isNewProfile && !PHONE_PATTERN.test(normalizedPhone)) {
      nextErrors.phone = "Số điện thoại Việt Nam không hợp lệ.";
    }
    const parsedBirthYear = Number(birthYear);
    if (
      isNewProfile &&
      (!Number.isInteger(parsedBirthYear) ||
        parsedBirthYear < 1900 ||
        parsedBirthYear > currentYear)
    ) {
      nextErrors.birthYear = "Năm sinh không hợp lệ.";
    }
    if (trimmedNationalId && !NATIONAL_ID_PATTERN.test(trimmedNationalId)) {
      nextErrors.nationalId = "CCCD phải gồm đúng 12 chữ số.";
    }
    if (trimmedAddress.length > 1000) {
      nextErrors.address = "Địa chỉ không được vượt quá 1000 ký tự.";
    }
    if (trimmedReason.length > 1000) {
      nextErrors.reason = "Lý do khám không được vượt quá 1000 ký tự.";
    }
    if (!specialtyId) nextErrors.specialtyId = "Chọn chuyên khoa.";
    if (!doctorId) nextErrors.doctorId = "Chọn bác sĩ.";
    if (!selectedSlotId) nextErrors.slot = "Chọn khung giờ.";
    return nextErrors;
  };

  const validateStepTwo = (): boolean => {
    const nextErrors = getStepTwoErrors();
    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const stepTwoErrors = getStepTwoErrors();
  const canContinue = Object.keys(stepTwoErrors).length === 0;

  const validateField = (field: keyof FormErrors) => {
    const nextErrors = getStepTwoErrors();
    setErrors((current) => ({
      ...current,
      [field]: nextErrors[field],
    }));
  };

  const handleClose = () => {
    if (hasDraft && !window.confirm("Bạn có muốn đóng và bỏ dữ liệu đã nhập?")) {
      return;
    }
    resetState();
    onClose();
  };

  const handleSubmit = async () => {
    if (isSubmitting || !selectedSlotId || !specialtyId || !doctorId) return;
    const input: WalkInRequest = {
      ...(selectedPatient
        ? { patientId: selectedPatient.id }
        : {
            fullName: patientName.trim(),
            phone: normalizePhone(patientPhone),
            birthYear: Number(birthYear),
            gender: patientGender,
            nationalId: nationalId.trim() || undefined,
            address: address.trim() || undefined,
          }),
      specialtyId,
      doctorId,
      appointmentSlotId: selectedSlotId,
      reason: reason.trim() || undefined,
      checkIn: shouldCheckIn,
    };

    setIsSubmitting(true);
    setErrorMessage(null);
    try {
      const appointment = await createReceptionWalkIn(input);
      resetState();
      onSuccess(appointment);
    } catch (error) {
      const normalizedError = getReceptionError(error);
      if (normalizedError.status === 409) {
        setSelectedSlotId("");
        setStep(2);
        setErrorMessage(
          "Khung giờ vừa có người đặt, vui lòng chọn khung khác.",
        );
        void listWalkInSlots(date, specialtyId, doctorId).then(
          setSlots,
          (slotError: unknown) =>
            setErrorMessage(getReceptionError(slotError).message),
        );
      } else {
        setErrorMessage(normalizedError.message);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleFindNearestDate = async () => {
    if (!specialtyId || !doctorId || isFindingNearestDate) return;
    const requestId = ++nearestDateRequestId.current;
    setIsFindingNearestDate(true);
    setErrorMessage(null);
    try {
      const nearestDate = await findNearestWalkInDate(
        date,
        specialtyId,
        doctorId,
      );
      if (requestId !== nearestDateRequestId.current) return;
      if (nearestDate) {
        setDate(nearestDate);
      } else {
        setErrorMessage("Không tìm thấy ngày còn khung giờ trong 31 ngày tới.");
      }
    } catch (error) {
      if (requestId === nearestDateRequestId.current) {
        setErrorMessage(getReceptionError(error).message);
      }
    } finally {
      if (requestId === nearestDateRequestId.current) {
        setIsFindingNearestDate(false);
      }
    }
  };

  const selectedPatientSummary = useMemo(
    () => selectedPatient ?? null,
    [selectedPatient],
  );

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && handleClose()}>
      <DialogContent
        showCloseButton={false}
        className={cn(
          "flex max-h-[calc(100dvh-32px)] flex-col overflow-hidden p-0 sm:max-h-[88vh]",
          step === 1 ? "max-w-[560px]" : "max-w-[680px]",
        )}
      >
        <DialogHeader className="shrink-0 border-b border-border p-5">
          <div className="flex items-start justify-between gap-3">
            <div>
              <DialogTitle>Tiếp nhận bệnh nhân vãng lai</DialogTitle>
              <DialogDescription>
                Bước {step}/3:{" "}
                {step === 1
                  ? "Tra cứu hồ sơ"
                  : step === 2
                    ? "Thông tin bệnh nhân và lượt khám"
                    : "Xác nhận tiếp nhận"}
              </DialogDescription>
            </div>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              aria-label="Đóng"
              onClick={handleClose}
            >
              <X className="size-4" />
            </Button>
          </div>
        </DialogHeader>

        <div className="flex-1 space-y-4 overflow-y-auto p-5">
          {errorMessage && (
            <div className="flex items-start gap-2 rounded-app-lg border border-error/30 bg-error-bg p-3 text-caption text-error">
              <AlertCircle className="mt-0.5 size-4 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          {step === 1 && (
            <>
              <div className="relative">
                <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted" />
                <Input
                  value={searchQuery}
                  onChange={(event) => setSearchQuery(event.target.value)}
                  placeholder="Tìm tên, SĐT, mã BN hoặc CCCD..."
                  className="pl-9"
                  autoFocus
                />
              </div>
              <div className="rounded-app-xl border border-border p-3">
                {isSearching ? (
                  <p className="p-5 text-center text-caption text-muted">
                    Đang tra cứu...
                  </p>
                ) : searchQuery.trim().length < 2 ? (
                  <p className="p-5 text-center text-caption text-muted">
                    Nhập ít nhất 2 ký tự để tra cứu.
                  </p>
                ) : patients.length === 0 ? (
                  <p className="p-5 text-center text-caption text-muted">
                    Không tìm thấy hồ sơ phù hợp.
                  </p>
                ) : (
                  <div className="space-y-2">
                    {patients.map((patient) => (
                      <button
                        key={patient.id}
                        type="button"
                        onClick={() => openStepTwoForPatient(patient)}
                        className="flex w-full items-center justify-between rounded-app-lg border border-border p-3 text-left hover:bg-secondary"
                      >
                        <span>
                          <span className="block font-semibold text-foreground">
                            {patient.fullName}
                          </span>
                          <span className="text-caption text-muted">
                            {patient.patientCode} • {patient.phone}
                          </span>
                        </span>
                        <ArrowRight className="size-4 text-primary" />
                      </button>
                    ))}
                  </div>
                )}
              </div>
              <Button
                type="button"
                variant="outline"
                className="w-full"
                onClick={() => openStepTwoForPatient(null)}
              >
                <UserPlus className="size-4" />
                Tạo hồ sơ mới
              </Button>
            </>
          )}

          {step === 2 && (
            <>
              {selectedPatientSummary && (
                <div className="rounded-app-xl border border-primary/30 bg-primary-light/30 p-3">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <div className="font-semibold text-foreground">
                        {selectedPatientSummary.fullName}
                      </div>
                      <div className="text-caption text-muted">
                        {selectedPatientSummary.patientCode} •{" "}
                        {selectedPatientSummary.phone}
                      </div>
                    </div>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => setStep(1)}
                    >
                      Đổi hồ sơ
                    </Button>
                  </div>
                </div>
              )}
              {isNewProfile && (
                <div className="grid gap-3 sm:grid-cols-2">
                  <label className="text-caption font-medium">
                    Họ tên*
                    <Input
                      value={patientName}
                      onChange={(event) => setPatientName(event.target.value)}
                      onBlur={() => validateField("fullName")}
                      className="mt-1"
                    />
                    {errors.fullName && (
                      <span className="text-error">{errors.fullName}</span>
                    )}
                  </label>
                  <label className="text-caption font-medium">
                    Số điện thoại*
                    <Input
                      value={patientPhone}
                      onChange={(event) => setPatientPhone(event.target.value)}
                      onBlur={() => {
                        setPatientPhone(normalizePhone(patientPhone));
                        validateField("phone");
                      }}
                      className="mt-1"
                    />
                    {errors.phone && (
                      <span className="text-error">{errors.phone}</span>
                    )}
                  </label>
                  <label className="text-caption font-medium">
                    Năm sinh*
                    <Input
                      type="number"
                      value={birthYear}
                      onChange={(event) => setBirthYear(event.target.value)}
                      onBlur={() => validateField("birthYear")}
                      className="mt-1"
                    />
                    {errors.birthYear && (
                      <span className="text-error">{errors.birthYear}</span>
                    )}
                  </label>
                  <label className="text-caption font-medium">
                    Giới tính
                    <Select
                      value={patientGender}
                      onChange={(event) =>
                        setPatientGender(
                          event.target.value as "MALE" | "FEMALE" | "OTHER",
                        )
                      }
                      className="mt-1"
                    >
                      <option value="MALE">Nam</option>
                      <option value="FEMALE">Nữ</option>
                      <option value="OTHER">Khác</option>
                    </Select>
                  </label>
                  <label className="text-caption font-medium">
                    CCCD
                    <Input
                      value={nationalId}
                      onChange={(event) => setNationalId(event.target.value)}
                      onBlur={() => validateField("nationalId")}
                      className="mt-1"
                    />
                    {errors.nationalId && (
                      <span className="text-error">{errors.nationalId}</span>
                    )}
                  </label>
                  <label className="text-caption font-medium">
                    Địa chỉ
                    <Input
                      value={address}
                      onChange={(event) => setAddress(event.target.value)}
                      onBlur={() => validateField("address")}
                      className="mt-1"
                    />
                    {errors.address && (
                      <span className="text-error">{errors.address}</span>
                    )}
                  </label>
                </div>
              )}
              <div className="grid gap-3 sm:grid-cols-2">
                <label className="text-caption font-medium">
                  Chuyên khoa*
                  <Select
                    value={specialtyId}
                    onChange={(event) => {
                      setSpecialtyId(event.target.value);
                      setErrors((current) => ({
                        ...current,
                        specialtyId: undefined,
                      }));
                    }}
                    onBlur={() => validateField("specialtyId")}
                    className="mt-1"
                  >
                    <option value="">Chọn chuyên khoa</option>
                    {specialties.map((specialty) => (
                      <option key={specialty.id} value={specialty.id}>
                        {specialty.name}
                      </option>
                    ))}
                  </Select>
                  {errors.specialtyId && (
                    <span className="text-error">{errors.specialtyId}</span>
                  )}
                </label>
                <label className="text-caption font-medium">
                  Bác sĩ-Phòng khám*
                  <Select
                    value={doctorId}
                    onChange={(event) => {
                      setDoctorId(event.target.value);
                      setErrors((current) => ({
                        ...current,
                        doctorId: undefined,
                      }));
                    }}
                    onBlur={() => validateField("doctorId")}
                    disabled={!specialtyId || isLoadingProviders}
                    className="mt-1"
                  >
                    <option value="">
                      {isLoadingProviders ? "Đang tải..." : "Chọn bác sĩ"}
                    </option>
                    {providers.map((provider) => (
                      <option key={provider.id} value={provider.id}>
                        {provider.academicTitle} {provider.user.fullName} -{" "}
                        {provider.specialty.roomCode ?? "Chưa có phòng"}
                      </option>
                    ))}
                  </Select>
                  {errors.doctorId && (
                    <span className="text-error">{errors.doctorId}</span>
                  )}
                </label>
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-caption font-medium">
                    Khung giờ khám còn trống trong ngày
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="date"
                      value={date}
                      min={clinicToday()}
                      max={maximumDate}
                      onChange={(event) => setDate(event.target.value)}
                      className="rounded-app-md border border-border bg-background px-2 py-1 text-caption"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setDate(clinicToday())}
                      disabled={date === clinicToday()}
                    >
                      Ngày hôm nay
                    </Button>
                  </div>
                </div>
                {isLoadingSlots ? (
                  <p className="p-4 text-center text-caption text-muted">
                    Đang tải khung giờ...
                  </p>
                ) : slots.length === 0 ? (
                  <div className="space-y-2 rounded-app-lg border border-dashed border-border p-4 text-center">
                    <p className="text-caption text-muted">
                      Không còn khung giờ trống
                    </p>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => void handleFindNearestDate()}
                      disabled={isFindingNearestDate}
                    >
                      {isFindingNearestDate
                        ? "Đang tìm ngày gần nhất..."
                        : "Xem ngày có lịch gần nhất"}
                    </Button>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                    {slots.map((slot) => (
                      <button
                        key={slot.id}
                        type="button"
                        onClick={() => {
                          setSelectedSlotId(slot.id);
                          setErrors((current) => ({
                            ...current,
                            slot: undefined,
                          }));
                        }}
                        className={cn(
                          "rounded-app-lg border p-2 text-caption",
                          selectedSlotId === slot.id
                            ? "border-primary bg-primary-light font-semibold text-primary"
                            : "border-border hover:bg-secondary",
                        )}
                      >
                        {formatSlot(slot)}
                      </button>
                    ))}
                  </div>
                )}
                {errors.slot && <span className="text-caption text-error">{errors.slot}</span>}
              </div>
              <label className="text-caption font-medium">
                Lý do khám/Triệu chứng sơ bộ
                <Textarea
                  value={reason}
                  maxLength={1000}
                  onChange={(event) => setReason(event.target.value)}
                  onBlur={() => validateField("reason")}
                  className="mt-1"
                  rows={3}
                />
                {errors.reason && (
                  <span className="text-error">{errors.reason}</span>
                )}
              </label>
            </>
          )}

          {step === 3 && (
            <>
              <div className="space-y-3 rounded-app-xl border border-border p-4 text-caption">
                <div>
                  <span className="text-muted">Bệnh nhân</span>
                  <div className="font-semibold text-foreground">
                    {patientName} • {patientPhone}
                  </div>
                </div>
                <div>
                  <span className="text-muted">Bác sĩ-Phòng khám</span>
                  <div className="font-semibold text-foreground">
                    {selectedProvider?.academicTitle}{" "}
                    {selectedProvider?.user.fullName} •{" "}
                    {selectedProvider?.specialty.roomCode ?? ""}
                  </div>
                </div>
                <div>
                  <span className="text-muted">Chuyên khoa</span>
                  <div className="font-semibold text-foreground">
                    {selectedSpecialty?.name}
                  </div>
                </div>
                <div>
                  <span className="text-muted">Ngày giờ</span>
                  <div className="font-semibold text-foreground">
                    {date} • {selectedSlot ? formatSlot(selectedSlot) : ""}
                  </div>
                </div>
                <div>
                  <span className="text-muted">Lý do khám</span>
                  <div className="font-semibold text-foreground">
                    {reason.trim() || "Không có"}
                  </div>
                </div>
              </div>
              <label className="flex items-center gap-2 text-caption font-medium">
                <input
                  type="checkbox"
                  checked={shouldCheckIn}
                  onChange={(event) => setShouldCheckIn(event.target.checked)}
                />
                Check-in ngay
              </label>
            </>
          )}
        </div>

        <DialogFooter className="shrink-0 gap-2 border-t border-border bg-secondary/20 p-4">
          {step === 2 && (
            <Button type="button" variant="outline" onClick={() => setStep(1)}>
              <ArrowLeft className="size-4" />
              Quay lại
            </Button>
          )}
          {step === 3 && (
            <Button type="button" variant="outline" onClick={() => setStep(2)}>
              <ArrowLeft className="size-4" />
              Quay lại chỉnh sửa
            </Button>
          )}
          {step === 2 && (
            <>
              {!canContinue && (
                <span className="mr-auto text-caption text-muted">
                  {errors.slot ?? "Vui lòng hoàn tất các trường bắt buộc."}
                </span>
              )}
              <Button
                type="button"
                disabled={!canContinue}
                onClick={() => {
                  if (validateStepTwo()) setStep(3);
                }}
              >
                Tiếp tục: Xác nhận
                <ArrowRight className="size-4" />
              </Button>
            </>
          )}
          {step === 3 && (
            <Button
              type="button"
              disabled={isSubmitting}
              onClick={() => void handleSubmit()}
            >
              <CheckCircle2 className="size-4" />
              {isSubmitting ? "Đang xử lý..." : "Xác nhận tiếp nhận"}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
