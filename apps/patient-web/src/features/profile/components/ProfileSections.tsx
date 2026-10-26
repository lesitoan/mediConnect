"use client";

import Link from "next/link";
import { useState } from "react";
import {
  Activity,
  AlertTriangle,
  Check,
  FileText,
  IdCard,
  Link2,
  Lock,
  Mail,
  MapPin,
  Plus,
  PhoneCall,
  RefreshCw,
  ShieldCheck,
  Smartphone,
  Users,
  Pill,
} from "@/components/layout/icons";
import { bmiLabel, bmiOf, PROFILE, type IdentityForm } from "../data";

const card = "scroll-mt-32 rounded-2xl bg-white p-6 shadow-[0_6px_24px_rgba(10,90,132,0.08)]";
const input =
  "w-full rounded-xl border border-slate-200 bg-blue-50/50 px-4 py-3 text-sm font-semibold text-slate-900 outline-none transition focus:border-[#2B6CB0] focus:bg-white focus:ring-2 focus:ring-[#2B6CB0]/20";
const locked = "w-full rounded-xl border border-slate-200 bg-slate-100 px-4 py-3 text-sm font-bold text-slate-700";

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

const pill = "inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[11px] font-bold transition";

function Label({ children, right }: { children: React.ReactNode; right?: React.ReactNode }) {
  return (
    <div className="mb-1.5 flex items-center justify-between gap-2 text-xs">
      <span className="font-bold text-slate-700">{children}</span>
      {right}
    </div>
  );
}

/* ---------- 1. Định danh & liên hệ ---------- */

export function IdentitySection({
  form,
  onChange,
}: {
  form: IdentityForm;
  onChange: <K extends keyof IdentityForm>(k: K, v: IdentityForm[K]) => void;
}) {
  return (
    <section id="identity" className={card}>
      <SectionHead
        icon={<IdCard className="h-4 w-4" />}
        title="1. Thông Tin Định Danh & Liên Hệ"
        sub="Dữ liệu liên thông Cơ sở Dữ liệu Quốc gia về Dân cư (Đề án 06)"
        right={
          <span className={`${pill} border border-slate-200 text-[#0A5A84]`}>
            <RefreshCw className="h-3 w-3" />
            Đồng bộ
          </span>
        }
      />

      <div className="mt-5 space-y-4">
        <div>
          <Label
            right={
              <span className="inline-flex items-center gap-1 text-[11px] font-bold text-[#2B6CB0]">
                <Check className="h-3 w-3" />
                Đã xác thực CCCD
              </span>
            }
          >
            Họ tên (có dấu theo CCCD)
          </Label>
          <div className={`${locked} flex items-center justify-between`}>
            {PROFILE.fullName}
            <Lock className="h-4 w-4 text-slate-400" />
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <Label>Số CCCD / Định danh cá nhân</Label>
            <div className={`${locked} flex items-center justify-between`}>
              {PROFILE.idNumber}
              <Check className="h-4 w-4 text-[#2B6CB0]" />
            </div>
          </div>
          <div>
            <Label>Ngày sinh</Label>
            <input
              type="date"
              className={input}
              value={form.dob}
              max={new Date().toISOString().split("T")[0]}
              onChange={(e) => onChange("dob", e.target.value)}
            />
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-[1fr_1fr_1.6fr]">
          <div>
            <Label>Giới tính</Label>
            <select className={input} value={form.gender} onChange={(e) => onChange("gender", e.target.value)}>
              <option>Nam</option>
              <option>Nữ</option>
              <option>Khác</option>
            </select>
          </div>
          <div>
            <Label>Dân tộc</Label>
            <input className={input} value={form.ethnicity} onChange={(e) => onChange("ethnicity", e.target.value)} />
          </div>
          <div>
            <Label
              right={
                <Link href="/ho-so-suc-khoe#security" className="text-[11px] font-bold text-[#2B6CB0]">
                  Đã kích hoạt OTP SMS
                </Link>
              }
            >
              Số điện thoại di động
            </Label>
            <div className={`${locked} flex items-center justify-between`}>
              {PROFILE.phone}
              {/* TODO: đổi SĐT phải xác thực OTP số mới rồi mới lưu (SRS UC01) */}
              <button type="button" className="text-[11px] font-bold text-[#2B6CB0] hover:underline">
                Thay đổi
              </button>
            </div>
          </div>
        </div>

        <div>
          <Label>Email cá nhân (Nhận kết quả xét nghiệm, đơn thuốc &amp; hóa đơn điện tử)</Label>
          <div className="relative">
            <input
              type="email"
              className={`${input} pr-11`}
              value={form.email}
              onChange={(e) => onChange("email", e.target.value)}
            />
            <Mail className="pointer-events-none absolute right-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          </div>
        </div>

        <div>
          <Label>Địa chỉ thường trú (theo hộ khẩu/CCCD)</Label>
          <input className={input} value={form.address} onChange={(e) => onChange("address", e.target.value)} />
        </div>

        <label className="flex cursor-pointer items-center gap-2.5 rounded-xl bg-blue-50 px-4 py-3 text-xs text-slate-700">
          <input
            type="checkbox"
            checked={form.sameAddress}
            onChange={(e) => onChange("sameAddress", e.target.checked)}
            className="h-4 w-4 accent-[#0A5A84]"
          />
          Địa chỉ cư trú &amp; liên hệ hiện tại trùng khớp với địa chỉ thường trú
        </label>
      </div>
    </section>
  );
}

/* ---------- 2. Chỉ số & tiền sử ---------- */

export function MedicalSection() {
  const m = PROFILE.medical;
  const bmi = bmiOf(m.weight, m.height);
  const stats = [
    { label: "Nhóm máu", value: m.blood, unit: m.rh, note: "Có kháng thể tự nhiên" },
    { label: "Chiều cao", value: String(m.height), unit: "cm", note: `Đo ngày: ${m.heightDate}` },
    { label: "Cân nặng", value: String(m.weight), unit: "kg", note: "Lý tưởng theo thể trạng" },
    { label: "Chỉ số BMI", value: String(bmi), unit: bmiLabel(bmi), note: "Ngưỡng chuẩn (18.5 - 22.9)" },
  ];

  return (
    <section id="medical" className={card}>
      <SectionHead
        icon={<Activity className="h-4 w-4" />}
        title="2. Thông Tin Y Tế Cơ Bản & Tiền Sử Bệnh"
        sub="Dữ liệu tối thiểu từ hồ sơ bệnh án (EMR) hỗ trợ tra cứu lâm sàng"
        right={
          <button
            type="button"
            // TODO: bệnh nhân tự khai báo -> trạng thái "Chờ xác nhận" cho tới khi bác sĩ xác nhận khi khám (SRS)
            className={`${pill} bg-blue-100 text-[#0A5A84] hover:bg-blue-200`}
          >
            Cập nhật chỉ số
          </button>
        }
      />

      <div className="mt-5 grid grid-cols-2 gap-3 lg:grid-cols-4">
        {stats.map((s) => (
          <div key={s.label} className="rounded-xl border border-blue-100 bg-blue-50/70 p-4">
            <p className="text-[10px] font-bold uppercase text-slate-500">{s.label}</p>
            <p className="mt-1.5 text-2xl font-extrabold text-[#0A5A84]">
              {s.value} <span className="text-xs font-bold text-[#2B6CB0]">{s.unit}</span>
            </p>
            <p className="mt-1 text-[10px] text-slate-500">{s.note}</p>
          </div>
        ))}
      </div>

      <div className="mt-4 rounded-xl border border-red-200 bg-red-50 p-4">
        <p className="flex items-center gap-2 text-xs font-extrabold uppercase text-red-600">
          <AlertTriangle className="h-4 w-4" />
          Cảnh báo dị ứng thuốc &amp; chất kích ứng
        </p>
        <ul className="mt-3 flex flex-wrap gap-2">
          {m.allergies.map((a, i) => (
            <li
              key={a}
              className={`rounded-lg px-3 py-2 text-[11px] font-bold ${
                i === 0 ? "border border-red-200 bg-white text-red-600" : "border border-slate-200 bg-white text-slate-600"
              }`}
            >
              {a}
            </li>
          ))}
        </ul>
      </div>

      <div className="mt-4 grid gap-4 md:grid-cols-2">
        <div className="rounded-xl border border-blue-100 bg-blue-50/60 p-4">
          <p className="flex items-center gap-2 text-xs font-extrabold text-[#0A5A84]">
            <FileText className="h-4 w-4" />
            Tiền sử bệnh lý mạn tính
          </p>
          <ul className="mt-2.5 space-y-2 text-[11px] leading-relaxed text-slate-600">
            {m.chronic.map((c) => (
              <li key={c}>{c}</li>
            ))}
          </ul>
        </div>
        <div className="rounded-xl border border-blue-100 bg-blue-50/60 p-4">
          <p className="flex items-center gap-2 text-xs font-extrabold text-[#0A5A84]">
            <Pill className="h-4 w-4" />
            Thuốc mãn tính đang sử dụng
          </p>
          <ul className="mt-2.5 space-y-2 text-[11px] leading-relaxed text-slate-600">
            {m.medications.map((c) => (
              <li key={c}>{c}</li>
            ))}
          </ul>
        </div>
      </div>

      <p className="mt-3 text-[11px] text-slate-400">
        Thông tin đã được bác sĩ xác nhận khi khám không thể tự chỉnh sửa. Nội dung bạn tự khai báo sẽ ở
        trạng thái &ldquo;Chờ xác nhận&rdquo; cho đến buổi khám kế tiếp.
      </p>
    </section>
  );
}

/* ---------- 3. Liên hệ khẩn cấp & người thân ---------- */

export function ContactsSection() {
  const e = PROFILE.emergency;
  return (
    <section id="contacts" className={card}>
      <SectionHead
        icon={<Users className="h-4 w-4" />}
        title="3. Người Liên Hệ Khẩn Cấp & Hồ Sơ Người Thân"
        sub="Liên lạc khi có tình huống y khoa đột xuất & Quản trị hồ sơ khỏe gia đình"
        right={
          <button
            type="button"
            // TODO: thêm hồ sơ người thân (ngoài phạm vi SRS hiện tại)
            className={`${pill} bg-blue-100 text-[#0A5A84] hover:bg-blue-200`}
          >
            <Plus className="h-3 w-3" />
            Thêm người thân
          </button>
        }
      />

      <div className="mt-5 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-blue-100 bg-blue-50/70 p-4">
        <div className="flex items-center gap-3">
          <span className="flex h-11 w-11 items-center justify-center rounded-lg bg-white text-[#0A5A84] ring-1 ring-blue-100">
            <IdCard className="h-5 w-5" />
          </span>
          <div className="leading-tight">
            <p className="flex flex-wrap items-center gap-2 text-sm font-extrabold text-slate-900">
              {e.name}
              <span className="rounded-full bg-blue-100 px-2 py-0.5 text-[10px] font-bold text-[#0A5A84]">
                {e.relation}
              </span>
            </p>
            <p className="mt-1.5 flex flex-wrap items-center gap-3 text-[11px] text-slate-500">
              <span className="inline-flex items-center gap-1 font-bold text-slate-800">
                <PhoneCall className="h-3 w-3" />
                {e.phone}
              </span>
              <span className="inline-flex items-center gap-1">
                <MapPin className="h-3 w-3" />
                {e.note}
              </span>
            </p>
          </div>
        </div>
        <button type="button" className={`${pill} border border-slate-200 bg-white text-[#0A5A84] hover:bg-blue-50`}>
          Chỉnh sửa liên hệ
        </button>
      </div>

      <p className="mt-5 text-[10px] font-bold uppercase text-slate-500">
        Hồ sơ người thân đã liên kết ({String(PROFILE.relatives.length).padStart(2, "0")})
      </p>
      <div className="mt-3 grid gap-3 md:grid-cols-2">
        {PROFILE.relatives.map((r) => (
          <div
            key={r.pid}
            className="flex items-center justify-between gap-3 rounded-xl border border-blue-100 bg-blue-50/70 p-3"
          >
            <div className="flex items-center gap-3">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white text-xs font-extrabold text-[#0A5A84] ring-1 ring-blue-100">
                {r.initials}
              </span>
              <span className="leading-tight">
                <span className="block text-xs font-extrabold text-slate-900">{r.name}</span>
                <span className="mt-0.5 block text-[10px] text-slate-500">{r.desc}</span>
              </span>
            </div>
            <Link
              href={`/ho-so-suc-khoe?patient=${r.pid}`}
              className={`${pill} border border-slate-200 bg-white text-[#0A5A84] hover:bg-blue-50`}
            >
              Xem hồ sơ
            </Link>
          </div>
        ))}
      </div>
    </section>
  );
}

/* ---------- 4. Tài khoản & bảo mật ---------- */

function SecRow({
  icon,
  title,
  desc,
  action,
}: {
  icon: React.ReactNode;
  title: string;
  desc: string;
  action: React.ReactNode;
}) {
  return (
    <li className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-blue-100 bg-blue-50/70 px-4 py-3">
      <div className="flex items-center gap-3">
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-white text-[#0A5A84] ring-1 ring-blue-100">
          {icon}
        </span>
        <span className="leading-tight">
          <span className="block text-xs font-extrabold text-slate-900">{title}</span>
          <span className="mt-0.5 block text-[11px] text-slate-500">{desc}</span>
        </span>
      </div>
      {action}
    </li>
  );
}

export function SecuritySection() {
  const [google, setGoogle] = useState(true);

  return (
    <section id="security" className={card}>
      <SectionHead
        icon={<ShieldCheck className="h-4 w-4" />}
        title="4. Tài Khoản, Bảo Mật & Phân Quyền EMR"
        sub="Quản lý xác thực sinh trắc học, liên kết cổng quốc gia và quyền truy cập y tế"
        right={<Lock className="h-5 w-5 text-[#0A5A84]" />}
      />

      <ul className="mt-5 space-y-3">
        <SecRow
          icon={<ShieldCheck className="h-4 w-4 text-red-600" />}
          title="Đồng bộ Định danh Y tế VNeID (Bộ Công An)"
          desc="Cho phép tích hợp Sổ sức khỏe điện tử trên ứng dụng VNeID cấp độ 2"
          action={<span className={`${pill} bg-sky-100 text-[#0A5A84]`}>Đang kích hoạt</span>}
        />
        <SecRow
          icon={<Link2 className="h-4 w-4" />}
          title="Tài khoản Google liên kết"
          desc={google ? "an.nguyen94@gmail.com" : "Chưa liên kết tài khoản Google"}
          action={
            <button
              type="button"
              // TODO: gọi API liên kết/hủy liên kết tài khoản Google
              onClick={() => setGoogle((v) => !v)}
              className={`${pill} border border-slate-200 bg-white text-[#0A5A84] hover:bg-blue-50`}
            >
              {google ? "Hủy liên kết" : "Liên kết"}
            </button>
          }
        />
        <SecRow
          icon={<Smartphone className="h-4 w-4" />}
          title="Xác thực 2 yếu tố (2FA)"
          desc="Bảo vệ đăng nhập qua mã SMS & Ứng dụng Google Authenticator"
          action={<span className={`${pill} bg-sky-100 text-[#0A5A84]`}>Đang bật</span>}
        />
        <SecRow
          icon={<Lock className="h-4 w-4" />}
          title="Mật khẩu tài khoản"
          desc="Đã đổi cách đây 2 tháng (Chu kỳ khuyến nghị 6 tháng/lần)"
          action={
            <button
              type="button"
              // TODO: đổi mật khẩu -> hủy các phiên đăng nhập khác (SRS)
              className={`${pill} border border-slate-200 bg-white text-[#0A5A84] hover:bg-blue-50`}
            >
              Đổi mật khẩu
            </button>
          }
        />
      </ul>

      <div className="mt-4 rounded-xl border border-blue-100 bg-blue-50/60 p-4">
        <p className="flex items-center justify-between text-xs font-extrabold text-[#0A5A84]">
          Chính sách Quyền Riêng Tư &amp; Chia Sẻ Dữ Liệu Bệnh Án
          <ShieldCheck className="h-4 w-4" />
        </p>
        <p className="mt-2 text-[11px] leading-relaxed text-slate-600">
          Chỉ cho phép Bác sĩ điều trị phụ trách xem toàn bộ lịch sử xét nghiệm và chẩn đoán hình ảnh
          trong thời gian khám có hiệu lực. Dữ liệu được bảo vệ chuẩn HIPAA và ISO 27001.
        </p>
      </div>
    </section>
  );
}