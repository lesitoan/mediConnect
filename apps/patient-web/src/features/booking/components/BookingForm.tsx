"use client";

import { useEffect, useMemo, useState } from "react";
import {
    ArrowLeft,
    ArrowRight,
    BadgeCheck,
    Calendar,
    CalendarCheck,
    Check,
    Clock,
    Info,
    Lightbulb,
    MapPin,
    ShieldCheck,
    Stethoscope,
    Sun,
    Sunset,
} from "@/components/layout/icons";
import BookingConsultCard from "./BookingSidebar";

/* ---------- Hằng số & tiện ích ---------- */

const SESSIONS = {
    morning: { label: "Buổi sáng", range: "7:00 - 11:00", start: 420, end: 660 },
    afternoon: { label: "Buổi chiều", range: "13:30 - 16:00", start: 810, end: 960 },
} as const;
type SessionKey = keyof typeof SESSIONS;

const SLOT_MINUTES = 30;
const CUTOFF_HOURS = 2;
const DAYS_AHEAD = 10;

const WEEKDAY_FULL = ["Chủ nhật", "Thứ Hai", "Thứ Ba", "Thứ Tư", "Thứ Năm", "Thứ Sáu", "Thứ Bảy"];

const SPECIALTIES = [
    { id: "noi-tong-quat", name: "Nội tổng quát" },
    { id: "tim-mach", name: "Tim mạch" },
    { id: "da-lieu", name: "Da liễu" },
    { id: "nhi", name: "Nhi khoa" },
];
const DOCTORS = [
    { id: "bs-1", name: "BS. Nguyễn Văn An", specialtyId: "noi-tong-quat" },
    { id: "bs-2", name: "BS. Trần Thị Bình", specialtyId: "noi-tong-quat" },
    { id: "bs-3", name: "BS. Lê Minh Châu", specialtyId: "tim-mach" },
    { id: "bs-4", name: "BS. Phạm Quốc Dũng", specialtyId: "da-lieu" },
    { id: "bs-5", name: "BS. Hoàng Thu Hà", specialtyId: "nhi" },
];

const TRUST_ITEMS = [
    { icon: ShieldCheck, title: "Bảo mật chuẩn Y tế", desc: "Mã hóa dữ liệu bệnh án" },
    { icon: Clock, title: "Ưu tiên phân luồng", desc: "Giảm 80% thời gian chờ" },
    { icon: BadgeCheck, title: "Bảo lãnh trực tiếp", desc: "BHYT & Bảo hiểm tư nhân" },
];

const pad = (n: number) => String(n).padStart(2, "0");
const fmtMin = (m: number) => `${pad(Math.floor(m / 60))}:${pad(m % 60)}`;
const dateKey = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
const fmtVN = (d: Date) => `${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${d.getFullYear()}`;
const isWeekend = (d: Date) => d.getDay() === 0 || d.getDay() === 6;

function buildDays(now: Date) {
    const out: Date[] = [];
    const d = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    while (out.length < DAYS_AHEAD) {
        if (!isWeekend(d)) out.push(new Date(d));
        d.setDate(d.getDate() + 1);
    }
    return out;
}

/** TODO: thay bằng API số lượt còn trống theo bác sĩ/ngày/khung giờ */
function mockRemaining(key: string, from: number) {
    let h = 0;
    for (const c of key + from) h = (h * 31 + c.charCodeAt(0)) >>> 0;
    const r = h % 10;
    return r < 2 ? 0 : r - 1;
}

type SlotStatus = "available" | "full" | "expired";
type Slot = { from: number; to: number; status: SlotStatus; remaining: number };

function buildSlots(day: Date, session: SessionKey, now: Date, resourceKey: string): Slot[] {
    const { start, end } = SESSIONS[session];
    const cutoff = now.getTime() + CUTOFF_HOURS * 3600_000;
    const slots: Slot[] = [];
    for (let m = start; m < end; m += SLOT_MINUTES) {
        const startAt = new Date(day.getFullYear(), day.getMonth(), day.getDate(), 0, m).getTime();
        const remaining = mockRemaining(`${resourceKey}|${dateKey(day)}`, m);
        const status: SlotStatus =
            startAt < cutoff ? "expired" : remaining === 0 ? "full" : "available";
        slots.push({ from: m, to: m + SLOT_MINUTES, status, remaining });
    }
    return slots;
}

const inputClass =
    "w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-[#2B6CB0] focus:ring-2 focus:ring-[#2B6CB0]/20 disabled:cursor-not-allowed disabled:bg-slate-50";

/* ---------- Thành phần nhỏ ---------- */

function Stepper({
    step,
    doneNote,
}: {
    step: 1 | 2;
    doneNote?: string;
}) {
    const items = [
        { label: "Thời gian", sub: step > 1 ? doneNote : undefined },
        { label: "Thông tin", sub: step === 2 ? "Đang điền thông tin" : undefined },
    ];
    return (
        <ol className="mx-auto flex max-w-sm items-start justify-center">
            {items.map((it, i) => {
                const n = i + 1;
                const active = step === n;
                const done = step > n;
                return (
                    <li key={it.label} className="flex items-start">
                        {i > 0 && (
                            <span
                                className={`mt-4 h-0.5 w-12 sm:w-24 ${step >= n ? "bg-[#2B6CB0]" : "bg-slate-200"}`}
                            />
                        )}
                        <div className="flex w-28 flex-col items-center gap-1">
                            <span
                                className={`flex h-9 w-9 items-center justify-center rounded-full text-sm font-bold ring-4 ${active || done
                                    ? "bg-[#2B6CB0] text-white ring-blue-100"
                                    : "border border-slate-200 bg-white text-slate-400 ring-slate-100"
                                    }`}
                            >
                                {done ? <Check className="h-4 w-4" /> : n}
                            </span>
                            <span
                                className={`text-[10px] font-bold uppercase ${active || done ? "text-[#174A8F]" : "text-slate-400"
                                    }`}
                            >
                                {n}. {it.label}
                            </span>
                            {it.sub && (
                                <span className="text-center text-[10px] text-slate-500">{it.sub}</span>
                            )}
                        </div>
                    </li>
                );
            })}
        </ol>
    );
}

function SummaryRow({
    icon,
    label,
    children,
}: {
    icon: React.ReactNode;
    label: string;
    children: React.ReactNode;
}) {
    return (
        <div className="border-b border-slate-100 py-3 last:border-0">
            <p className="flex items-center gap-1.5 text-[10px] font-bold uppercase text-slate-500">
                {icon}
                {label}
            </p>
            <div className="mt-1.5 text-sm">{children}</div>
        </div>
    );
}

function Field({
    label,
    required,
    hint,
    children,
}: {
    label: string;
    required?: boolean;
    hint?: string;
    children: React.ReactNode;
}) {
    return (
        <label className="block">
            <span className="mb-1.5 flex items-center justify-between text-xs font-bold text-slate-700">
                <span>
                    {label}
                    {required && <span className="text-red-500"> *</span>}
                </span>
                {hint && <span className="font-normal italic text-slate-400">{hint}</span>}
            </span>
            {children}
        </label>
    );
}

/* ---------- Form chính ---------- */

export default function BookingForm() {
    const [now, setNow] = useState<Date | null>(null);
    useEffect(() => setNow(new Date()), []);

    const [step, setStep] = useState<1 | 2>(1);
    const [done, setDone] = useState(false);

    const [specialtyId, setSpecialtyId] = useState("");
    const [doctorId, setDoctorId] = useState("");
    const [dayIndex, setDayIndex] = useState(0);
    const [session, setSession] = useState<SessionKey>("morning");
    const [slotFrom, setSlotFrom] = useState<number | null>(null);

    const [lastName, setLastName] = useState(""); // Họ và tên đệm
    const [firstName, setFirstName] = useState(""); // Tên
    const [phone, setPhone] = useState("");
    const [email, setEmail] = useState("");
    const [reason, setReason] = useState("");
    const [agree, setAgree] = useState(false);

    const days = useMemo(() => (now ? buildDays(now) : []), [now]);
    const day = days[dayIndex];
    const resourceKey = doctorId || specialtyId || "all";
    const slots = useMemo(
        () => (now && day ? buildSlots(day, session, now, resourceKey) : []),
        [now, day, session, resourceKey],
    );
    const doctors = DOCTORS.filter((d) => d.specialtyId === specialtyId);
    const specialty = SPECIALTIES.find((s) => s.id === specialtyId);
    const doctor = DOCTORS.find((d) => d.id === doctorId);
    const selectedSlot = slots.find((s) => s.from === slotFrom);
    const hasExpired = slots.some((s) => s.status === "expired");

    const phoneOk = /^0\d{9}$/.test(phone.trim());
    const emailOk = email.trim() === "" || /^\S+@\S+\.\S+$/.test(email.trim());
    const canNext = !!specialtyId && slotFrom !== null;
    const canSubmit =
        lastName.trim() !== "" && firstName.trim() !== "" && phoneOk && emailOk && agree;

    const handleSubmit = (e: React.SyntheticEvent) => {
        e.preventDefault();
        if (!canSubmit || !day || !selectedSlot) return;
        // TODO: gọi API đặt lịch: { specialtyId, doctorId, date: dateKey(day), from: selectedSlot.from,
        //   fullName: `${lastName} ${firstName}`, phone, email, reason }
        setDone(true);
    };

    if (!now || !day) {
        return <div className="h-[560px] animate-pulse rounded-3xl bg-white/70" />;
    }

    const slotText = selectedSlot
        ? `${fmtMin(selectedSlot.from)} - ${fmtMin(selectedSlot.to)}`
        : "";

    return (
        <div>
            <div className="grid items-start gap-6 lg:grid-cols-[1fr_340px]">
                {/* ===== Cột trái ===== */}
                <div className="rounded-3xl bg-white p-6 shadow-[0_6px_24px_rgba(23,74,143,0.08)] md:p-8">
                    {done ? (
                        <div className="py-12 text-center">
                            <span className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100 text-emerald-600">
                                <CalendarCheck className="h-8 w-8" />
                            </span>
                            <h2 className="mt-5 text-2xl font-extrabold text-slate-900">
                                Đặt lịch thành công
                            </h2>
                            <p className="mx-auto mt-3 max-w-md text-sm leading-relaxed text-slate-600">
                                Lịch khám lúc <b>{slotText}</b> ngày <b>{fmtVN(day)}</b> đã được ghi nhận. Thông
                                báo xác nhận sẽ gửi đến số <b>{phone}</b>.
                            </p>
                        </div>
                    ) : (
                        <form onSubmit={handleSubmit}>
                            <Stepper
                                step={step}
                                doneNote={selectedSlot ? `Đã chọn: ${slotText}` : undefined}
                            />

                            {/* ---------- BƯỚC 1 ---------- */}
                            {step === 1 && (
                                <div className="mt-8">
                                    <h2 className="text-xl font-extrabold text-slate-900">
                                        Chọn ngày &amp; khung giờ
                                    </h2>
                                    <p className="mt-1 text-xs text-slate-500">
                                        Không nhận Thứ 7 / Chủ nhật. Chỉ nhận đặt từ{" "}
                                        <b className="text-[#2B6CB0]">Hiện tại + {CUTOFF_HOURS} giờ</b> trở đi.
                                    </p>

                                    <h3 className="mt-6 flex items-center gap-1.5 text-xs font-extrabold uppercase text-slate-700">
                                        <Stethoscope className="h-3.5 w-3.5 text-[#2B6CB0]" />
                                        Chọn chuyên khoa &amp; bác sĩ
                                    </h3>
                                    <div className="mt-3 grid gap-4 md:grid-cols-2">
                                        <Field label="Chuyên khoa" required>
                                            <select
                                                className={inputClass}
                                                value={specialtyId}
                                                onChange={(e) => {
                                                    setSpecialtyId(e.target.value);
                                                    setDoctorId("");
                                                    setSlotFrom(null);
                                                }}
                                            >
                                                <option value="">-- Chọn chuyên khoa --</option>
                                                {SPECIALTIES.map((s) => (
                                                    <option key={s.id} value={s.id}>
                                                        {s.name}
                                                    </option>
                                                ))}
                                            </select>
                                        </Field>
                                        <Field label="Bác sĩ">
                                            <select
                                                className={inputClass}
                                                value={doctorId}
                                                onChange={(e) => {
                                                    setDoctorId(e.target.value);
                                                    setSlotFrom(null);
                                                }}
                                                disabled={!specialtyId}
                                            >
                                                <option value="">
                                                    {specialtyId ? "Bác sĩ bất kỳ" : "Chọn chuyên khoa trước"}
                                                </option>
                                                {doctors.map((d) => (
                                                    <option key={d.id} value={d.id}>
                                                        {d.name}
                                                    </option>
                                                ))}
                                            </select>
                                        </Field>
                                    </div>

                                    <div className="mt-6 flex items-center justify-between">
                                        <h3 className="flex items-center gap-1.5 text-xs font-extrabold uppercase text-slate-700">
                                            <Calendar className="h-3.5 w-3.5 text-[#2B6CB0]" />
                                            Chọn ngày khám
                                        </h3>
                                        <span className="text-xs font-bold text-[#2B6CB0]">
                                            Tháng {day.getMonth() + 1} / {day.getFullYear()}
                                        </span>
                                    </div>

                                    <div className="mt-3 flex gap-2 overflow-x-auto pb-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                                        {days.map((d, i) => {
                                            const active = i === dayIndex;
                                            return (
                                                <button
                                                    key={dateKey(d)}
                                                    type="button"
                                                    onClick={() => {
                                                        setDayIndex(i);
                                                        setSlotFrom(null);
                                                    }}
                                                    className={`flex w-[62px] shrink-0 flex-col items-center rounded-xl border py-2.5 transition ${active
                                                        ? "border-[#2B6CB0] bg-[#2B6CB0] text-white shadow-md"
                                                        : "border-slate-200 bg-white text-slate-700 hover:border-[#2B6CB0]"
                                                        }`}
                                                >
                                                    <span
                                                        className={`text-[10px] font-bold ${active ? "text-white/80" : "text-slate-400"}`}
                                                    >
                                                        T{d.getDay() + 1}
                                                    </span>
                                                    <span className="text-xl font-extrabold leading-tight">
                                                        {d.getDate()}
                                                    </span>
                                                    <span
                                                        className={`text-[10px] ${active ? "text-white/80" : "text-slate-400"}`}
                                                    >
                                                        {pad(d.getMonth() + 1)}/{String(d.getFullYear()).slice(2)}
                                                    </span>
                                                </button>
                                            );
                                        })}
                                    </div>

                                    <h3 className="mt-6 flex items-center gap-1.5 text-xs font-extrabold uppercase text-slate-700">
                                        <Clock className="h-3.5 w-3.5 text-rose-500" />
                                        Chọn buổi &amp; giờ cụ thể
                                    </h3>
                                    <div className="mt-3 grid grid-cols-2 gap-3">
                                        {(Object.keys(SESSIONS) as SessionKey[]).map((key) => {
                                            const s = SESSIONS[key];
                                            const active = session === key;
                                            const Ico = key === "morning" ? Sun : Sunset;
                                            return (
                                                <button
                                                    key={key}
                                                    type="button"
                                                    onClick={() => {
                                                        setSession(key);
                                                        setSlotFrom(null);
                                                    }}
                                                    className={`flex flex-col items-center gap-1 rounded-2xl border py-5 transition ${active
                                                        ? "border-transparent bg-gradient-to-br from-[#2B6CB0] to-[#0E9A8C] text-white shadow-lg"
                                                        : "border-slate-200 bg-white text-slate-700 hover:border-[#2B6CB0]"
                                                        }`}
                                                >
                                                    <Ico
                                                        className={`h-6 w-6 ${active ? "text-amber-300" : "text-amber-500"}`}
                                                    />
                                                    <span className="text-sm font-extrabold">{s.label}</span>
                                                    <span
                                                        className={`text-xs ${active ? "text-white/85" : "text-slate-500"}`}
                                                    >
                                                        {s.range}
                                                    </span>
                                                </button>
                                            );
                                        })}
                                    </div>

                                    <p className="mt-6 text-xs font-semibold text-slate-600">
                                        Các khung giờ {SESSIONS[session].label.toLowerCase()} khả dụng:
                                    </p>
                                    <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-4">
                                        {slots.map((s) => {
                                            const disabled = s.status !== "available";
                                            const active = slotFrom === s.from;
                                            return (
                                                <button
                                                    key={s.from}
                                                    type="button"
                                                    disabled={disabled}
                                                    onClick={() => setSlotFrom(s.from)}
                                                    className={`rounded-xl border px-2 py-2.5 text-center transition ${active
                                                        ? "border-[#2B6CB0] bg-blue-50 ring-2 ring-[#2B6CB0]/40"
                                                        : disabled
                                                            ? "cursor-not-allowed border-slate-100 bg-slate-50"
                                                            : "border-slate-200 bg-white hover:border-[#2B6CB0]"
                                                        }`}
                                                >
                                                    <span
                                                        className={`block text-xs font-bold ${active
                                                            ? "text-[#174A8F]"
                                                            : disabled
                                                                ? "text-slate-400 line-through"
                                                                : "text-slate-800"
                                                            }`}
                                                    >
                                                        {fmtMin(s.from)} - {fmtMin(s.to)}
                                                    </span>
                                                    <span
                                                        className={`mt-0.5 block text-[10px] font-bold ${active
                                                            ? "text-[#2B6CB0]"
                                                            : s.status === "expired"
                                                                ? "text-slate-400"
                                                                : s.status === "full"
                                                                    ? "text-rose-500"
                                                                    : "text-emerald-600"
                                                            }`}
                                                    >
                                                        {active
                                                            ? "Đang chọn"
                                                            : s.status === "expired"
                                                                ? "Hết giờ nhận"
                                                                : s.status === "full"
                                                                    ? "Đã hết chỗ"
                                                                    : `Còn ${s.remaining} lượt`}
                                                    </span>
                                                </button>
                                            );
                                        })}
                                    </div>

                                    {hasExpired && (
                                        <div className="mt-5 flex items-start gap-2.5 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-xs text-slate-700">
                                            <Info className="mt-0.5 h-4 w-4 shrink-0 text-amber-500" />
                                            Một số khung giờ đã quá thời hạn quy định (Hiện tại + {CUTOFF_HOURS} giờ).
                                            Quý khách vui lòng chọn các khung giờ còn lại.
                                        </div>
                                    )}

                                    <div className="mt-8 flex items-center justify-between gap-3 border-t border-slate-100 pt-6">
                                        <p className="text-xs text-slate-400">
                                            {!specialtyId ? "Vui lòng chọn chuyên khoa để tiếp tục." : ""}
                                        </p>
                                        <button
                                            type="button"
                                            disabled={!canNext}
                                            onClick={() => setStep(2)}
                                            className="inline-flex items-center gap-2 rounded-full bg-[#2B6CB0] px-8 py-3 text-sm font-bold text-white shadow transition hover:bg-[#174A8F] disabled:cursor-not-allowed disabled:bg-slate-300"
                                        >
                                            Tiếp theo
                                            <ArrowRight className="h-4 w-4" />
                                        </button>
                                    </div>
                                </div>
                            )}

                            {/* ---------- BƯỚC 2 ---------- */}
                            {step === 2 && (
                                <div className="mt-8">
                                    <h2 className="text-xl font-extrabold text-slate-900">Thông tin bệnh nhân</h2>
                                    <p className="mt-1 text-xs leading-relaxed text-slate-500">
                                        Điền thông tin để chúng tôi xác nhận lịch khám, chuẩn bị hồ sơ y tế và liên hệ
                                        hỗ trợ bạn kịp thời.
                                    </p>

                                    <div className="mt-6 grid gap-5 md:grid-cols-2">
                                        <Field label="Họ và tên đệm" required>
                                            <input
                                                className={inputClass}
                                                placeholder="Nguyễn"
                                                autoComplete="family-name"
                                                value={lastName}
                                                onChange={(e) => setLastName(e.target.value)}
                                            />
                                        </Field>
                                        <Field label="Tên bệnh nhân" required>
                                            <input
                                                className={inputClass}
                                                placeholder="Văn An"
                                                autoComplete="given-name"
                                                value={firstName}
                                                onChange={(e) => setFirstName(e.target.value)}
                                            />
                                        </Field>
                                        <Field label="Số điện thoại" required>
                                            <input
                                                type="tel"
                                                inputMode="numeric"
                                                className={inputClass}
                                                placeholder="0905 123 456"
                                                autoComplete="tel"
                                                value={phone}
                                                onChange={(e) => setPhone(e.target.value.replace(/\s/g, ""))}
                                            />
                                        </Field>
                                        <Field label="Địa chỉ Email">
                                            <input
                                                type="email"
                                                className={inputClass}
                                                placeholder="van.an.nguyen@example.com"
                                                autoComplete="email"
                                                value={email}
                                                onChange={(e) => setEmail(e.target.value)}
                                            />
                                        </Field>
                                        <div className="md:col-span-2">
                                            <Field label="Triệu chứng / Ghi chú cho bác sĩ" hint="Tùy chọn">
                                                <textarea
                                                    rows={4}
                                                    className={inputClass}
                                                    placeholder="Ví dụ: Đau thắt vùng lưng dưới kéo dài 3 ngày, muốn kiểm tra chụp phim tổng quát và tư vấn phục hồi chức năng."
                                                    value={reason}
                                                    onChange={(e) => setReason(e.target.value)}
                                                />
                                            </Field>
                                        </div>
                                    </div>

                                    {phone && !phoneOk && (
                                        <p className="mt-3 text-xs text-red-500">
                                            Số điện thoại phải gồm 10 chữ số và bắt đầu bằng 0.
                                        </p>
                                    )}
                                    {!emailOk && (
                                        <p className="mt-3 text-xs text-red-500">Địa chỉ email chưa đúng định dạng.</p>
                                    )}

                                    <div className="mt-5 flex items-start gap-2.5 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-xs leading-relaxed text-slate-700">
                                        <Info className="mt-0.5 h-4 w-4 shrink-0 text-[#2B6CB0]" />
                                        <p>
                                            <b>Lưu ý quan trọng:</b> Vui lòng có mặt tại cơ sở trước giờ hẹn{" "}
                                            <b>15 phút</b> để hoàn tất thủ tục phân luồng. Vui lòng mang theo{" "}
                                            <b>CCCD gắn chip / Hộ chiếu</b> và thẻ BHYT bản cứng hoặc ứng dụng VssID
                                            (nếu có).
                                        </p>
                                    </div>

                                    <label className="mt-5 flex cursor-pointer items-start gap-3 rounded-xl border border-blue-100 bg-blue-50/60 px-4 py-3">
                                        <input
                                            type="checkbox"
                                            checked={agree}
                                            onChange={(e) => setAgree(e.target.checked)}
                                            className="mt-0.5 h-4 w-4 shrink-0 accent-[#2B6CB0]"
                                        />
                                        <span className="text-xs leading-relaxed text-slate-700">
                                            Tôi cam đoan thông tin khai báo trên là chính xác, đồng thời đã đọc và hoàn
                                            toàn đồng ý với <b className="text-[#174A8F]">Điều khoản dịch vụ y tế</b> và{" "}
                                            <b className="text-[#174A8F]">Chính sách bảo mật dữ liệu sức khỏe</b> của
                                            MediConnect.
                                        </span>
                                    </label>

                                    <button
                                        type="submit"
                                        disabled={!canSubmit}
                                        className="mt-6 flex w-full items-center justify-center gap-2 rounded-xl bg-[#174A8F] px-6 py-3.5 text-sm font-bold uppercase text-white shadow transition hover:bg-[#0E3A75] disabled:cursor-not-allowed disabled:bg-slate-300"
                                    >
                                        <CalendarCheck className="h-4 w-4" />
                                        Xem lại &amp; xác nhận lịch khám
                                    </button>

                                    <p className="mt-4 text-center text-xs leading-relaxed text-slate-500">
                                        Bạn sẽ nhận được thông báo xác nhận qua số điện thoại hoặc email. Đội ngũ điều
                                        phối viên sẽ liên hệ trong vòng <b>30 phút</b> nếu cần hỗ trợ thêm.
                                    </p>

                                    <div className="mt-6 border-t border-slate-100 pt-5">
                                        <button
                                            type="button"
                                            onClick={() => setStep(1)}
                                            className="inline-flex items-center gap-1.5 text-xs font-bold text-rose-600 transition hover:text-rose-700"
                                        >
                                            <ArrowLeft className="h-3.5 w-3.5" />
                                            Quay lại chọn ngày &amp; giờ
                                        </button>
                                    </div>
                                </div>
                            )}
                        </form>
                    )}
                </div>

                {/* ===== Cột phải ===== */}
                <aside className="space-y-6 lg:sticky lg:top-40">
                    <div className="rounded-3xl bg-white p-6 shadow-[0_6px_24px_rgba(23,74,143,0.08)]">
                        <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                            <h3 className="flex items-center gap-2 text-sm font-extrabold uppercase text-[#174A8F]">
                                <CalendarCheck className="h-4 w-4" />
                                Tóm tắt lịch hẹn
                            </h3>
                            <span className="rounded-full bg-blue-50 px-2.5 py-1 text-[10px] font-bold text-[#2B6CB0]">
                                BƯỚC {step}/2
                            </span>
                        </div>

                        <SummaryRow icon={<Stethoscope className="h-3 w-3" />} label="Chuyên khoa & bác sĩ">
                            {specialty ? (
                                <>
                                    <b className="block text-slate-900">{specialty.name}</b>
                                    <span className="text-xs text-slate-500">
                                        {doctor ? doctor.name : "Bác sĩ bất kỳ"}
                                    </span>
                                </>
                            ) : (
                                <span className="text-slate-400">Chưa chọn chuyên khoa</span>
                            )}
                        </SummaryRow>

                        <SummaryRow icon={<Calendar className="h-3 w-3" />} label="Ngày khám dự kiến">
                            <b className="block text-slate-900">
                                {WEEKDAY_FULL[day.getDay()]}, {fmtVN(day)}
                            </b>
                            <span className="text-xs text-slate-500">Lịch khám theo yêu cầu</span>
                        </SummaryRow>

                        <SummaryRow icon={<Clock className="h-3 w-3 text-amber-500" />} label="Khung giờ khám">
                            {selectedSlot ? (
                                <>
                                    <b className="block text-[#2B6CB0]">{slotText}</b>
                                    <span className="text-xs text-slate-500">
                                        {SESSIONS[session].label} (Khung giờ sáng)
                                    </span>
                                </>
                            ) : (
                                <span className="text-slate-400">Chưa chọn khung giờ</span>
                            )}
                        </SummaryRow>

                        <SummaryRow icon={<MapPin className="h-3 w-3" />} label="Cơ sở & chuyên khoa">
                            <b className="block text-slate-900">Phòng khám đa khoa MediConnect</b>
                            <span className="text-xs text-slate-500">
                                216 Nguyễn Công Trứ, An Hải Bắc, Sơn Trà, Đà Nẵng
                            </span>
                        </SummaryRow>

                        <div className="flex items-center justify-between pt-3 text-xs text-slate-500">
                            Quyền lợi BHYT
                            <span className="rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-[11px] font-bold text-emerald-600">
                                Đúng tuyến 100%
                            </span>
                        </div>

                        {step === 2 && !done && (
                            <div className="mt-4 text-right">
                                <button
                                    type="button"
                                    onClick={() => setStep(1)}
                                    className="text-xs font-bold text-[#174A8F] underline-offset-2 transition hover:underline"
                                >
                                    Thay đổi giờ khám →
                                </button>
                            </div>
                        )}
                    </div>

                    <BookingConsultCard />


                </aside>
            </div>

            {/* ===== 3 ô cam kết (chỉ hiện ở bước 2) ===== */}
            {step === 2 && !done && (
                <div className="mt-6 grid gap-4 md:grid-cols-3">
                    {TRUST_ITEMS.map(({ icon: Ico, title, desc }) => (
                        <div
                            key={title}
                            className="flex items-center gap-3 rounded-2xl bg-white px-5 py-4 shadow-[0_6px_24px_rgba(23,74,143,0.06)]"
                        >
                            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-[#2B6CB0]">
                                <Ico className="h-5 w-5" />
                            </span>
                            <span className="leading-tight">
                                <span className="block text-xs font-bold text-slate-800">{title}</span>
                                <span className="block text-[11px] text-slate-500">{desc}</span>
                            </span>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}