"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import {
  Calendar,
  CalendarCheck,
  ChevronRight,
  Download,
  History,
  Home,
  Info,
  Plus,
  QrCode,
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
import AppointmentCard, { startOf } from "./AppointmentCard";
import RecordCard from "./RecordCards";

type Tab = "upcoming" | "history";
type Range = "all" | "30" | "90" | "180";

type HistoryEntry =
  | { key: string; days: number; record: MedicalRecord }
  | { key: string; days: number; appt: Appointment };

const selectCls =
  "rounded-full border border-slate-200 bg-white px-4 py-2.5 text-xs font-semibold text-slate-700 outline-none transition focus:border-[#2B6CB0] focus:ring-2 focus:ring-[#2B6CB0]/20";

function Modal({
  title,
  children,
  onClose,
}: {
  title: string;
  children: React.ReactNode;
  onClose: () => void;
}) {
  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={title}
      className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-900/40 px-4"
      onClick={onClose}
    >
      <div
        className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <h3 className="text-lg font-extrabold text-slate-900">{title}</h3>
        {children}
      </div>
    </div>
  );
}

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
  const [cancelTarget, setCancelTarget] = useState<Appointment | null>(null);
  const [checkinTarget, setCheckinTarget] = useState<Appointment | null>(null);
  const [cancelling, setCancelling] = useState(false);

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
    if (!cancelTarget) return;
    setCancelling(true);
    try {
      // TODO: gọi API hủy lịch (UC06). Backend kiểm tra lại: lịch ở trạng thái Confirmed
      // và còn ≥ 2 giờ trước giờ khám; giải phóng khung giờ, gửi thông báo, ghi Audit Log.
      await new Promise((r) => setTimeout(r, 600));
      setItems((cur) =>
        cur.map((i) => (i.code === cancelTarget.code ? { ...i, kind: "cancelled" } : i)),
      );
      setCancelTarget(null);
    } finally {
      setCancelling(false);
    }
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
          ) : (
            <>
              {tab === "upcoming"
                ? list.map((a) => (
                    <AppointmentCard
                      key={a.code}
                      appt={a}
                      now={now}
                      onCancel={setCancelTarget}
                      onCheckin={setCheckinTarget}
                    />
                  ))
                : history.map((e) =>
                    "record" in e ? (
                      <RecordCard key={e.key} record={e.record} />
                    ) : (
                      <AppointmentCard
                        key={e.key}
                        appt={e.appt}
                        now={now}
                        onCancel={setCancelTarget}
                        onCheckin={setCheckinTarget}
                      />
                    ),
                  )}
            </>
          )}
        </div>
      </div>

      {/* Card bảo mật (phía trên footer) */}
      <div className="mx-auto mt-10 max-w-7xl px-4">
        <SecurityNotice />
      </div>

      {/* Hộp xác nhận hủy (theo SRS: thao tác hủy bắt buộc có bước xác nhận) */}
      {cancelTarget && (
        <Modal title="Xác nhận hủy lịch khám" onClose={() => !cancelling && setCancelTarget(null)}>
          <p className="mt-3 text-sm text-slate-600">
            Bạn sắp hủy phiếu <b>#{cancelTarget.code}</b> với <b>{cancelTarget.doctor.name}</b>. Khung
            giờ sẽ được giải phóng và không thể hoàn tác.
          </p>
          <p className="mt-3 flex items-start gap-2 rounded-lg bg-amber-50 px-3 py-2 text-xs text-slate-700">
            <Info className="mt-0.5 h-4 w-4 shrink-0 text-amber-500" />
            Hủy muộn có thể không được hoàn tiền theo chính sách của phòng khám.
          </p>
          <div className="mt-5 flex gap-3">
            <button
              type="button"
              disabled={cancelling}
              onClick={() => setCancelTarget(null)}
              className="flex-1 rounded-full border border-slate-200 py-2.5 text-xs font-bold text-slate-600 transition hover:bg-slate-50"
            >
              Giữ lịch
            </button>
            <button
              type="button"
              disabled={cancelling}
              onClick={confirmCancel}
              className="flex-1 rounded-full bg-red-600 py-2.5 text-xs font-bold text-white transition hover:bg-red-700 disabled:bg-slate-300"
            >
              {cancelling ? "Đang hủy..." : "Xác nhận hủy"}
            </button>
          </div>
        </Modal>
      )}

      {/* Mã QR check-in */}
      {checkinTarget && (
        <Modal title="Mã QR Check-in" onClose={() => setCheckinTarget(null)}>
          <div className="mt-4 text-center">
            {/* TODO: thay bằng mã QR thật do backend tạo cho phiếu khám */}
            <span className="mx-auto flex h-40 w-40 items-center justify-center rounded-xl border border-dashed border-slate-300 bg-slate-50 text-[#0A5A84]">
              <QrCode className="h-20 w-20" />
            </span>
            <p className="mt-3 text-sm font-extrabold text-slate-900">#{checkinTarget.code}</p>
            <p className="mt-1 text-xs text-slate-500">
              Đưa mã này cho lễ tân khi đến phòng khám. Vui lòng có mặt trước giờ hẹn 15 phút.
            </p>
          </div>
          <button
            type="button"
            onClick={() => setCheckinTarget(null)}
            className="mt-5 w-full rounded-full bg-[#0A5A84] py-2.5 text-xs font-bold text-white transition hover:bg-[#08486B]"
          >
            Đóng
          </button>
        </Modal>
      )}
    </section>
  );
}