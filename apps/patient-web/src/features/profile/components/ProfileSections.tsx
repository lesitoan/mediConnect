"use client";

import {
  Activity,
  AlertTriangle,
  FileText,
  IdCard,
  Lock,
  Mail,
  PhoneCall,
  ShieldCheck,
  Users,
} from "@/components/layout/icons";
import { formatProfileDate, type IdentityForm } from "../data";
import type {
  PatientMedicalRecord,
  PatientProfile,
} from "../services/patientProfileService";

const card =
  "scroll-mt-32 rounded-2xl bg-white p-6 shadow-[0_6px_24px_rgba(10,90,132,0.08)]";
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
  onChange,
}: {
  profile: PatientProfile;
  form: IdentityForm;
  onChange: <K extends keyof IdentityForm>(k: K, v: IdentityForm[K]) => void;
}) {
  return (
    <section id="identity" className={card}>
      <SectionHead
        icon={<IdCard className="h-4 w-4" />}
        title="1. Thông Tin Định Danh & Liên Hệ"
        sub="Thông tin cá nhân được lưu trong hồ sơ MediConnect"
      />

      <div className="mt-5 space-y-4">
        <div>
          <Label>Họ tên</Label>
          <div className={`${locked} flex items-center justify-between`}>
            {profile.fullName}
            <Lock className="h-4 w-4 text-slate-400" />
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <Label>Số CCCD / Định danh cá nhân</Label>
            <div className={`${locked} flex items-center justify-between`}>
              {profile.nationalId ?? "Chưa cập nhật"}
              <Lock className="h-4 w-4 text-slate-400" />
            </div>
          </div>
          <div>
            <Label>Ngày sinh</Label>
            <input
              type="date"
              className={input}
              value={form.dateOfBirth}
              max={new Date().toISOString().split("T")[0]}
              onChange={(e) => onChange("dateOfBirth", e.target.value)}
            />
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <Label>Giới tính</Label>
            <select
              className={input}
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
            <Label>Số điện thoại di động</Label>
            <div className={`${locked} flex items-center justify-between`}>
              {profile.phone ?? "Chưa cập nhật"}
              <Lock className="h-4 w-4 text-slate-400" />
            </div>
          </div>
        </div>

        <div>
          <Label>Email cá nhân (chỉ đọc)</Label>
          <div className={`${locked} flex items-center justify-between`}>
            {profile.email ?? "Chưa cập nhật"}
            <Mail className="h-4 w-4 text-slate-400" />
          </div>
        </div>

        <div>
          <Label>Địa chỉ</Label>
          <input
            className={input}
            value={form.address}
            onChange={(e) => onChange("address", e.target.value)}
          />
        </div>
      </div>
    </section>
  );
}

/* ---------- 2. Chỉ số & tiền sử ---------- */

function confirmationLabel(status: PatientMedicalRecord["status"]) {
  return status === "CONFIRMED" ? "Đã xác nhận" : "Chờ bác sĩ xác nhận";
}

function severityLabel(severity: PatientMedicalRecord["severity"]) {
  if (severity === "SEVERE") return "Nặng";
  if (severity === "MODERATE") return "Trung bình";
  if (severity === "MILD") return "Nhẹ";
  return null;
}

export function MedicalSection({
  records,
}: {
  records: PatientMedicalRecord[];
}) {
  const allergies = records.filter((record) => record.recordType === "ALLERGY");
  const history = records.filter(
    (record) => record.recordType === "MEDICAL_HISTORY",
  );

  return (
    <section id="medical" className={card}>
      <SectionHead
        icon={<Activity className="h-4 w-4" />}
        title="2. Tiền Sử Bệnh & Dị Ứng"
        sub="Tiền sử và dị ứng được tải từ hồ sơ bệnh nhân trong hệ thống"
      />

      <div className="mt-4 grid gap-4 md:grid-cols-2">
        <RecordGroup
          title="Dị ứng"
          records={allergies}
          isAllergy
          emptyText="Chưa có thông tin dị ứng trong hồ sơ."
        />
        <RecordGroup
          title="Tiền sử bệnh"
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
  return (
    <section id="security" className={card}>
      <SectionHead
        icon={<ShieldCheck className="h-4 w-4" />}
        title="4. Quyền Riêng Tư Hồ Sơ"
        sub="Quyền truy cập được kiểm tra bởi hệ thống"
        right={<Lock className="h-5 w-5 text-[#0A5A84]" />}
      />

      <div className="mt-5 rounded-xl border border-blue-100 bg-blue-50/60 p-4">
        <p className="text-sm font-bold text-[#0A5A84]">
          Hồ sơ được tải theo tài khoản đang đăng nhập.
        </p>
        <p className="mt-2 text-[11px] leading-relaxed text-slate-600">
          API chỉ trả thông tin hồ sơ của bệnh nhân hiện tại và kiểm tra quyền
          truy cập ở backend.
        </p>
      </div>
    </section>
  );
}
