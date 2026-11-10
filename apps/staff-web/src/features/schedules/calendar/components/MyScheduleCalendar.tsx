"use client";

import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Empty } from "@/components/ui/Empty";
import { Loading } from "@/components/shared/Loading";
import { addCalendarDays, getVietnamDate } from "@/lib/dateUtils";
import { useGetMyScheduleMatrixQuery } from "../services/schedulesApi";
import type { ScheduleDateRange, WorkScheduleMatrixResponse } from "../types/scheduleTypes";
import { LeaveRequestDialog } from "./LeaveRequestDialog";

interface MyScheduleCalendarProps {
  user: { id: string; name?: string; role: string };
}

type LeaveRequestKind = "PLANNED_LEAVE" | "URGENT_ABSENCE";

interface LeaveSelection {
  type: LeaveRequestKind;
  startsAt: string;
  endsAt: string;
}

type ScheduleShiftSummary = WorkScheduleMatrixResponse["staff"][number]["shifts"][number];

const WEEKDAY_LABELS = ["Thứ 2", "Thứ 3", "Thứ 4", "Thứ 5", "Thứ 6", "Thứ 7", "Chủ nhật"];
const DAY_FORMATTER = new Intl.DateTimeFormat("vi-VN", { weekday: "short", day: "2-digit", month: "2-digit", timeZone: "UTC" });
const DATE_FORMATTER = new Intl.DateTimeFormat("vi-VN", { day: "numeric", month: "long", year: "numeric", timeZone: "UTC" });

function getMonday(date: string) {
  const day = new Date(`${date}T12:00:00Z`).getUTCDay();
  return addCalendarDays(date, day === 0 ? -6 : 1 - day);
}

function formatTime(value: string) {
  return new Intl.DateTimeFormat("vi-VN", { timeZone: "Asia/Ho_Chi_Minh", hour: "2-digit", minute: "2-digit", hourCycle: "h23" }).format(new Date(value));
}

function ShiftCard({ shift, shiftKey, isSelected, onSelect }: { shift: ScheduleShiftSummary | null; shiftKey: "MORNING" | "AFTERNOON"; isSelected: boolean; onSelect: (shift: ScheduleShiftSummary) => void }) {
  const isMorning = (shift?.key ?? shiftKey) === "MORNING";
  const isAbsent = shift?.status === "ABSENT";
  const isPast = shift ? new Date(shift.endsAt).getTime() <= Date.now() : false;
  const cardClassName = `flex h-full min-h-0 min-w-0 w-full flex-col overflow-hidden rounded-app-lg border p-3 text-left transition ${isPast ? "cursor-not-allowed border-border bg-muted/10 opacity-60" : isAbsent ? "cursor-not-allowed border-destructive/30 bg-destructive/10" : isSelected ? "border-primary bg-primary-light/40 ring-2 ring-primary/30" : "border-border bg-surface hover:border-primary/50 hover:bg-primary-light/20"}`;

  if (!shift) {
    return <div className={`${cardClassName} cursor-default`}><div className="flex min-w-0 flex-wrap items-start justify-between gap-2"><div className="min-w-0"><h3 className="text-body font-bold">{isMorning ? "Ca sáng" : "Ca chiều"}</h3><p className="text-caption text-muted">{isMorning ? "08:00–12:00" : "13:00–18:00"}</p></div><span className="shrink-0 rounded-full bg-muted/15 px-2 py-0.5 text-label font-semibold text-muted">Không có lịch</span></div><p className="mt-3 text-caption text-muted">Ca này chưa được gán</p></div>;
  }

  return <button type="button" className={`${cardClassName} ${isPast || isAbsent ? "cursor-not-allowed" : "cursor-pointer"}`} aria-pressed={isSelected} disabled={isPast || isAbsent} onClick={() => onSelect(shift)}><div className="flex min-w-0 flex-wrap items-start justify-between gap-2"><div className="min-w-0"><h3 className="text-body font-bold">{isMorning ? "Ca sáng" : "Ca chiều"}</h3><p className="text-caption text-muted">{formatTime(shift.startsAt)}–{formatTime(shift.endsAt)}</p></div><span className={`shrink-0 rounded-full px-2 py-0.5 text-label font-semibold ${isAbsent ? "bg-destructive/15 text-destructive" : isPast ? "bg-muted/15 text-muted" : "bg-primary-light text-primary"}`}>{isAbsent ? "Đã vắng" : isPast ? "Đã kết thúc" : "Có lịch"}</span></div><p className="mt-3 text-caption text-muted">{shift.slotCapacity ? `${shift.slotCount}/${shift.slotCapacity} slot đã được đặt` : "Ca này không có slot khám"}</p></button>;
}

export function MyScheduleCalendar({ user }: MyScheduleCalendarProps) {
  const [weekStart, setWeekStart] = useState(() => getMonday(getVietnamDate()));
  const [selectedShift, setSelectedShift] = useState<ScheduleShiftSummary | null>(null);
  const [leaveSelection, setLeaveSelection] = useState<LeaveSelection | null>(null);
  const dateRange = useMemo<ScheduleDateRange>(() => ({ startDate: weekStart, endDate: addCalendarDays(weekStart, 6) }), [weekStart]);
  const { currentData, isLoading, isFetching, isError, refetch } = useGetMyScheduleMatrixQuery(dateRange);
  const staff = currentData?.staff.find((item) => item.userId === user.id);
  const dates = useMemo(() => Array.from({ length: 7 }, (_, index) => addCalendarDays(weekStart, index)), [weekStart]);

  const openLeaveRequest = (type: LeaveRequestKind) => {
    const hasValidSelectedShift = selectedShift && selectedShift.status !== "ABSENT" && new Date(selectedShift.endsAt).getTime() > Date.now();
    setLeaveSelection({ type, startsAt: hasValidSelectedShift ? selectedShift.startsAt : "", endsAt: hasValidSelectedShift ? selectedShift.endsAt : "" });
  };
  const changeWeek = (offset: number) => { setSelectedShift(null); setWeekStart(addCalendarDays(weekStart, offset)); };

  return <section className="mx-auto flex min-h-[calc(100dvh-8rem)] w-full max-w-7xl flex-col gap-3 overflow-hidden pb-2"><header className="flex shrink-0 flex-wrap items-end justify-between gap-3"><div><h1 className="text-display font-bold tracking-tight">Lịch làm việc của tôi</h1><p className="mt-1 text-body text-muted">{user.name ?? "Nhân viên"} · Lịch được gán trong tuần</p></div><div className="flex flex-wrap items-center justify-end gap-2">{selectedShift && <span className="text-caption text-muted">Đã chọn: {selectedShift.key === "MORNING" ? "Ca sáng" : "Ca chiều"}</span>}<Button type="button" variant="outline" onClick={() => openLeaveRequest("PLANNED_LEAVE")}>Xin nghỉ phép</Button><Button type="button" onClick={() => openLeaveRequest("URGENT_ABSENCE")}>Báo vắng đột xuất</Button></div></header><div className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-app-xl border border-border bg-surface p-3 shadow-2xs" aria-busy={isFetching}><div className="mb-3 flex shrink-0 items-center justify-between gap-3"><Button type="button" variant="outline" size="sm" onClick={() => changeWeek(-7)}>Tuần trước</Button><h2 className="text-title text-center font-bold">{DATE_FORMATTER.format(new Date(`${weekStart}T00:00:00Z`))} – {DATE_FORMATTER.format(new Date(`${addCalendarDays(weekStart, 6)}T00:00:00Z`))}</h2><Button type="button" variant="outline" size="sm" onClick={() => changeWeek(7)}>Tuần sau</Button></div>{isLoading ? <Loading label="Đang tải lịch làm việc..." className="min-h-[40vh]" /> : isError ? <Empty role="alert" title="Không thể tải lịch của bạn" description="Vui lòng thử lại." action={<Button type="button" onClick={() => void refetch()} disabled={isFetching}>Thử lại</Button>} /> : !staff ? <Empty title="Chưa có lịch được gán" description="Tài khoản này chưa có lịch làm việc trong tuần đang xem." /> : <div className="grid min-h-0 min-w-0 flex-1 gap-2 xl:grid-cols-[repeat(7,minmax(0,1fr))]">{dates.map((date, index) => { const shifts = staff.shifts.filter((shift) => shift.date === date); const morning = shifts.find((shift) => shift.key === "MORNING") ?? null; const afternoon = shifts.find((shift) => shift.key === "AFTERNOON") ?? null; return <section key={date} className="flex min-h-0 min-w-0 flex-col overflow-hidden rounded-app-lg border border-border bg-secondary/20 p-2"><header className="mb-2 shrink-0 border-b border-border px-1 pb-2"><p className="text-caption font-semibold text-muted">{WEEKDAY_LABELS[index]}</p><p className="text-body font-bold">{DAY_FORMATTER.format(new Date(`${date}T00:00:00Z`))}</p></header><div className="grid min-h-0 flex-1 auto-rows-fr gap-2"><ShiftCard shift={morning} shiftKey="MORNING" isSelected={selectedShift?.startsAt === morning?.startsAt} onSelect={setSelectedShift} /><ShiftCard shift={afternoon} shiftKey="AFTERNOON" isSelected={selectedShift?.startsAt === afternoon?.startsAt} onSelect={setSelectedShift} /></div></section>; })}</div>}</div>{leaveSelection && <LeaveRequestDialog key={`${leaveSelection.type}-${leaveSelection.startsAt}`} requestType={leaveSelection.type} initialStartsAt={leaveSelection.startsAt} initialEndsAt={leaveSelection.endsAt} onClose={() => setLeaveSelection(null)} />}</section>;
}
