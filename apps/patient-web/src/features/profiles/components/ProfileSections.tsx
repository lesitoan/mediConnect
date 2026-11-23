"use client";

import { useState } from "react";

import {
  Activity,
  AlertTriangle,
  FileText,
  ChevronRight,
  Info,
  IdCard,
  Lock,
  Mail,
  Pencil,
  PhoneCall,
  Plus,
  ShieldCheck,
  Users,
  X,
} from "@/components/layout/icons";
import { changePassword } from "@/features/auth/services/authService";
import { formatProfileDate, type IdentityForm } from "../data";
import type {
  PatientMedicalRecord,
  PatientProfile,
} from "../services/patientProfileService";
import { createPatientAllergy } from "../services/patientProfileService";

const card =
  "scroll-mt-32 rounded-2xl border border-white/80 bg-white p-5 shadow-[0_8px_28px_rgba(10,90,132,0.09)] sm:p-6 lg:p-7";
const input =
  "w-full rounded-xl border border-slate-200 bg-blue-50/50 px-4 py-3 text-sm font-semibold text-slate-900 outline-none transition focus:border-[#2B6CB0] focus:bg-white focus:ring-2 focus:ring-[#2B6CB0]/20";
const locked =
  "w-full rounded-xl border border-slate-200 bg-slate-100 px-4 py-3 text-sm font-bold text-slate-700";

function SectionHead({
  icon,
  title,
  sub,
  right,
}: {
  icon: React.ReactNode;
  title: string;
  sub: string;
  right?: React.ReactNode;
}) {
  return (
    <div className="flex items-start justify-between gap-3">
      <div className="flex items-start gap-3">
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-blue-100 text-[#0A5A84]">
          {icon}
        </span>
        <div className="leading-tight">
          <h2 className="text-lg font-extrabold text-slate-900">{title}</h2>
          <p className="mt-0.5 text-[11px] text-slate-500">{sub}</p>
        </div>
      </div>
      {right}
    </div>
  );
}

function Label({
  children,
  right,
}: {
  children: React.ReactNode;
  right?: React.ReactNode;
}) {
  return (
    <div className="mb-1.5 flex items-center justify-between gap-2 text-xs">
      <span className="font-bold text-slate-700">{children}</span>
      {right}
    </div>
  );
}

/* ---------- 1. Định danh & liên hệ ---------- */

export function IdentitySection({
  profile,
  form,
  isEditing,
  onEdit,
  onChange,
}: {
  profile: PatientProfile;
  form: IdentityForm;
  isEditing: boolean;
  onEdit: () => void;
  onChange: <K extends keyof IdentityForm>(k: K, v: IdentityForm[K]) => void;
}) {
  return (
    <section id="identity" className={card}>
      <SectionHead
        icon={<IdCard className="h-4 w-4" />}
        title="Thông tin cá nhân"
        sub="Thông tin định danh và liên hệ được lưu trong hồ sơ MediConnect"
        right={
          <button
            type="button"
            onClick={onEdit}
            disabled={isEditing}
            className="inline-flex items-center gap-1.5 rounded-lg border border-[#0A5A84] px-3 py-1.5 text-[11px] font-bold text-[#0A5A84] transition hover:bg-blue-50 disabled:cursor-default disabled:opacity-60"
          >
            <Pencil className="h-3 w-3" />
            {isEditing ? "Đang chỉnh sửa" : "Chỉnh sửa"}
          </button>
        }
      />

      <div className="mt-6 overflow-hidden rounded-2xl border border-blue-100">
        <div className="bg-blue-50 px-4 py-2.5 text-xs font-extrabold text-[#0A5A84]">
          Thông tin cơ bản
        </div>
        <div className="grid gap-x-5 gap-y-4 p-4 md:grid-cols-2">
          <div>
            <Label>Họ tên</Label>
            <div className={`${locked} flex items-center justify-between`}>
              {profile.fullName}
              <Lock className="h-4 w-4 text-slate-400" />
            </div>
          </div>
          <div>
            <Label>Số CCCD / Định danh cá nhân</Label>
            <input
              inputMode="numeric"
              maxLength={12}
              placeholder="Nhập 12 chữ số CCCD"
              pattern="[0-9]{12}"
              className={isEditing ? input : locked}
              disabled={!isEditing}
              value={form.nationalId}
              onChange={(e) =>
                onChange("nationalId", e.target.value.replace(/\D/g, ""))
              }
            />
            {form.nationalId.length > 0 && form.nationalId.length !== 12 && (
              <p className="mt-1.5 text-[11px] text-red-600">
                CCCD phải gồm đúng 12 chữ số.
              </p>
            )}
          </div>
          <div>
            <Label>Ngày sinh</Label>
            <input
              type="date"
              className={isEditing ? input : locked}
              disabled={!isEditing}
              value={form.dateOfBirth}
              max={new Date().toISOString().split("T")[0]}
              onChange={(e) => onChange("dateOfBirth", e.target.value)}
            />
          </div>
          <div>
            <Label>Số điện thoại</Label>
            <div className={`${locked} flex items-center justify-between`}>
              {profile.phone ?? "Chưa cập nhật"}
              <Lock className="h-4 w-4 text-slate-400" />
            </div>
          </div>
          <div>
            <Label>Giới tính</Label>
            <select
              className={isEditing ? input : locked}
              disabled={!isEditing}
              value={form.gender}
              onChange={(e) => {
                const gender = e.target.value;
                onChange(
                  "gender",
                  gender === "MALE" || gender === "FEMALE" || gender === "OTHER"
                    ? gender
                    : "",
                );
              }}
            >
              <option value="">Chưa cập nhật</option>
              <option value="MALE">Nam</option>
              <option value="FEMALE">Nữ</option>
              <option value="OTHER">Khác</option>
            </select>
          </div>
          <div>
            <Label>Email</Label>
            <div className={`${locked} flex items-center justify-between`}>
              {profile.email ?? "Chưa cập nhật"}
              <Mail className="h-4 w-4 text-slate-400" />
            </div>
          </div>
        </div>
      </div>

      <div className="mt-4 overflow-hidden rounded-2xl border border-blue-100">
        <div className="bg-blue-50 px-4 py-2.5 text-xs font-extrabold text-[#0A5A84]">
          Địa chỉ liên hệ
        </div>
        <div className="p-4">
          <input
            aria-label="Địa chỉ liên hệ"
            className={isEditing ? input : locked}
            disabled={!isEditing}
            value={form.address}
            onChange={(e) => onChange("address", e.target.value)}
          />
        </div>
      </div>

      <div className="mt-4 border-t border-slate-100 pt-5">
        <p className="text-sm font-extrabold text-slate-900">Trạng thái hồ sơ</p>
        <div className="mt-3 grid gap-3 md:grid-cols-2">
          <div className="rounded-xl bg-emerald-50 px-4 py-3">
            <p className="text-xs font-bold text-emerald-700">Tài khoản đã xác minh</p>
            <p className="mt-1 text-[11px] text-emerald-700/80">
              Hồ sơ đang được bảo vệ và chỉ hiển thị cho tài khoản bệnh nhân.
            </p>
          </div>
          <div className="rounded-xl bg-blue-50 px-4 py-3">
            <p className="text-xs font-bold text-[#0A5A84]">Ngày tham gia</p>
            <p className="mt-1 text-sm font-extrabold text-slate-800">
              {formatProfileDate(profile.createdAt)}
            </p>
          </div>
        </div>
      </div>

    </section>
  );
}

/* ---------- 2. Tiền sử dị ứng ---------- */

function confirmationLabel(status: PatientMedicalRecord["status"]) {
  return status === "CONFIRMED" ? "Đã xác nhận" : "Chờ bác sĩ xác nhận";
}

function severityLabel(severity: PatientMedicalRecord["severity"]) {
  if (severity === "SEVERE") return "Nặng";
  if (severity === "MODERATE") return "Trung bình";
  if (severity === "MILD") return "Nhẹ";
  return null;
}

export function AllergySection({
  records,
  onCreated,
}: {
  records: PatientMedicalRecord[];
  onCreated: () => void;
}) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [name, setName] = useState("");
  const [severity, setSeverity] = useState<"MILD" | "MODERATE" | "SEVERE">("MILD");
  const [reaction, setReaction] = useState("");
  const [description, setDescription] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const allergies = records.filter((record) => record.recordType === "ALLERGY");

  const closeModal = () => {
    if (isSaving) return;
    setIsModalOpen(false);
    setError(null);
  };

  const submit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!name.trim() || isSaving) return;
    setIsSaving(true);
    setError(null);
    try {
      await createPatientAllergy({
        name: name.trim(),
        severity,
        reaction: reaction.trim() || undefined,
        description: description.trim() || undefined,
      });
      setName("");
      setSeverity("MILD");
      setReaction("");
      setDescription("");
      setIsModalOpen(false);
      onCreated();
    } catch (createError) {
      setError(
        createError instanceof Error
          ? createError.message
          : "Không thể thêm dị ứng lúc này.",
      );
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <section id="allergies" className={card}>
      <SectionHead
        icon={<AlertTriangle className="h-4 w-4" />}
        title="Tiền sử dị ứng"
        sub="Thông tin về các dị ứng đã ghi nhận của bệnh nhân"
        right={
          <button
            type="button"
            onClick={() => setIsModalOpen(true)}
            className="inline-flex shrink-0 items-center gap-1.5 rounded-lg border border-[#6EA8D8] bg-blue-50/40 px-3 py-2 text-[11px] font-extrabold text-[#0A5A84] transition hover:bg-blue-50"
          >
            <Plus className="h-3.5 w-3.5" />
            Khai báo mới
          </button>
        }
      />

      <div className="mt-6 grid gap-4 lg:grid-cols-[minmax(0,1.35fr)_minmax(260px,0.9fr)]">
        <div className="overflow-hidden rounded-xl border border-red-100 bg-white">
          <div className="flex items-center justify-between bg-red-50 px-4 py-3">
            <p className="flex items-center gap-2 text-xs font-extrabold text-red-600">
              <AlertTriangle className="h-4 w-4" />
              Có dị ứng đã ghi nhận
            </p>
            <span className="rounded-full bg-white px-2.5 py-1 text-[10px] font-extrabold text-red-600">
              {allergies.length} mục
            </span>
          </div>
          <div className="divide-y divide-slate-100 px-3">
            {allergies.length === 0 ? (
              <p className="px-2 py-5 text-xs text-slate-500">
                Chưa có thông tin dị ứng trong hồ sơ.
              </p>
            ) : (
              allergies.map((record) => (
                <div key={record.id} className="flex items-center gap-3 py-3">
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-red-50 text-red-600">
                    <AlertTriangle className="h-4 w-4" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-xs font-extrabold text-slate-800">
                      {record.name}
                    </p>
                    <p className="mt-0.5 text-[10px] text-slate-500">
                      Mức độ: {severityLabel(record.severity) ?? "Chưa cập nhật"}
                    </p>
                  </div>
                  <span className="rounded-full bg-amber-50 px-2 py-1 text-[10px] font-bold text-amber-700">
                    {confirmationLabel(record.status)}
                  </span>
                  <ChevronRight className="h-4 w-4 shrink-0 text-slate-400" />
                </div>
              ))
            )}
          </div>
        </div>

        <div className="overflow-hidden rounded-xl border border-blue-100 bg-white">
          <div className="flex items-center gap-2 bg-blue-50 px-4 py-3 text-xs font-extrabold text-[#0A5A84]">
            <Info className="h-4 w-4" />
            Lưu ý khi khám
          </div>
          <ul className="list-disc space-y-2.5 px-9 py-4 text-[11px] leading-relaxed text-slate-600">
            <li>Thông báo cho bác sĩ về các dị ứng đã ghi nhận.</li>
            <li>Tránh sử dụng các thuốc hoặc thực phẩm có nguy cơ gây dị ứng.</li>
            <li>Cập nhật thông tin nếu có thay đổi.</li>
          </ul>
        </div>
      </div>

      <p className="mt-4 text-[11px] text-slate-400">
        Bản ghi đang chờ xác nhận là thông tin tự khai báo, chưa được xem là
        chẩn đoán của bác sĩ.
      </p>

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 px-4 py-6" role="dialog" aria-modal="true" aria-labelledby="allergy-dialog-title">
          <form onSubmit={submit} className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h3 id="allergy-dialog-title" className="text-lg font-extrabold text-slate-900">Thêm dị ứng mới</h3>
                <p className="mt-1 text-xs text-slate-500">Thông tin sẽ được gửi để bác sĩ xác nhận.</p>
              </div>
              <button type="button" onClick={closeModal} className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-700" aria-label="Đóng"><X className="h-5 w-5" /></button>
            </div>
            <div className="mt-5 space-y-4">
              <div>
                <Label>Tên loại dị ứng</Label>
                <input className={input} value={name} onChange={(event) => setName(event.target.value)} placeholder="Ví dụ: Penicillin, đậu phộng" required maxLength={255} />
              </div>
              <div>
                <Label>Mức độ</Label>
                <select className={input} value={severity} onChange={(event) => setSeverity(event.target.value as typeof severity)}>
                  <option value="MILD">Nhẹ</option>
                  <option value="MODERATE">Trung bình</option>
                  <option value="SEVERE">Nặng</option>
                </select>
              </div>
              <div>
                <Label>Phản ứng gặp phải</Label>
                <input className={input} value={reaction} onChange={(event) => setReaction(event.target.value)} placeholder="Ví dụ: Nổi mề đay, khó thở" />
              </div>
              <div>
                <Label>Ghi chú thêm</Label>
                <textarea className={`${input} min-h-24 resize-y`} value={description} onChange={(event) => setDescription(event.target.value)} placeholder="Thông tin bổ sung nếu có" />
              </div>
            </div>
            {error && <p className="mt-4 text-xs font-bold text-red-600" role="alert">{error}</p>}
            <div className="mt-6 flex justify-end gap-3">
              <button type="button" onClick={closeModal} disabled={isSaving} className="rounded-xl bg-slate-100 px-5 py-3 text-xs font-bold text-slate-700 hover:bg-slate-200">Hủy</button>
              <button type="submit" disabled={!name.trim() || isSaving} className="rounded-xl bg-[#0A5A84] px-5 py-3 text-xs font-bold text-white hover:bg-[#08486B] disabled:cursor-not-allowed disabled:bg-slate-300">{isSaving ? "Đang lưu..." : "Lưu dị ứng"}</button>
            </div>
          </form>
        </div>
      )}
    </section>
  );
}

export function HistorySection({
  records,
}: {
  records: PatientMedicalRecord[];
}) {
  const history = records.filter(
    (record) => record.recordType === "MEDICAL_HISTORY",
  );

  return (
    <section id="history" className={card}>
      <SectionHead
        icon={<Activity className="h-4 w-4" />}
        title="Tiền sử bệnh"
        sub="Các bệnh sử được tải từ hồ sơ bệnh nhân trong hệ thống"
      />
      <div className="mt-6">
        <RecordGroup
          title="Bệnh sử đã ghi nhận"
          records={history}
          emptyText="Chưa có tiền sử bệnh trong hồ sơ."
        />
      </div>
      <p className="mt-3 text-[11px] text-slate-400">
        Bản ghi đang chờ xác nhận là thông tin tự khai báo, chưa được xem là
        chẩn đoán của bác sĩ.
      </p>
    </section>
  );
}

function RecordGroup({
  title,
  records,
  emptyText,
  isAllergy = false,
}: {
  title: string;
  records: PatientMedicalRecord[];
  emptyText: string;
  isAllergy?: boolean;
}) {
  return (
    <div
      className={`rounded-xl border p-4 ${
        isAllergy ? "border-red-200 bg-red-50" : "border-blue-100 bg-blue-50/60"
      }`}
    >
      <p
        className={`flex items-center gap-2 text-xs font-extrabold ${
          isAllergy ? "text-red-600" : "text-[#0A5A84]"
        }`}
      >
        {isAllergy ? (
          <AlertTriangle className="h-4 w-4" />
        ) : (
          <FileText className="h-4 w-4" />
        )}
        {title}
      </p>
      {records.length === 0 ? (
        <p className="mt-3 text-[11px] text-slate-600">{emptyText}</p>
      ) : (
        <ul className="mt-3 space-y-2">
          {records.map((record) => (
            <li
              key={record.id}
              className="rounded-lg border border-slate-200 bg-white px-3 py-2.5"
            >
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="text-[11px] font-bold text-slate-800">
                  {record.name}
                  {severityLabel(record.severity) && (
                    <span className="ml-2 font-semibold text-slate-500">
                      Mức độ: {severityLabel(record.severity)}
                    </span>
                  )}
                </p>
                <span className="text-[10px] font-semibold text-[#0A5A84]">
                  {confirmationLabel(record.status)}
                </span>
              </div>
              {(record.reaction || record.description) && (
                <p className="mt-1 text-[11px] leading-relaxed text-slate-600">
                  {record.reaction ?? record.description}
                </p>
              )}
              {record.reaction && record.description && (
                <p className="mt-1 text-[11px] leading-relaxed text-slate-600">
                  {record.description}
                </p>
              )}
              <p className="mt-1 text-[10px] text-slate-400">
                Cập nhật: {formatProfileDate(record.updatedAt)}
              </p>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

/* ---------- 3. Liên hệ khẩn cấp & người thân ---------- */

export function ContactsSection({ profile }: { profile: PatientProfile }) {
  return (
    <section id="contacts" className={card}>
      <SectionHead
        icon={<Users className="h-4 w-4" />}
        title="3. Người Liên Hệ Khẩn Cấp"
        sub="Thông tin liên hệ được lưu trong hồ sơ bệnh nhân"
      />

      <div className="mt-5 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-blue-100 bg-blue-50/70 p-4">
        <div className="flex items-center gap-3">
          <span className="flex h-11 w-11 items-center justify-center rounded-lg bg-white text-[#0A5A84] ring-1 ring-blue-100">
            <IdCard className="h-5 w-5" />
          </span>
          <div className="leading-tight">
            <p className="text-sm font-extrabold text-slate-900">
              {profile.emergencyContactName ?? "Chưa cập nhật"}
            </p>
            <p className="mt-1.5 flex items-center gap-1 text-[11px] font-bold text-slate-600">
              <PhoneCall className="h-3 w-3" />
              {profile.emergencyContactPhone ?? "Chưa cập nhật"}
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ---------- 4. Tài khoản & bảo mật ---------- */

export function SecuritySection() {
  const [currentPassword, setCurrentPassword] = useState("");
  const [password, setPassword] = useState("");
  const [confirmation, setConfirmation] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const isSamePassword = Boolean(currentPassword && password && currentPassword === password);
  const isValid =
    password.length >= 8 &&
    /[a-z]/.test(password) &&
    /[A-Z]/.test(password) &&
    /\d/.test(password) &&
    /[^a-zA-Z0-9]/.test(password) &&
    password === confirmation &&
    !isSamePassword;

  const submit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!isValid || !currentPassword || isSaving) return;
    setIsSaving(true);
    setMessage(null);
    setError(null);
    try {
      await changePassword(currentPassword, password);
      setMessage("Đổi mật khẩu thành công. Vui lòng đăng nhập lại.");
      setCurrentPassword("");
      setPassword("");
      setConfirmation("");
    } catch (changeError) {
      setError(
        changeError instanceof Error
          ? changeError.message
          : "Không thể đổi mật khẩu lúc này.",
      );
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <section id="security" className={card}>
      <SectionHead
        icon={<ShieldCheck className="h-4 w-4" />}
        title="Bảo mật tài khoản"
        sub="Cập nhật mật khẩu đăng nhập của bạn"
        right={<Lock className="h-5 w-5 text-[#0A5A84]" />}
      />

      <form className="mt-6 max-w-2xl space-y-4" onSubmit={submit}>
        <div>
          <Label>Mật khẩu hiện tại</Label>
          <input className={input} type="password" autoComplete="current-password" value={currentPassword} onChange={(event) => { setCurrentPassword(event.target.value); setError(null); }} required />
        </div>
        <div>
          <Label>Mật khẩu mới</Label>
          <input className={input} type="password" autoComplete="new-password" value={password} onChange={(event) => { setPassword(event.target.value); setError(null); }} required />
          <p className="mt-1.5 text-[11px] text-slate-500">Tối thiểu 8 ký tự, gồm chữ hoa, chữ thường, số và ký tự đặc biệt.</p>
          {isSamePassword && <p className="mt-1.5 text-xs font-bold text-red-600" role="alert">Mật khẩu mới phải khác mật khẩu hiện tại. Vui lòng đặt mật khẩu khác.</p>}
        </div>
        <div>
          <Label>Nhập lại mật khẩu mới</Label>
          <input className={input} type="password" autoComplete="new-password" value={confirmation} onChange={(event) => { setConfirmation(event.target.value); setError(null); }} required />
        </div>
        {error && <p className="text-xs font-bold text-red-600" role="alert">{error}</p>}
        {message && <p className="text-xs font-bold text-emerald-700" role="status">{message}</p>}
        <button type="submit" disabled={!isValid || !currentPassword || isSaving} className="rounded-xl bg-[#0A5A84] px-6 py-3 text-xs font-bold text-white transition hover:bg-[#08486B] disabled:cursor-not-allowed disabled:bg-slate-300">
          {isSaving ? "Đang cập nhật..." : "Đổi mật khẩu"}
        </button>
      </form>
    </section>
  );
}
