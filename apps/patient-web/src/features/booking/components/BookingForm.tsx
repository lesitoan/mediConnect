"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
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
    MapPin,
    ShieldCheck,
    Stethoscope,
    Sun,
    Sunset,
} from "@/components/layout/icons";
import BookingConsultCard from "./BookingSidebar";
import { clearSession, useAuth } from "@/features/auth/useAuth";
import {
    ApiRequestError,
    bookAppointment,
    getAppointmentAvailability,
    type AvailabilitySlot,
} from "@/features/appointments/services/appointmentsService";
import {
    getPublicDoctors,
    type PublicDoctor,
} from "@/features/providers/services/providersService";
import {
    getPublicSpecialties,
    type PublicSpecialty,
} from "@/features/specialties/services/specialtiesService";

/* ---------- Hằng số & tiện ích ---------- */

const SESSIONS = {
    morning: { label: "Buổi sáng", range: "8:00 - 12:00", start: 480, end: 720 },
    afternoon: { label: "Buổi chiều", range: "13:00 - 18:00", start: 780, end: 1080 },
} as const;
type SessionKey = keyof typeof SESSIONS;

const CUTOFF_HOURS = 2;
const DAYS_AHEAD = 14;
const BOOKING_LOGIN_URL = "/login?next=%2Fdat-lich";

const WEEKDAY_FULL = ["Chủ nhật", "Thứ Hai", "Thứ Ba", "Thứ Tư", "Thứ Năm", "Thứ Sáu", "Thứ Bảy"];

const TRUST_ITEMS = [
    { icon: ShieldCheck, title: "Bảo mật chuẩn Y tế", desc: "Mã hóa dữ liệu bệnh án" },
    { icon: Clock, title: "Ưu tiên phân luồng", desc: "Giảm 80% thời gian chờ" },
    { icon: BadgeCheck, title: "Bảo lãnh trực tiếp", desc: "BHYT & Bảo hiểm tư nhân" },
];

const pad = (n: number) => String(n).padStart(2, "0");
const dateKey = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
const fmtVN = (d: Date) => `${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${d.getFullYear()}`;
function buildDays(now: Date) {
    const out: Date[] = [];
    const d = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    while (out.length < DAYS_AHEAD) {
        out.push(new Date(d));
        d.setDate(d.getDate() + 1);
    }
    return out;
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
    const router = useRouter();
    const { user, ready: isAuthReady } = useAuth();
    const [now, setNow] = useState<Date | null>(null);
    // The client timestamp is initialized after hydration to keep date rendering stable.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    useEffect(() => setNow(new Date()), []);

    const [step, setStep] = useState<1 | 2>(1);
    const [done, setDone] = useState(false);

    const [specialtyId, setSpecialtyId] = useState("");
    const [doctorId, setDoctorId] = useState("");
    const [specialties, setSpecialties] = useState<PublicSpecialty[]>([]);
    const [doctorsCatalog, setDoctorsCatalog] = useState<PublicDoctor[]>([]);
    const [isLoadingCatalog, setIsLoadingCatalog] = useState(true);
    const [catalogError, setCatalogError] = useState("");
    const [dayIndex, setDayIndex] = useState(0);
    const [session, setSession] = useState<SessionKey>("morning");
    const [slotId, setSlotId] = useState<string | null>(null);
    const [availability, setAvailability] = useState<AvailabilitySlot[]>([]);
    const [availabilityLoadedDate, setAvailabilityLoadedDate] = useState("");
    const [availabilityError, setAvailabilityError] = useState("");
    const [bookingError, setBookingError] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);

    const [lastName, setLastName] = useState(""); // Họ và tên đệm
    const [firstName, setFirstName] = useState(""); // Tên
    const [phone, setPhone] = useState("");
    const [email, setEmail] = useState("");
    const [reason, setReason] = useState("");
    const [agree, setAgree] = useState(false);

    useEffect(() => {
        let isCancelled = false;
        const controller = new AbortController();
        Promise.all([
            getPublicSpecialties(controller.signal),
            getPublicDoctors(controller.signal),
        ])
            .then(([specialtyItems, doctorItems]) => {
                if (isCancelled) return;
                setSpecialties(specialtyItems);
                setDoctorsCatalog(doctorItems);
                const requestedSpecialtyId = new URLSearchParams(
                    window.location.search,
                ).get("specialty");
                if (specialtyItems.some(({ id }) => id === requestedSpecialtyId)) {
                    setSpecialtyId(requestedSpecialtyId ?? "");
                }
                setCatalogError("");
            })
            .catch((error: unknown) => {
                if (!isCancelled) {
                    setCatalogError(
                        error instanceof Error
                            ? error.message
                            : "Không thể tải danh sách chuyên khoa và bác sĩ.",
                    );
                }
            })
            .finally(() => {
                if (!isCancelled) setIsLoadingCatalog(false);
            });
        return () => {
            isCancelled = true;
            controller.abort();
        };
    }, []);

    const days = useMemo(() => (now ? buildDays(now) : []), [now]);
    const day = days[dayIndex];
    useEffect(() => {
        if (!day) return;
        let isCancelled = false;
        getAppointmentAvailability(dateKey(day))
            .then((data) => {
                if (!isCancelled) {
                    setAvailability(data);
                    setAvailabilityError("");
                    setAvailabilityLoadedDate(dateKey(day));
                }
            })
            .catch((error: unknown) => {
                if (!isCancelled) {
                    setAvailability([]);
                    setAvailabilityError(
                        error instanceof Error ? error.message : "Không thể tải khung giờ khám",
                    );
                    setAvailabilityLoadedDate(dateKey(day));
                }
            });
        return () => {
            isCancelled = true;
        };
    }, [day]);

    const isLoadingAvailability = !!day && availabilityLoadedDate !== dateKey(day);

    const doctors = useMemo(
        () => doctorsCatalog.filter((item) => item.specialty.id === specialtyId),
        [doctorsCatalog, specialtyId],
    );
    const visibleSlots = useMemo(
        () =>
            availability.filter(
                (slot) =>
                    (!specialtyId || slot.doctor.specialty.id === specialtyId) &&
                    (!doctorId || slot.doctor.id === doctorId),
            ),
        [availability, doctorId, specialtyId],
    );
    const slots = useMemo(() => {
        const { start, end } = SESSIONS[session];
        const sessionSlots = visibleSlots.filter((slot) => {
            const startsAt = new Date(slot.startsAt);
            const minutes = startsAt.getHours() * 60 + startsAt.getMinutes();
            return minutes >= start && minutes < end;
        });
        if (specialtyId) return sessionSlots;

        return Array.from(
            new Map(
                sessionSlots.map((slot) => [
                    `${slot.startsAt}-${slot.endsAt}`,
                    slot,
                ]),
            ).values(),
        );
    }, [session, specialtyId, visibleSlots]);
    const displaySlots = isLoadingAvailability ? [] : slots;
    const specialty = specialties.find((item) => item.id === specialtyId);
    const doctor = doctors.find((item) => item.id === doctorId);
    const selectedSlot = availability.find((slot) => slot.id === slotId);

    const phoneOk = /^0\d{9}$/.test(phone.trim());
    const emailOk = email.trim() === "" || /^\S+@\S+\.\S+$/.test(email.trim());
    const canNext = !!specialtyId && slotId !== null;
    const canSubmit =
        lastName.trim() !== "" && firstName.trim() !== "" && phoneOk && emailOk && agree;

    const handleSubmit = async (e: React.SyntheticEvent) => {
        e.preventDefault();
        if (!canSubmit || !selectedSlot) return;
        if (!user) {
            router.push(BOOKING_LOGIN_URL);
            return;
        }
        setIsSubmitting(true);
        setBookingError("");
        try {
            await bookAppointment({
                appointmentSlotId: selectedSlot.id,
                reason: reason.trim() || undefined,
            });
            setDone(true);
        } catch (error: unknown) {
            if (error instanceof ApiRequestError && error.status === 401) {
                clearSession();
                router.push(BOOKING_LOGIN_URL);
                return;
            }
            setBookingError(
                error instanceof Error ? error.message : "Không thể đặt lịch khám",
            );
        } finally {
            setIsSubmitting(false);
        }
    };

    if (!isAuthReady) {
        return <div className="h-[560px] animate-pulse rounded-3xl bg-white/70" />;
    }

    if (!user) {
        return (
            <div className="mx-auto max-w-xl rounded-3xl bg-white p-8 text-center shadow-[0_6px_24px_rgba(23,74,143,0.08)]">
                <h2 className="text-xl font-extrabold text-slate-900">
                    Đăng nhập để đặt lịch khám
                </h2>
                <p className="mt-3 text-sm leading-relaxed text-slate-600">
                    Bạn cần đăng nhập tài khoản bệnh nhân trước khi chọn và xác nhận lịch khám.
                </p>
                <Link
                    href={BOOKING_LOGIN_URL}
                    className="mt-6 inline-flex rounded-full bg-[#2B6CB0] px-7 py-3 text-sm font-bold text-white transition hover:bg-[#174A8F]"
                >
                    Đăng nhập
                </Link>
            </div>
        );
    }

    if (!now || !day) {
        return <div className="h-[560px] animate-pulse rounded-3xl bg-white/70" />;
    }

    const slotText = selectedSlot
        ? `${new Date(selectedSlot.startsAt).toLocaleTimeString("vi-VN", {
            hour: "2-digit",
            minute: "2-digit",
        })} - ${new Date(selectedSlot.endsAt).toLocaleTimeString("vi-VN", {
            hour: "2-digit",
            minute: "2-digit",
        })}`
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
                                        Chỉ nhận đặt từ{" "}
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
                                                disabled={isLoadingCatalog || !!catalogError}
                                                onChange={(e) => {
                                                    setSpecialtyId(e.target.value);
                                                    setDoctorId("");
                                                    setSlotId(null);
                                                }}
                                            >
                                                <option value="">
                                                    {isLoadingCatalog
                                                        ? "Đang tải chuyên khoa..."
                                                        : catalogError
                                                          ? "Không thể tải chuyên khoa"
                                                          : specialties.length === 0
                                                            ? "Chưa có chuyên khoa"
                                                            : "-- Chọn chuyên khoa --"}
                                                </option>
                                                {specialties.map((s) => (
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
                                                    setSlotId(null);
                                                }}
                                                disabled={!specialtyId || isLoadingCatalog}
                                            >
                                                <option value="">
                                                    {specialtyId ? "Bác sĩ bất kỳ" : "Chọn chuyên khoa trước"}
                                                </option>
                                                {doctors.map((d) => (
                                                    <option key={d.id} value={d.id}>
                                                        {d.user.fullName}
                                                    </option>
                                                ))}
                                            </select>
                                        </Field>
                                    </div>
                                    {catalogError && (
                                        <p role="alert" className="mt-3 text-xs text-red-600">
                                            Không thể tải danh sách chuyên khoa và bác sĩ: {catalogError}
                                        </p>
                                    )}

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
                                                    setSlotId(null);
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
                                                        setSlotId(null);
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
                                    {isLoadingAvailability && (
                                        <p className="mt-3 text-xs text-slate-500">Đang tải khung giờ còn trống...</p>
                                    )}
                                    {availabilityError && (
                                        <p className="mt-3 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-xs text-rose-600">
                                            {availabilityError}
                                        </p>
                                    )}
                                    {!isLoadingAvailability && !availabilityError && displaySlots.length === 0 && (
                                        <p className="mt-3 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-xs text-amber-700">
                                            Không còn khung giờ phù hợp trong buổi này. Vui lòng chọn ngày, bác sĩ hoặc buổi khác.
                                        </p>
                                    )}
                                    <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-4">
                                        {displaySlots.map((s) => {
                                            const active = slotId === s.id;
                                            const startsAt = new Date(s.startsAt);
                                            const endsAt = new Date(s.endsAt);
                                            return (
                                                <button
                                                    key={s.id}
                                                    type="button"
                                                    onClick={() => setSlotId(s.id)}
                                                    className={`rounded-xl border px-2 py-2.5 text-center transition ${active
                                                        ? "border-[#2B6CB0] bg-blue-50 ring-2 ring-[#2B6CB0]/40"
                                                        : "border-slate-200 bg-white hover:border-[#2B6CB0]"
                                                        }`}
                                                >
                                                    <span
                                                        className={`block text-xs font-bold ${active ? "text-[#174A8F]" : "text-slate-800"}`}
                                                    >
                                                        {startsAt.toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" })} - {endsAt.toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" })}
                                                    </span>
                                                    <span className={`mt-0.5 block text-[10px] font-bold ${active ? "text-[#2B6CB0]" : "text-emerald-600"}`}>
                                                        {active ? "Đang chọn" : "Còn trống"}
                                                    </span>
                                                </button>
                                            );
                                        })}
                                    </div>

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
                                        disabled={!canSubmit || isSubmitting}
                                        className="mt-6 flex w-full items-center justify-center gap-2 rounded-xl bg-[#174A8F] px-6 py-3.5 text-sm font-bold uppercase text-white shadow transition hover:bg-[#0E3A75] disabled:cursor-not-allowed disabled:bg-slate-300"
                                    >
                                        <CalendarCheck className="h-4 w-4" />
                                        {isSubmitting ? "Đang đặt lịch..." : "Xem lại & xác nhận lịch khám"}
                                    </button>

                                    {bookingError && (
                                        <p className="mt-3 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-xs text-rose-600">
                                            {bookingError}
                                        </p>
                                    )}

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
                                        {doctor ? doctor.user.fullName : "Bác sĩ bất kỳ"}
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
