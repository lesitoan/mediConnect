"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  Calendar,
  CalendarCheck,
  Check,
  ChevronRight,
  History,
  Home,
  Plus,
  Search,
  Star,
  X,
} from "@/components/layout/icons";
import SecurityNotice from "@/components/layout/SecurityNotice";
import { useAuth } from "@/features/auth/useAuth";
import ReviewForm from "@/features/review/components/ReviewForm";
import VisitSummaryCard from "@/features/review/components/VisitSummaryCard";
import { getVisit } from "@/features/review/data";
import { getReview, type ReviewDetails } from "@/features/review/services/reviewsService";
import {
  getMyConsultation,
  type ConsultationMedicalRecord,
} from "@/features/medical-records/services/medicalRecordsService";
import type { Appointment } from "../data";
import {
  ApiRequestError,
  cancelAppointment,
  getMyAppointments,
  getMyScheduleProposals,
  rescheduleAppointment,
  respondToScheduleProposal,
  type ScheduleProposal,
} from "../services/appointmentsService";
import AppointmentHistoryCard from "./AppointmentHistoryCard";
import ConsultationRecordModal from "./ConsultationRecordModal";
import {
  CancelModal,
  DetailModal,
  QrModal,
  RescheduleModal,
} from "./AppointmentModals";
import { startOf } from "./dateUtils";

type Tab = "upcoming" | "history";
type Range = "all" | "30" | "90" | "180";

const selectCls =
  "rounded-full border border-slate-200 bg-white px-4 py-2.5 text-xs font-semibold text-slate-700 outline-none transition focus:border-[#2B6CB0] focus:ring-2 focus:ring-[#2B6CB0]/20";

function isUpcomingAppointment(appointment: Appointment, now: Date): boolean {
  return (
    (appointment.kind === "confirmed" ||
      appointment.kind === "followup" ||
      appointment.kind === "pending") &&
    startOf(appointment, now).getTime() >= now.getTime()
  );
}

export default function AppointmentHistoryPage() {
  const { user, ready } = useAuth();

  // `now` chỉ có sau khi mount để tránh lệch hydration
  const [now, setNow] = useState<Date | null>(null);
  useEffect(() => {
    const frame = requestAnimationFrame(() => setNow(new Date()));
    return () => cancelAnimationFrame(frame);
  }, []);

  const [items, setItems] = useState<Appointment[]>([]);
  const [scheduleProposals, setScheduleProposals] = useState<ScheduleProposal[]>([]);
  const [respondingProposalId, setRespondingProposalId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [reloadKey, setReloadKey] = useState(0);
  const [tab, setTab] = useState<Tab>("upcoming");
  const [query, setQuery] = useState("");
  const [range, setRange] = useState<Range>("all");
  const [specialty, setSpecialty] = useState("all");

  useEffect(() => {
    if (!ready || !user) return;
    let isCurrent = true;
    Promise.all([getMyAppointments(), getMyScheduleProposals()])
      .then(([appointments, proposals]) => {
        if (!isCurrent) return;
        setItems(appointments);
        setScheduleProposals(proposals);
      })
      .catch((error: unknown) => {
        if (!isCurrent) return;
        if (error instanceof ApiRequestError && error.status === 401) {
          setLoadError("Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.");
        } else {
          setLoadError(
            error instanceof Error
              ? error.message
              : "Không thể tải lịch hẹn. Vui lòng thử lại.",
          );
        }
      })
      .finally(() => {
        if (isCurrent) setIsLoading(false);
      });
    return () => {
      isCurrent = false;
    };
  }, [ready, user, reloadKey]);

  const reloadAppointments = () => {
    setIsLoading(true);
    setLoadError(null);
    setReloadKey((key) => key + 1);
  };

  // Popup (lưu mã phiếu để luôn lấy dữ liệu mới nhất trong `items`)
  const [detailCode, setDetailCode] = useState<string | null>(null);
  const [qrCode, setQrCode] = useState<string | null>(null);
  const [rescheduleCode, setRescheduleCode] = useState<string | null>(null);
  const [cancelCode, setCancelCode] = useState<string | null>(null);
  const [reviewCode, setReviewCode] = useState<string | null>(null);
  const [reviewVisit, setReviewVisit] = useState<Awaited<ReturnType<typeof getVisit>>>(null);
  const [reviewDetails, setReviewDetails] = useState<ReviewDetails | null>(null);
  const [isReviewEditing, setIsReviewEditing] = useState(false);
  const [isReviewLoading, setIsReviewLoading] = useState(false);
  const [reviewError, setReviewError] = useState<string | null>(null);
  const [medicalRecordId, setMedicalRecordId] = useState<string | null>(null);
  const [medicalRecord, setMedicalRecord] = useState<ConsultationMedicalRecord | null>(null);
  const [isMedicalRecordLoading, setIsMedicalRecordLoading] = useState(false);
  const [medicalRecordError, setMedicalRecordError] = useState<string | null>(null);

  useEffect(() => {
    if (!medicalRecordId) return;
    let isCurrent = true;
    setMedicalRecord(null);
    setMedicalRecordError(null);
    setIsMedicalRecordLoading(true);
    getMyConsultation(medicalRecordId)
      .then((record) => {
        if (isCurrent) setMedicalRecord(record);
      })
      .catch((error: unknown) => {
        if (isCurrent) {
          setMedicalRecordError(
            error instanceof Error ? error.message : "Không thể tải hồ sơ bệnh án.",
          );
        }
      })
      .finally(() => {
        if (isCurrent) setIsMedicalRecordLoading(false);
      });
    return () => {
      isCurrent = false;
    };
  }, [medicalRecordId]);

  useEffect(() => {
    if (!reviewCode) {
      return;
    }

    let isCurrent = true;
    getVisit(reviewCode)
      .then(async (visit) => {
        if (isCurrent) setReviewVisit(visit);
        if (visit?.alreadyReviewed && visit.consultationId) {
          const details = await getReview(visit.consultationId);
          if (!details) throw new Error("Không tìm thấy chi tiết đánh giá.");
          if (isCurrent) setReviewDetails(details);
        }
      })
      .catch((error: unknown) => {
        if (isCurrent) {
          setReviewVisit(null);
          setReviewError(
            error instanceof Error ? error.message : "Không thể tải thông tin phiên khám.",
          );
        }
      })
      .finally(() => {
        if (isCurrent) setIsReviewLoading(false);
      });

    return () => {
      isCurrent = false;
    };
  }, [reviewCode]);

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
    () => Array.from(new Set(items.map((item) => item.doctor.specialty))),
    [items],
  );

  const upcomingCount = now
    ? items.filter((appointment) =>
        isUpcomingAppointment(appointment, now),
      ).length
    : 0;
  const historyCount = items.length - upcomingCount;

  const list = useMemo(() => {
    if (!now || tab !== "upcoming") return [];
    const q = query.trim().toLowerCase();
    return items
      .filter((appointment) => isUpcomingAppointment(appointment, now))
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

  const history = useMemo<Appointment[]>(() => {
    if (tab !== "history") return [];
    const q = query.trim().toLowerCase();
    return items
      .filter(
        (a) =>
          now !== null &&
          !isUpcomingAppointment(a, now) &&
          (specialty === "all" || a.doctor.specialty === specialty) &&
          (!q ||
            a.doctor.name.toLowerCase().includes(q) ||
            a.doctor.specialty.toLowerCase().includes(q) ||
            a.code.toLowerCase().includes(q)),
      )
      .filter((appointment) =>
        range === "all" || Math.abs(appointment.daysFromNow) <= Number(range),
      )
      .sort(
        (a, b) =>
          startOf(b, now!).getTime() - startOf(a, now!).getTime(),
      );
  }, [tab, items, query, range, specialty, now]);

  const confirmCancel = async () => {
    if (!cancel?.id) return;
    await cancelAppointment(cancel.id);
    setCancelCode(null);
    reloadAppointments();
    flash(`Đã hủy lịch khám #${cancel.code} thành công.`);
  };

  const confirmReschedule = async (newAppointmentSlotId: string) => {
    if (!reschedule?.id) return;
    await rescheduleAppointment(reschedule.id, newAppointmentSlotId);
    setRescheduleCode(null);
    reloadAppointments();
    flash(`Đã đổi lịch khám #${reschedule.code} thành công.`);
  };

  const respondToProposal = async (
    proposal: ScheduleProposal,
    decision: "ACCEPT" | "REJECT",
  ) => {
    setRespondingProposalId(proposal.id);
    try {
      await respondToScheduleProposal(proposal.id, decision);
      flash(
        decision === "ACCEPT"
          ? "Đã xác nhận phương án xử lý lịch hẹn."
          : "Đã từ chối phương án; phòng khám sẽ gửi đề xuất khác.",
      );
      reloadAppointments();
    } catch (error) {
      flash(
        error instanceof Error
          ? error.message
          : "Không thể phản hồi phương án lịch hẹn.",
      );
    } finally {
      setRespondingProposalId(null);
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
  const completedHistory = history.filter((appointment) => appointment.kind === "completed");
  const cancelledHistory = history.filter((appointment) => appointment.kind === "cancelled");
  const otherHistory = history.filter(
    (appointment) => appointment.kind !== "completed" && appointment.kind !== "cancelled",
  );

  const card = (a: Appointment) =>
    now && (
      <AppointmentHistoryCard
        key={a.code}
        appt={a}
        now={now}
        onDetail={(x) => setDetailCode(x.code)}
        onQr={(x) => setQrCode(x.code)}
        onReschedule={(x) => setRescheduleCode(x.code)}
        onCancel={(x) => setCancelCode(x.code)}
        onReview={(x) => {
          setReviewVisit(null);
          setReviewDetails(null);
          setIsReviewEditing(false);
          setIsReviewLoading(true);
          setReviewError(null);
          setReviewCode(x.code);
        }}
        onMedicalRecord={(x) => {
          if (!x.consultationId) return;
          setMedicalRecordId(x.consultationId);
        }}
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
            <h1 className="flex flex-wrap items-center gap-3 text-3xl font-extrabold text-[#102B55] md:text-4xl">
              <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[#DCEEFF] text-[#0A5A84] shadow-sm">
                <Calendar className="h-7 w-7" />
              </span>
              {tab === "upcoming" ? "Lịch khám sắp tới" : "Lịch sử lịch hẹn"}
            </h1>
            <p className="mt-2 max-w-3xl text-xs leading-relaxed text-slate-500">
              <b className="text-[#0A5A84]">Chính sách đặt khám thông minh:</b>{" "}
              Đổi lịch miễn phí trước 2 tiếng. Hoàn 100% tạm ứng viện phí trong 24h nếu gửi yêu cầu hủy trước 24 giờ.
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
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

        {scheduleProposals.length > 0 && (
          <section
            aria-labelledby="schedule-proposals-heading"
            className="mt-6 space-y-3 rounded-2xl border border-amber-200 bg-amber-50 p-4 sm:p-5"
          >
            <div>
              <h2
                id="schedule-proposals-heading"
                className="text-base font-extrabold text-slate-900"
              >
                Phương án lịch hẹn cần xác nhận
              </h2>
              <p className="mt-1 text-xs text-slate-600">
                Lịch nghỉ của bác sĩ chỉ được duyệt sau khi bạn phản hồi từng phương án.
              </p>
            </div>
            {scheduleProposals.map((proposal) => {
              const reassignment = proposal.reassignments[0];
              const replacementSlot = reassignment?.toSlot;
              const startsAt = replacementSlot?.startsAt;
              const replacementDoctor =
                replacementSlot?.doctorSchedule.doctor;
              const originalSlot = proposal.careSession.appointmentSlot;
              const dateTime = startsAt
                ? new Intl.DateTimeFormat("vi-VN", {
                    dateStyle: "full",
                    timeStyle: "short",
                    timeZone: "Asia/Ho_Chi_Minh",
                  }).format(new Date(startsAt))
                : null;
              return (
                <article
                  key={proposal.id}
                  className="rounded-xl border border-amber-200 bg-white p-4"
                >
                  <p className="text-sm font-bold text-slate-900">
                    Lịch hẹn #{proposal.careSession.appointment.appointmentCode}
                  </p>
                  {proposal.resolution === "CANCELLED" ? (
                    <p className="mt-1 text-sm text-slate-700">
                      Phòng khám đề xuất hủy lịch này.
                    </p>
                  ) : (
                    <div className="mt-1 text-sm text-slate-700">
                      <p>
                        Phòng khám đề xuất {dateTime ?? "đổi lịch"} với{" "}
                        {replacementDoctor?.user.fullName ?? "bác sĩ thay thế"}.
                      </p>
                      {replacementDoctor?.specialty.name && (
                        <p className="text-xs text-slate-500">
                          {replacementDoctor.specialty.name}
                        </p>
                      )}
                    </div>
                  )}
                  {originalSlot && (
                    <p className="mt-1 text-xs text-slate-500">
                      Lịch cũ:{" "}
                      {new Intl.DateTimeFormat("vi-VN", {
                        dateStyle: "short",
                        timeStyle: "short",
                        timeZone: "Asia/Ho_Chi_Minh",
                      }).format(new Date(originalSlot.startsAt))}
                    </p>
                  )}
                  {proposal.reason && (
                    <p className="mt-2 text-xs text-slate-600">
                      Ghi chú: {proposal.reason}
                    </p>
                  )}
                  <div className="mt-3 flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={() => void respondToProposal(proposal, "ACCEPT")}
                      disabled={respondingProposalId === proposal.id}
                      className="rounded-full bg-[#0A5A84] px-4 py-2 text-xs font-bold text-white disabled:opacity-60"
                    >
                      {proposal.resolution === "CANCELLED"
                        ? "Xác nhận hủy lịch"
                        : "Đồng ý phương án"}
                    </button>
                    <button
                      type="button"
                      onClick={() => void respondToProposal(proposal, "REJECT")}
                      disabled={respondingProposalId === proposal.id}
                      className="rounded-full border border-slate-300 px-4 py-2 text-xs font-bold text-slate-700 disabled:opacity-60"
                    >
                      Từ chối phương án
                    </button>
                  </div>
                </article>
              );
            })}
          </section>
        )}

        {/* Tab + bộ lọc */}
        <div className="mt-6 flex flex-col gap-3">
          <div className="flex rounded-2xl bg-blue-100/70 p-1.5" role="tablist">
            {(
              [
                { key: "upcoming", label: "Lịch khám sắp tới", count: upcomingCount, icon: CalendarCheck },
                { key: "history", label: "Lịch sử lịch hẹn", count: historyCount, icon: History },
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

          <div className="flex flex-wrap items-center gap-2.5 rounded-2xl border border-blue-100 bg-white/80 p-3 shadow-[0_4px_14px_rgba(28,79,132,0.06)]">
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

        {/* Danh sách */}
        <div className="mt-6 space-y-5 rounded-3xl border border-blue-100 bg-white/55 p-3 shadow-[0_8px_26px_rgba(28,79,132,0.08)] sm:p-4">
          {!now || isLoading ? (
            <div className="h-64 animate-pulse rounded-2xl bg-white/70" />
          ) : loadError ? (
            <div className="rounded-2xl bg-white px-6 py-12 text-center shadow-[0_6px_24px_rgba(10,90,132,0.08)]">
              <p role="alert" className="text-sm font-bold text-red-700">
                {loadError}
              </p>
              <div className="mt-5 flex justify-center gap-3">
                <button
                  type="button"
                  onClick={reloadAppointments}
                  className="rounded-full bg-[#0A5A84] px-6 py-2.5 text-xs font-bold text-white"
                >
                  Tải lại
                </button>
                {loadError.includes("đăng nhập lại") && (
                  <Link
                    href="/login"
                    className="rounded-full border border-slate-200 px-6 py-2.5 text-xs font-bold text-slate-700"
                  >
                    Đăng nhập
                  </Link>
                )}
              </div>
            </div>
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
            <div className="space-y-4">
              {completedHistory.length > 0 && (
                <section className="rounded-2xl border border-emerald-100 bg-white/70 p-3 sm:p-4">
                  <h2 className="mb-3 flex items-center gap-2 px-1 text-sm font-extrabold text-[#16345E]">
                    <span className="flex h-6 w-6 items-center justify-center rounded-full bg-emerald-500 text-white">
                      <Check className="h-4 w-4" />
                    </span>
                    Đã hoàn thành ({completedHistory.length})
                  </h2>
                  <div className="space-y-3">{completedHistory.map((appointment) => card(appointment))}</div>
                </section>
              )}
              {cancelledHistory.length > 0 && (
                <section className="rounded-2xl border border-red-100 bg-white/70 p-3 sm:p-4">
                  <h2 className="mb-3 flex items-center gap-2 px-1 text-sm font-extrabold text-[#16345E]">
                    <span className="flex h-6 w-6 items-center justify-center rounded-full bg-red-500 text-white">
                      <X className="h-4 w-4" />
                    </span>
                    Đã hủy ({cancelledHistory.length})
                  </h2>
                  <div className="space-y-3">{cancelledHistory.map((appointment) => card(appointment))}</div>
                </section>
              )}
              {otherHistory.length > 0 && (
                <section className="space-y-3">{otherHistory.map((appointment) => card(appointment))}</section>
              )}
            </div>
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
          key={reschedule.id}
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
      {reviewCode && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="review-modal-title"
          className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/50 px-4 py-8"
        >
          <div className="mx-auto max-w-6xl rounded-3xl bg-[#F6FAFE] p-4 shadow-2xl sm:p-6">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.16em] text-[#2B6CB0]">
                  Phiên khám đã hoàn tất
                </p>
                <h2 id="review-modal-title" className="mt-1 text-2xl font-extrabold text-slate-900">
                  Đánh giá phiên khám
                </h2>
                <p className="mt-1 text-sm text-slate-500">
                  Kiểm tra thông tin phiên khám trước khi gửi đánh giá của bạn.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setReviewCode(null)}
                aria-label="Đóng cửa sổ đánh giá"
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-500 transition hover:bg-slate-50"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {isReviewLoading ? (
              <div className="mt-6 h-96 animate-pulse rounded-2xl bg-white" />
            ) : reviewError ? (
              <p role="alert" className="mt-6 rounded-2xl bg-red-50 p-5 text-sm font-semibold text-red-700">
                {reviewError}
              </p>
            ) : reviewVisit ? (
              <div className="mt-6 grid items-start gap-6 lg:grid-cols-[320px_minmax(0,1fr)]">
                <VisitSummaryCard visit={reviewVisit} />
                {reviewVisit.alreadyReviewed ? (
                  isReviewEditing ? (
                    <ReviewForm
                      visit={reviewVisit}
                      review={reviewDetails ?? undefined}
                      onSubmitted={async () => {
                        if (!reviewVisit.consultationId) return;
                        const details = await getReview(reviewVisit.consultationId);
                        setReviewDetails(details);
                        setIsReviewEditing(false);
                        reloadAppointments();
                        flash("Đã cập nhật đánh giá phiên khám thành công.");
                      }}
                    />
                  ) : reviewDetails ? (
                    <div className="rounded-2xl bg-white p-6 shadow-[0_6px_24px_rgba(10,90,132,0.08)]">
                      <div className="flex flex-wrap items-start justify-between gap-4">
                        <div>
                          <p className="text-xs font-bold uppercase tracking-[0.14em] text-[#2B6CB0]">
                            Đánh giá của bạn
                          </p>
                          <h3 className="mt-1 text-xl font-extrabold text-slate-900">
                            Chi tiết đánh giá phiên khám
                          </h3>
                        </div>
                        {reviewDetails.canEdit && (
                          <button
                            type="button"
                            onClick={() => setIsReviewEditing(true)}
                            className="rounded-full bg-[#0A5A84] px-4 py-2 text-xs font-bold text-white transition hover:bg-[#08486B]"
                          >
                            Sửa đánh giá
                          </button>
                        )}
                      </div>
                      <div className="mt-6 grid gap-3 sm:grid-cols-2">
                        <div className="rounded-xl bg-blue-50/70 p-4">
                          <p className="text-xs font-semibold text-slate-500">Đánh giá bác sĩ</p>
                          <p className="mt-1 flex items-center gap-2 text-2xl font-extrabold text-[#0A5A84]">
                            {reviewDetails.doctorRating}/5
                            <Star className="h-5 w-5 fill-amber-400 text-amber-400" />
                          </p>
                        </div>
                        <div className="rounded-xl bg-blue-50/70 p-4">
                          <p className="text-xs font-semibold text-slate-500">Đánh giá dịch vụ</p>
                          <p className="mt-1 flex items-center gap-2 text-2xl font-extrabold text-[#0A5A84]">
                            {reviewDetails.serviceRating}/5
                            <Star className="h-5 w-5 fill-amber-400 text-amber-400" />
                          </p>
                        </div>
                      </div>
                      <div className="mt-4 rounded-xl border border-slate-100 bg-slate-50 p-4">
                        <p className="text-xs font-semibold text-slate-500">Nhận xét</p>
                        <p className="mt-2 whitespace-pre-wrap text-sm leading-relaxed text-slate-700">
                          {reviewDetails.comment || "Bạn chưa để lại nhận xét."}
                        </p>
                      </div>
                      <p className="mt-4 text-xs text-slate-400">
                        Bạn còn {reviewDetails.canEdit ? 1 : 0} lần chỉnh sửa đánh giá.
                      </p>
                    </div>
                  ) : (
                    <div className="h-72 animate-pulse rounded-2xl bg-white" />
                  )
                ) : (
                  <ReviewForm
                    visit={reviewVisit}
                    onSubmitted={() => {
                      setReviewCode(null);
                      reloadAppointments();
                      flash("Đã gửi đánh giá phiên khám thành công.");
                    }}
                  />
                )}
              </div>
            ) : (
              <p className="mt-6 rounded-2xl bg-white p-5 text-sm text-slate-600">
                Không tìm thấy phiên khám cần đánh giá.
              </p>
            )}
          </div>
        </div>
      )}
      {medicalRecordId && (
        <ConsultationRecordModal
          record={medicalRecord}
          isLoading={isMedicalRecordLoading}
          error={medicalRecordError}
          onClose={() => setMedicalRecordId(null)}
        />
      )}
    </section>
  );
}
