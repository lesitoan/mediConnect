"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import {
  ArrowRight,
  BadgeCheck,
  CalendarCheck,
  Check,
  Eye,
  EyeOff,
  Headset,
  HelpCircle,
  IdCard,
  Lock,
  Mail,
  PhoneCall,
  ShieldCheck,
  User,
} from "@/components/layout/icons";
import OtpVerifyForm from "./OtpVerifyForm";

/* ---------- Style dùng chung ---------- */

const wrap =
  "flex items-center gap-2.5 rounded-xl border border-slate-200 bg-slate-50 px-3.5 transition focus-within:border-[#2B6CB0] focus-within:bg-white focus-within:ring-2 focus-within:ring-[#2B6CB0]/20";
const base =
  "w-full bg-transparent py-3 text-sm text-slate-900 outline-none placeholder:text-slate-400";

/* ---------- Thành phần nhỏ ---------- */

function Field({
  label,
  required,
  hint,
  error,
  children,
}: {
  label: string;
  required?: boolean;
  hint?: React.ReactNode;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <div className="mb-1.5 flex items-center justify-between gap-2 text-xs">
        <span className="font-bold text-slate-700">
          {label}
          {required && <span className="text-red-500"> *</span>}
        </span>
        {hint && <span className="text-[11px] text-slate-400">{hint}</span>}
      </div>
      {children}
      {error && <p className="mt-1 text-[11px] text-red-500">{error}</p>}
    </div>
  );
}

function Stepper({ step }: { step: 1 | 2 }) {
  const items = [
    { n: 1, title: "Tài khoản & Định danh" },
    { n: 2, title: "Xác thực OTP" },
  ];
  return (
    <ol className="flex items-center rounded-xl bg-blue-50/70 px-4 py-3">
      {items.map((it, i) => {
        const active = step === it.n;
        const done = step > it.n;
        return (
          <li key={it.n} className="flex flex-1 items-center last:flex-none">
            <div className="flex items-center gap-2.5">
              <span
                className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-bold ${
                  active || done
                    ? "bg-[#174A8F] text-white"
                    : "bg-slate-200 text-slate-500"
                }`}
              >
                {done ? <Check className="h-3.5 w-3.5" /> : it.n}
              </span>
              <span className="leading-tight">
                <span
                  className={`block text-[10px] font-bold ${
                    active || done ? "text-[#174A8F]" : "text-slate-400"
                  }`}
                >
                  Bước {it.n}
                </span>
                <span
                  className={`block text-[11px] ${
                    active || done ? "text-slate-700" : "text-slate-400"
                  }`}
                >
                  {it.title}
                </span>
              </span>
            </div>
            {i < items.length - 1 && (
              <span
                className={`mx-3 h-0.5 flex-1 rounded ${
                  step > it.n ? "bg-[#174A8F]" : "bg-slate-200"
                }`}
              />
            )}
          </li>
        );
      })}
    </ol>
  );
}

/** Đánh giá độ mạnh: 0-3 */
function passwordStrength(pw: string) {
  if (!pw) return 0;
  let score = 0;
  if (pw.length >= 8) score++;
  if (/[A-Z]/.test(pw) && /[a-z]/.test(pw)) score++;
  if (/\d/.test(pw) && /[^A-Za-z0-9]/.test(pw)) score++;
  return score;
}

const STRENGTH_LABEL = ["", "Yếu", "Trung bình", "Mạnh"];
const STRENGTH_COLOR = ["bg-slate-200", "bg-red-400", "bg-amber-400", "bg-emerald-500"];

/* ---------- Form chính ---------- */

export default function RegisterForm() {
  const [step, setStep] = useState<1 | 2>(1);
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [idNumber, setIdNumber] = useState("");
  const [dob, setDob] = useState("");
  const [gender, setGender] = useState("Nam");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [hasVisited, setHasVisited] = useState(false);
  const [pid, setPid] = useState("");
  const [agree, setAgree] = useState(false);
  const [touched, setTouched] = useState<Record<string, boolean>>({});

  const today = new Date().toISOString().split("T")[0];
  const strength = useMemo(() => passwordStrength(password), [password]);

  const errors = {
    fullName: fullName.trim().length < 2 ? "Vui lòng nhập họ và tên." : "",
    phone: /^0\d{9}$/.test(phone) ? "" : "Số điện thoại gồm 10 chữ số, bắt đầu bằng 0.",
    idNumber: /^\d{12}$/.test(idNumber) ? "" : "Số CCCD gồm đúng 12 chữ số.",
    dob: !dob ? "Vui lòng chọn ngày sinh." : dob > today ? "Ngày sinh không hợp lệ." : "",
    email:
      email.trim() === "" || /^\S+@\S+\.\S+$/.test(email.trim())
        ? ""
        : "Địa chỉ email chưa đúng định dạng.",
    password: password.length >= 8 ? "" : "Mật khẩu tối thiểu 8 ký tự.",
    confirm: confirm === password && confirm !== "" ? "" : "Mật khẩu xác nhận không khớp.",
    pid: !hasVisited || pid.trim() !== "" ? "" : "Vui lòng nhập mã bệnh nhân (PID).",
  };
  const valid = Object.values(errors).every((e) => e === "") && agree;

  const show = (key: keyof typeof errors) => (touched[key] ? errors[key] : "");
  const blur = (key: string) => setTouched((t) => ({ ...t, [key]: true }));

  const handleSubmit = async (e: React.SyntheticEvent) => {
    e.preventDefault();
    setTouched({
      fullName: true,
      phone: true,
      idNumber: true,
      dob: true,
      email: true,
      password: true,
      confirm: true,
      pid: true,
    });
    if (!valid || loading) return;
    setLoading(true);
    try {
      // TODO: gọi API đăng ký của apps/api (module authentication) -> tạo tài khoản
      // trạng thái chờ xác thực và gửi OTP tới số điện thoại/email.
      await new Promise((r) => setTimeout(r, 600));
      setStep(2);
    } finally {
      setLoading(false);
    }
  };

  /* ----- Màn hình thành công ----- */
  if (success) {
    return (
      <div className="py-16 text-center">
        <span className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100 text-emerald-600">
          <CalendarCheck className="h-8 w-8" />
        </span>
        <h2 className="mt-5 text-2xl font-extrabold text-slate-900">Đăng ký thành công</h2>
        <p className="mx-auto mt-3 max-w-md text-sm text-slate-600">
          Tài khoản của bạn đã được kích hoạt. Vui lòng đăng nhập để bắt đầu sử dụng.
        </p>
        <Link
          href="/login"
          className="mt-6 inline-flex items-center gap-2 rounded-xl bg-[#174A8F] px-8 py-3 text-sm font-bold uppercase text-white transition hover:bg-[#0E3A75]"
        >
          Đăng nhập ngay
          <ArrowRight className="h-4 w-4" />
        </Link>
      </div>
    );
  }

  return (
    <div>
      <span className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-wide text-[#174A8F]">
        <span className="h-2 w-2 rounded-full bg-[#2B6CB0]" />
        Cổng bệnh nhân trực tuyến
      </span>
      <h1 className="mt-2 text-3xl font-extrabold text-[#174A8F] md:text-4xl">
        Đăng Ký Tài Khoản MediConnect
      </h1>
      <p className="mt-2 text-xs text-slate-500">
        Kích hoạt hồ sơ bệnh án điện tử và kết nối trực tiếp với hệ thống y tế chỉ trong 1 phút.
      </p>

      <div className="mt-6">
        <Stepper step={step} />
      </div>

      {/* ===================== BƯỚC 1 ===================== */}
      {step === 1 && (
        <form onSubmit={handleSubmit} noValidate className="mt-6 space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <Field
              label="Họ và tên bệnh nhân"
              required
              hint="In hoa có dấu"
              error={show("fullName")}
            >
              <div className={wrap}>
                <User className="h-4 w-4 shrink-0 text-slate-400" />
                <input
                  className={`${base} uppercase placeholder:normal-case`}
                  placeholder="NGUYỄN VĂN AN"
                  autoComplete="name"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value.toUpperCase())}
                  onBlur={() => blur("fullName")}
                />
              </div>
            </Field>

            <Field
              label="Số điện thoại nhận OTP"
              required
              hint={<span className="font-bold text-[#2B6CB0]">SMS miễn phí</span>}
              error={show("phone")}
            >
              <div className={wrap}>
                <PhoneCall className="h-4 w-4 shrink-0 text-slate-400" />
                <input
                  type="tel"
                  inputMode="numeric"
                  maxLength={10}
                  className={base}
                  placeholder="0912345678"
                  autoComplete="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value.replace(/\D/g, ""))}
                  onBlur={() => blur("phone")}
                />
              </div>
            </Field>
          </div>

          <div className="grid gap-4 md:grid-cols-[1.4fr_1fr_0.8fr]">
            <Field
              label="Số CCCD / Mã định danh"
              required
              hint={
                <Link
                  href="/huong-dan"
                  className="inline-flex items-center gap-1 font-bold text-[#2B6CB0] hover:underline"
                >
                  <HelpCircle className="h-3 w-3" />
                  Tra cứu mã
                </Link>
              }
              error={show("idNumber")}
            >
              <div className={wrap}>
                <IdCard className="h-4 w-4 shrink-0 text-slate-400" />
                <input
                  inputMode="numeric"
                  maxLength={12}
                  className={base}
                  placeholder="12 số trên CCCD"
                  value={idNumber}
                  onChange={(e) => setIdNumber(e.target.value.replace(/\D/g, ""))}
                  onBlur={() => blur("idNumber")}
                />
              </div>
            </Field>

            <Field label="Ngày sinh" required error={show("dob")}>
              <div className={wrap}>
                <input
                  type="date"
                  max={today}
                  className={base}
                  value={dob}
                  onChange={(e) => setDob(e.target.value)}
                  onBlur={() => blur("dob")}
                />
              </div>
            </Field>

            <Field label="Giới tính" required>
              <div className={wrap}>
                <select
                  className={base}
                  value={gender}
                  onChange={(e) => setGender(e.target.value)}
                >
                  <option>Nam</option>
                  <option>Nữ</option>
                  <option>Khác</option>
                </select>
              </div>
            </Field>
          </div>

          <Field
            label="Email cá nhân"
            hint="Nhận kết quả xét nghiệm, lịch hẹn & hóa đơn VAT"
            error={show("email")}
          >
            <div className={wrap}>
              <Mail className="h-4 w-4 shrink-0 text-slate-400" />
              <input
                type="email"
                className={base}
                placeholder="example@gmail.com"
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                onBlur={() => blur("email")}
              />
            </div>
          </Field>

          <div className="grid gap-4 md:grid-cols-2">
            <Field
              label="Tạo mật khẩu"
              required
              hint="Ít nhất 8 ký tự"
              error={show("password")}
            >
              <div className={wrap}>
                <Lock className="h-4 w-4 shrink-0 text-slate-400" />
                <input
                  type={showPw ? "text" : "password"}
                  className={base}
                  placeholder="Tối thiểu 8 ký tự, có số"
                  autoComplete="new-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  onBlur={() => blur("password")}
                />
                <button
                  type="button"
                  aria-label={showPw ? "Ẩn mật khẩu" : "Hiện mật khẩu"}
                  onClick={() => setShowPw((v) => !v)}
                  className="text-slate-400 transition hover:text-[#174A8F]"
                >
                  {showPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </Field>

            <Field
              label="Xác nhận mật khẩu"
              required
              hint="Khớp mật khẩu"
              error={show("confirm")}
            >
              <div className={wrap}>
                <ShieldCheck className="h-4 w-4 shrink-0 text-slate-400" />
                <input
                  type={showConfirm ? "text" : "password"}
                  className={base}
                  placeholder="Nhập lại mật khẩu vừa tạo"
                  autoComplete="new-password"
                  value={confirm}
                  onChange={(e) => setConfirm(e.target.value)}
                  onBlur={() => blur("confirm")}
                />
                <button
                  type="button"
                  aria-label={showConfirm ? "Ẩn mật khẩu" : "Hiện mật khẩu"}
                  onClick={() => setShowConfirm((v) => !v)}
                  className="text-slate-400 transition hover:text-[#174A8F]"
                >
                  {showConfirm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </Field>
          </div>

          {/* Độ mạnh mật khẩu */}
          <div className="flex items-center gap-3">
            <div className="flex flex-1 gap-2">
              {[1, 2, 3].map((i) => (
                <span
                  key={i}
                  className={`h-1 flex-1 rounded-full transition ${
                    strength >= i ? STRENGTH_COLOR[strength] : "bg-slate-200"
                  }`}
                />
              ))}
            </div>
            <span className="w-24 text-right text-[11px] text-slate-500">
              Độ mạnh{strength > 0 && `: ${STRENGTH_LABEL[strength]}`}
            </span>
          </div>

          {/* Đã từng khám */}
          <div className="rounded-xl bg-slate-50 px-4 py-3">
            <label className="flex cursor-pointer items-start gap-3">
              <input
                type="checkbox"
                checked={hasVisited}
                onChange={(e) => setHasVisited(e.target.checked)}
                className="mt-0.5 h-4 w-4 shrink-0 accent-[#2B6CB0]"
              />
              <span className="text-xs leading-relaxed text-slate-600">
                <b className="text-slate-800">Tôi đã từng khám chữa bệnh tại MediConnect</b>
                <br />
                Tích chọn để nhập mã bệnh nhân (Mã PID trên đơn thuốc hoặc vòng đeo tay) nhằm
                liên thông dữ liệu lịch sử khám cũ.
              </span>
            </label>
            {hasVisited && (
              <div className="mt-3">
                <Field label="Mã bệnh nhân (PID)" required error={show("pid")}>
                  <div className={wrap}>
                    <IdCard className="h-4 w-4 shrink-0 text-slate-400" />
                    <input
                      className={base}
                      placeholder="VD: BN-8896"
                      value={pid}
                      onChange={(e) => setPid(e.target.value)}
                      onBlur={() => blur("pid")}
                    />
                  </div>
                </Field>
              </div>
            )}
          </div>

          {/* Cam kết */}
          <label className="flex cursor-pointer items-start gap-3 rounded-xl bg-blue-50/60 px-4 py-3">
            <input
              type="checkbox"
              checked={agree}
              onChange={(e) => setAgree(e.target.checked)}
              className="mt-0.5 h-4 w-4 shrink-0 accent-[#2B6CB0]"
            />
            <span className="text-xs leading-relaxed text-slate-700">
              Tôi cam kết thông tin kê khai là chính xác và đồng ý với{" "}
              <Link href="/dieu-khoan" className="font-bold text-[#174A8F] hover:underline">
                Điều khoản sử dụng
              </Link>{" "}
              cùng{" "}
              <Link
                href="/chinh-sach-bao-mat"
                className="font-bold text-[#174A8F] hover:underline"
              >
                Chính sách bảo mật hồ sơ sức khỏe
              </Link>{" "}
              của MediConnect.
            </span>
          </label>

          <button
            type="submit"
            disabled={!valid || loading}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#174A8F] px-6 py-3.5 text-sm font-bold uppercase text-white shadow transition hover:bg-[#0E3A75] disabled:cursor-not-allowed disabled:bg-slate-300"
          >
            {loading ? "Đang xử lý..." : "Tiếp tục xác thực OTP"}
            {!loading && <ArrowRight className="h-4 w-4" />}
          </button>
        </form>
      )}

      {/* ===================== BƯỚC 2: OTP ===================== */}
      {step === 2 && (
        <OtpVerifyForm
          phone={phone}
          onBack={() => setStep(1)}
          onSuccess={() => setSuccess(true)}
        />
      )}

      {/* Chân form */}
      <div className="mt-6 flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 pt-4 text-[11px] text-slate-500">
        <span>
          Đã có tài khoản bệnh nhân?{" "}
          <Link href="/login" className="font-bold text-[#174A8F] hover:underline">
            Đăng nhập ngay
          </Link>
        </span>
        <span className="flex flex-wrap items-center gap-4">
          <span className="flex items-center gap-1.5">
            <Headset className="h-3.5 w-3.5 text-[#2B6CB0]" />
            Tổng đài CSKH: <b className="text-[#174A8F]">1900 986 868</b>
          </span>
          <span className="flex items-center gap-1.5">
            <BadgeCheck className="h-3.5 w-3.5 text-[#2B6CB0]" />
            Hỗ trợ kỹ thuật 24/7
          </span>
        </span>
      </div>
    </div>
  );
}