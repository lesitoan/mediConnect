"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  Calendar,
  CalendarCheck,
  Check,
  ChevronRight,
  Download,
  History,
  Home,
  Plus,
  Search,
  ShieldCheck,
} from "@/components/layout/icons";
import SecurityNotice from "@/components/layout/SecurityNotice";
import { useAuth } from "@/features/auth/useAuth";
import {
  MOCK_APPOINTMENTS,
  MOCK_RECORDS,
  type Appointment,
  type MedicalRecord,
} from "../data";
import AppointmentCard from "./AppointmentCard";
import {
  CancelModal,
  DetailModal,
  QrModal,
  RescheduleModal,
} from "./AppointmentModals";
import { startOf } from "./dateUtils";
import RecordCard from "./RecordCards";

type Tab = "upcoming" | "history";
type Range = "all" | "30" | "90" | "180";

type HistoryEntry =
  | { key: string; days: number; record: MedicalRecord }
  | { key: string; days: number; appt: Appointment };

const selectCls =
  "rounded-full border border-slate-200 bg-white px-4 py-2.5 text-xs font-semibold text-slate-700 outline-none transition focus:border-[#2B6CB0] focus:ring-2 focus:ring-[#2B6CB0]/20";

const delay = (ms: number) => new Promise((r) => setTimeout(r, ms));

export default function AppointmentHistoryPage() {
  const { user, ready } = useAuth();

  // `now` chỉ có sau khi mount để tránh lệch hydration
  const [now, setNow] = useState<Date | null>(null);
  useEffect(() => setNow(new Date()), []);

  const [items, setItems] = useState<Appointment[]>(MOCK_APPOINTMENTS);
  const [tab, setTab] = useState<Tab>("upcoming");
  const [query, setQuery] = useState("");
  const [range, setRange] = useState<Range>("all");
  const [specialty, setSpecialty] = useState("all");

  // Popup (lưu mã phiếu để luôn lấy dữ liệu mới nhất trong `items`)
  const [detailCode, setDetailCode] = useState<string | null>(null);
  const [qrCode, setQrCode] = useState<string | null>(null);
  const [rescheduleCode, setRescheduleCode] = useState<string | null>(null);
  const [cancelCode, setCancelCode] = useState<string | null>(null);

  const [notice, setNotice] = useState<string | null>(null);
  const noticeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const flash = (text: string) => {
    setNotice(text);
    if (noticeTimer.current) clearTimeout(noticeTimer.current);
    noticeTimer.current = setTimeout(() => setNotice(null), 4000);
  };

  const find = (code: string | null) => items.find((i) => i.code === code) ?? null;
  const detail = find(detailCode);
  const qr = find(qrCode);
  const reschedule = find(rescheduleCode);
  const cancel = find(cancelCode);

  const specialties = useMemo(
    () =>
      Array.from(
        new Set([
          ...items.map((i) => i.doctor.specialty),
          ...MOCK_RECORDS.map((r) => r.specialty),
        ]),
      ),
    [items],
  );

  const upcomingCount = items.filter(
    (i) => i.kind === "confirmed" || i.kind === "followup",
  ).length;
  const cancelledCount = items.filter((i) => i.kind === "cancelled").length;
  const historyCount = MOCK_RECORDS.length + cancelledCount;

  // Tab sắp tới: chỉ lịch đã xác nhận / tái khám
  const list = useMemo(() => {
    if (!now || tab !== "upcoming") return [];
    const q = query.trim().toLowerCase();
    return items
      .filter((i) => i.kind === "confirmed" || i.kind === "followup")
      .filter((i) => specialty === "all" || i.doctor.specialty === specialty)
      .filter(
        (i) =>
          !q ||
          i.doctor.name.toLowerCase().includes(q) ||
          i.doctor.specialty.toLowerCase().includes(q) ||
          i.code.toLowerCase().includes(q),
      )
      .filter((i) => range === "all" || Math.abs(i.daysFromNow) <= Number(range))
      .sort((a, b) => startOf(a, now).getTime() - startOf(b, now).getTime());
  }, [items, now, tab, query, range, specialty]);

  // Tab lịch sử: phiên khám đã hoàn tất (hồ sơ) + lịch đã hủy, mới nhất trước
  const history = useMemo<HistoryEntry[]>(() => {
    if (tab !== "history") return [];
    const q = query.trim().toLowerCase();

    const fromRecords: HistoryEntry[] = MOCK_RECORDS.filter(
      (r) =>
        (specialty === "all" || r.specialty === specialty) &&
        (!q ||
          r.title.toLowerCase().includes(q) ||
          r.doctor.name.toLowerCase().includes(q) ||
          r.specialty.toLowerCase().includes(q) ||
          r.visitCode.toLowerCase().includes(q)),
    ).map((r) => ({ key: r.id, days: r.daysFromNow, record: r }));

    const fromCancelled: HistoryEntry[] = items
      .filter(
        (a) =>
          a.kind === "cancelled" &&
          (specialty === "all" || a.doctor.specialty === specialty) &&
          (!q ||
            a.doctor.name.toLowerCase().includes(q) ||
            a.doctor.specialty.toLowerCase().includes(q) ||
            a.code.toLowerCase().includes(q)),
      )
      .map((a) => ({ key: a.code, days: a.daysFromNow, appt: a }));

    return [...fromRecords, ...fromCancelled]
      .filter((e) => range === "all" || Math.abs(e.days) <= Number(range))
      .sort((a, b) => b.days - a.days);
  }, [tab, items, query, range, specialty]);

  const confirmCancel = async () => {
    if (!cancel) return;
    // TODO: gọi API hủy lịch (UC06). Backend kiểm tra lại: lịch ở trạng thái Confirmed
    // và còn ≥ 2 giờ trước giờ khám; giải phóng khung giờ, gửi thông báo, ghi Audit Log.
    await delay(600);
    const code = cancel.code;
    setItems((cur) => cur.map((i) => (i.code === code ? { ...i, kind: "cancelled" } : i)));
    setCancelCode(null);
    flash(`Đã hủy lịch khám #${code}.`);
  };

  const confirmReschedule = async (daysFromNow: number, time: string) => {
    if (!reschedule) return;
    // TODO: gọi API đổi lịch (UC06). Backend kiểm tra: trạng thái Confirmed, còn ≥ 2 giờ,
    // chưa quá 2 lần đổi, khung giờ mới còn trống; giải phóng khung giờ cũ, gửi thông báo, ghi Audit Log.
    await delay(700);
    const code = reschedule.code;
    setItems((cur) =>
      cur.map((i) =>
        i.code === code
          ? { ...i, daysFromNow, time, rescheduleCount: (i.rescheduleCount ?? 0) + 1 }
          : i,
      ),
    );
    setRescheduleCode(null);
    flash(`Đã đổi lịch khám #${code} thành công.`);
  };

  if (!ready) return <div className="min-h-[70vh]" aria-hidden="true" />;

  if (!user) {
    return (
      <section className="bg-[#F6FAFE] py-20">
        <div className="mx-auto max-w-lg rounded-2xl bg-white p-10 text-center shadow-[0_6px_24px_rgba(10,90,132,0.08)]">
          <h1 className="text-xl font-extrabold text-slate-900">Vui lòng đăng nhập</h1>
          <p className="mt-3 text-sm text-slate-600">
            Bạn cần đăng nhập để xem lịch sử khám bệnh và quản lý lịch hẹn.
          </p>
          <Link
            href="/login"
            className="mt-6 inline-flex rounded-full bg-[#0A5A84] px-7 py-3 text-xs font-bold text-white transition hover:bg-[#08486B]"
          >
            Đăng nhập
          </Link>
        </div>
      </section>
    );
  }

  const noResult = tab === "upcoming" ? list.length === 0 : history.length === 0;

  const card = (a: Appointment) =>
    now && (
      <AppointmentCard
        key={a.code}
        appt={a}
        now={now}
        onDetail={(x) => setDetailCode(x.code)}
        onQr={(x) => setQrCode(x.code)}
        onReschedule={(x) => setRescheduleCode(x.code)}
        onCancel={(x) => setCancelCode(x.code)}
      />
    );

  return (
    <section className="bg-gradient-to-b from-[#EAF3FD] to-[#F6FAFE] pb-16">
      <div className="mx-auto max-w-7xl px-4">
        {/* Breadcrumb */}
        <nav aria-label="Breadcrumb" className="pt-5 text-xs text-slate-500">
          <ol className="flex flex-wrap items-center gap-1.5">
            <li>
              <Link href="/" className="flex items-center gap-1 hover:text-[#0A5A84]">
                <Home className="h-3.5 w-3.5" />
                Trang chủ
              </Link>
            </li>
            <ChevronRight className="h-3 w-3" />
            <li>
              <Link href="/ho-so-suc-khoe" className="hover:text-[#0A5A84]">
                Cổng bệnh nhân
              </Link>
            </li>
            <ChevronRight className="h-3 w-3" />
            <li className="font-bold text-[#0A5A84]">Lịch sử khám &amp; Lịch hẹn</li>
          </ol>
        </nav>

        {/* Tiêu đề */}
        <div className="mt-5 flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="flex flex-wrap items-center gap-3 text-3xl font-extrabold text-slate-900 md:text-4xl">
              Lịch Sử Khám Bệnh &amp; Quản Lý Lịch Hẹn
              <span className="inline-flex items-center gap-1 rounded-full bg-blue-100 px-2.5 py-1 text-[10px] font-bold text-[#0A5A84]">
                <ShieldCheck className="h-3 w-3" />
                Hồ sơ {user.pid}
              </span>
            </h1>
            <p className="mt-2 max-w-2xl text-xs leading-relaxed text-slate-500">
              Theo dõi hồ sơ điều trị, toa thuốc điện tử và chủ động quản lý, dời hoặc hủy các lịch
              khám sắp tới với chính sách hoàn hủy minh bạch.
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <button
              type="button"
              // TODO: gọi API xuất EMR (PDF) của bệnh nhân
              className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-5 py-3 text-xs font-bold text-[#0A5A84] shadow-sm transition hover:bg-blue-50"
            >
              <Download className="h-4 w-4" />
              Xuất dữ liệu EMR (PDF)
            </button>
            <Link
              href="/dat-lich"
              className="inline-flex items-center gap-2 rounded-full bg-[#0A5A84] px-5 py-3 text-xs font-bold text-white shadow transition hover:bg-[#08486B]"
            >
              <Plus className="h-4 w-4" />
              Đặt lịch khám mới
            </Link>
          </div>
        </div>

        {notice && (
          <p
            role="status"
            className="mt-4 flex items-center gap-2 rounded-xl bg-emerald-50 px-4 py-3 text-xs font-bold text-emerald-700"
          >
            <Check className="h-4 w-4" />
            {notice}
          </p>
        )}

        {/* Tab + bộ lọc */}
        <div className="mt-7 flex flex-wrap items-center justify-between gap-4">
          <div className="flex rounded-2xl bg-blue-100/70 p-1.5" role="tablist">
            {(
              [
                { key: "upcoming", label: "Lịch khám sắp tới", count: upcomingCount, icon: CalendarCheck },
                { key: "history", label: "Lịch sử khám & Lịch hẹn", count: historyCount, icon: History },
              ] as const
            ).map(({ key, label, count, icon: Ico }) => {
              const active = tab === key;
              return (
                <button
                  key={key}
                  type="button"
                  role="tab"
                  aria-selected={active}
                  onClick={() => setTab(key)}
                  className={`flex items-center gap-2 rounded-xl px-4 py-2.5 text-xs font-bold transition ${
                    active ? "bg-[#0A5A84] text-white shadow" : "text-slate-600 hover:text-[#0A5A84]"
                  }`}
                >
                  <Ico className="h-4 w-4" />
                  {label}
                  <span
                    className={`rounded-full px-2 py-0.5 text-[10px] ${
                      active ? "bg-white text-[#0A5A84]" : "bg-white/80 text-slate-600"
                    }`}
                  >
                    {count}
                  </span>
                </button>
              );
            })}
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <div className="flex items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2.5 focus-within:border-[#2B6CB0] focus-within:ring-2 focus-within:ring-[#2B6CB0]/20">
              <Search className="h-4 w-4 text-slate-400" />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Tìm BS, chuyên khoa, mã phiếu..."
                aria-label="Tìm kiếm lịch hẹn"
                className="w-48 bg-transparent text-xs text-slate-800 outline-none placeholder:text-slate-400"
              />
            </div>
            <select
              aria-label="Lọc theo thời gian"
              value={range}
              onChange={(e) => setRange(e.target.value as Range)}
              className={selectCls}
            >
              <option value="all">Thời gian: Tất cả</option>
              <option value="30">30 ngày</option>
              <option value="90">3 tháng</option>
              <option value="180">6 tháng</option>
            </select>
            <select
              aria-label="Lọc theo chuyên khoa"
              value={specialty}
              onChange={(e) => setSpecialty(e.target.value)}
              className={selectCls}
            >
              <option value="all">Khoa: Tất cả chuyên khoa</option>
              {specialties.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Chính sách */}
        <div className="mt-5 flex flex-wrap items-center justify-between gap-2 rounded-xl border border-blue-100 bg-blue-50/80 px-4 py-3 text-xs text-slate-700">
          <span className="flex items-center gap-2">
            <ShieldCheck className="h-4 w-4 shrink-0 text-[#2B6CB0]" />
            <span>
              <b className="text-[#0A5A84]">Chính sách đặt khám thông minh:</b> Đổi lịch miễn phí
              trước 2 tiếng. Hoàn 100% tạm ứng viện phí trong 24h nếu gửi yêu cầu hủy trước 24 giờ.
            </span>
          </span>
          <Link
            href="/chinh-sach-huy-lich"
            className="inline-flex items-center gap-1 font-bold text-[#0A5A84] hover:underline"
          >
            Xem chi tiết
            <ChevronRight className="h-3 w-3" />
          </Link>
        </div>

        {/* Danh sách */}
        <div className="mt-6 space-y-5">
          {!now ? (
            <div className="h-64 animate-pulse rounded-2xl bg-white/70" />
          ) : noResult ? (
            <div className="rounded-2xl bg-white px-6 py-16 text-center shadow-[0_6px_24px_rgba(10,90,132,0.08)]">
              <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-blue-50 text-[#2B6CB0]">
                <Calendar className="h-6 w-6" />
              </span>
              <p className="mt-4 text-sm font-bold text-slate-800">
                {tab === "upcoming" ? "Bạn chưa có lịch khám sắp tới" : "Không có lịch hẹn phù hợp"}
              </p>
              <p className="mt-1 text-xs text-slate-500">
                Thử thay đổi bộ lọc hoặc đặt một lịch khám mới.
              </p>
              <Link
                href="/dat-lich"
                className="mt-5 inline-flex rounded-full bg-[#0A5A84] px-6 py-2.5 text-xs font-bold text-white transition hover:bg-[#08486B]"
              >
                Đặt lịch khám mới
              </Link>
            </div>
          ) : tab === "upcoming" ? (
            list.map((a) => card(a))
          ) : (
            history.map((e) =>
              "record" in e ? <RecordCard key={e.key} record={e.record} /> : card(e.appt),
            )
          )}
        </div>
      </div>

      {/* Card bảo mật (phía trên footer) */}
      <div className="mx-auto mt-10 max-w-7xl px-4">
        <SecurityNotice />
      </div>

      {/* Popup */}
      {now && detail && <DetailModal appt={detail} now={now} onClose={() => setDetailCode(null)} />}
      {now && qr && <QrModal appt={qr} now={now} onClose={() => setQrCode(null)} />}
      {now && reschedule && (
        <RescheduleModal
          appt={reschedule}
          now={now}
          onClose={() => setRescheduleCode(null)}
          onConfirm={confirmReschedule}
        />
      )}
      {now && cancel && (
        <CancelModal
          appt={cancel}
          now={now}
          onClose={() => setCancelCode(null)}
          onConfirm={confirmCancel}
        />
      )}
    </section>
  );
}