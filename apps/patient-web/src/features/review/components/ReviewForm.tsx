"use client";

import Link from "next/link";
import { useState } from "react";
import {
  ArrowLeft,
  Check,
  ClipboardList,
  Clock,
  EyeOff,
  Info,
  MapPin,
  Send,
  Star,
  Stethoscope,
} from "@/components/layout/icons";
import {
  CRITERIA,
  MAX_COMMENT,
  MAX_TAGS,
  MOODS,
  OVERALL_TEXT,
  TAGS,
  type Visit,
} from "../data";
import StarRating from "./StarRating";

const CRITERIA_ICON = {
  doctor: Stethoscope,
  waiting: Clock,
  facility: MapPin,
  guidance: ClipboardList,
} as const;

const card = "rounded-2xl bg-white p-6 shadow-[0_6px_24px_rgba(10,90,132,0.08)]";

function StepHead({
  n,
  title,
  sub,
  right,
}: {
  n: number;
  title: string;
  sub?: string;
  right?: React.ReactNode;
}) {
  return (
    <div className="flex items-start justify-between gap-3">
      <div>
        <p className="text-[10px] font-bold uppercase text-slate-400">Bước {n} trên 3</p>
        <h2 className="mt-1 text-xl font-extrabold text-slate-900">{title}</h2>
        {sub && <p className="mt-1 text-xs text-slate-500">{sub}</p>}
      </div>
      {right}
    </div>
  );
}

export default function ReviewForm({ visit }: { visit: Visit }) {
  const [overall, setOverall] = useState(5);
  const [scores, setScores] = useState<Record<string, number>>(
    Object.fromEntries(CRITERIA.map((c) => [c.key, 5])),
  );
  const [tags, setTags] = useState<string[]>([
    "Bác sĩ tận tâm",
    "Giải thích rõ ràng",
    "Phòng khám hiện đại, sạch sẽ",
  ]);
  const [comment, setComment] = useState("");
  const [anonymous, setAnonymous] = useState(true);
  const [confirming, setConfirming] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState("");

  const toggleTag = (t: string) =>
    setTags((cur) =>
      cur.includes(t) ? cur.filter((x) => x !== t) : cur.length < MAX_TAGS ? [...cur, t] : cur,
    );

  const submit = async () => {
    setSubmitting(true);
    setError("");
    try {
      // TODO: gọi API tạo đánh giá (UC06). Backend kiểm tra: phiên khám thuộc bệnh nhân,
      // đã "Hoàn thành", chưa được đánh giá; lưu lỗi thì rollback; cập nhật điểm TB của bác sĩ.
      await new Promise((r) => setTimeout(r, 700));
      setDone(true);
    } catch {
      setError("Không thể gửi đánh giá lúc này. Vui lòng thử lại.");
    } finally {
      setSubmitting(false);
      setConfirming(false);
    }
  };

  if (done) {
    return (
      <div className={`${card} py-16 text-center`}>
        <span className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100 text-emerald-600">
          <Check className="h-8 w-8" />
        </span>
        <h2 className="mt-5 text-2xl font-extrabold text-slate-900">Cảm ơn bạn đã đánh giá</h2>
        <p className="mx-auto mt-3 max-w-md text-sm text-slate-600">
          Phản hồi của bạn về phiên khám <b>#{visit.code}</b> đã được ghi nhận.
        </p>
        <Link
          href="/lich-su-lich-hen"
          className="mt-6 inline-flex rounded-full bg-[#0A5A84] px-7 py-3 text-xs font-bold text-white transition hover:bg-[#08486B]"
        >
          Về Lịch sử khám
        </Link>
      </div>
    );
  }

  const text = OVERALL_TEXT[overall];

  return (
    <div className="space-y-5">
      {/* Bước 1 */}
      <section className={card}>
        <StepHead n={1} title="Bạn cảm thấy thế nào về phiên khám này?" />
        <div className="mt-5 rounded-2xl border border-slate-100 bg-slate-50/60 p-6 text-center">
          <div className="flex justify-center">
            <StarRating value={overall} onChange={setOverall} size="lg" label="Đánh giá tổng quan" />
          </div>
          <p className="mt-3 text-lg font-extrabold text-slate-900">
            {overall}/5 — {text.title}
          </p>
          <p className="mt-0.5 text-xs text-slate-500">{text.desc}</p>
        </div>

        <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-5">
          {MOODS.map((m) => {
            const active = overall === m.value;
            return (
              <button
                key={m.value}
                type="button"
                aria-pressed={active}
                onClick={() => setOverall(m.value)}
                className={`flex items-center justify-center gap-1.5 rounded-full border px-3 py-2.5 text-xs font-bold transition ${
                  active
                    ? "border-transparent bg-[#0A5A84] text-white shadow"
                    : "border-slate-200 bg-white text-slate-700 hover:bg-blue-50"
                }`}
              >
                <span aria-hidden="true">{m.icon}</span>
                {m.label}
              </button>
            );
          })}
        </div>
      </section>

      {/* Bước 2 */}
      <section className={card}>
        <StepHead
          n={2}
          title="Đánh giá chi tiết tiêu chí chất lượng"
          sub="Chọn số điểm từ 1 đến 5 cho từng mục chuyên môn."
        />
        <ul className="mt-5 space-y-3">
          {CRITERIA.map((c) => {
            const Ico = CRITERIA_ICON[c.key];
            return (
              <li
                key={c.key}
                className="flex flex-col gap-3 rounded-xl border border-slate-100 bg-slate-50/60 px-4 py-3 sm:flex-row sm:items-center sm:justify-between"
              >
                <div className="flex items-center gap-3">
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-blue-100 text-[#0A5A84]">
                    <Ico className="h-4 w-4" />
                  </span>
                  <div>
                    <p className="text-sm font-bold text-slate-800">{c.title}</p>
                    <p className="mt-0.5 text-[11px] text-slate-500">{c.desc}</p>
                  </div>
                </div>
                <div className="rounded-lg bg-white px-3 py-1.5 ring-1 ring-slate-100">
                  <StarRating
                    value={scores[c.key]}
                    onChange={(v) => setScores((s) => ({ ...s, [c.key]: v }))}
                    label={c.title}
                  />
                </div>
              </li>
            );
          })}
        </ul>
      </section>

      {/* Bước 3 */}
      <section className={card}>
        <StepHead
          n={3}
          title="Gắn từ khóa trải nghiệm nhanh"
          sub="Nhấp để chọn những điểm bạn đánh giá cao nhất."
          right={
            <span className="shrink-0 rounded-full bg-slate-100 px-2.5 py-1 text-[10px] font-bold text-slate-500">
              Chọn tối đa {MAX_TAGS}
            </span>
          }
        />

        <div className="mt-4 flex flex-wrap gap-2">
          {TAGS.map((t) => {
            const active = tags.includes(t);
            const locked = !active && tags.length >= MAX_TAGS;
            return (
              <button
                key={t}
                type="button"
                aria-pressed={active}
                disabled={locked}
                onClick={() => toggleTag(t)}
                className={`inline-flex items-center gap-1.5 rounded-full border px-3.5 py-2 text-xs font-bold transition disabled:cursor-not-allowed disabled:opacity-40 ${
                  active
                    ? "border-transparent bg-[#0A5A84] text-white"
                    : "border-slate-200 bg-white text-slate-700 hover:bg-blue-50"
                }`}
              >
                {active && <Check className="h-3 w-3" />}
                {t}
              </button>
            );
          })}
        </div>

        <div className="mt-6">
          <div className="flex items-center justify-between text-xs">
            <label htmlFor="comment" className="font-bold text-slate-700">
              Chia sẻ thêm cảm nhận của bạn (không bắt buộc)
            </label>
            <span className="text-[11px] text-slate-400">
              Tối đa {MAX_COMMENT} ký tự ({comment.length})
            </span>
          </div>
          <textarea
            id="comment"
            rows={4}
            maxLength={MAX_COMMENT}
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder="Bác sĩ Huy khám rất kỹ, hướng dẫn chi tiết về thực phẩm nên tránh khi bị trào ngược dạ dày..."
            className="mt-2 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-[#2B6CB0] focus:bg-white focus:ring-2 focus:ring-[#2B6CB0]/20"
          />
        </div>

        <label className="mt-4 flex cursor-pointer items-center justify-between gap-4 rounded-xl border border-blue-100 bg-blue-50/60 px-4 py-3">
          <span className="flex items-start gap-2.5">
            <EyeOff className="mt-0.5 h-4 w-4 shrink-0 text-[#0A5A84]" />
            <span className="leading-tight">
              <span className="block text-xs font-bold text-slate-800">
                Ẩn danh trên hồ sơ công khai của bác sĩ
              </span>
              <span className="mt-0.5 block text-[11px] text-slate-500">
                Tên bạn chỉ hiển thị là &ldquo;Bệnh nhân ẩn danh&rdquo; trên bảng đánh giá.
              </span>
            </span>
          </span>
          <span className="relative shrink-0">
            <input
              type="checkbox"
              checked={anonymous}
              onChange={(e) => setAnonymous(e.target.checked)}
              className="peer sr-only"
            />
            <span className="block h-6 w-11 rounded-full bg-slate-300 transition peer-checked:bg-[#0A5A84] peer-focus-visible:ring-2 peer-focus-visible:ring-[#2B6CB0]" />
            <span className="absolute left-0.5 top-0.5 h-5 w-5 rounded-full bg-white shadow transition peer-checked:translate-x-5" />
          </span>
        </label>
      </section>

      {error && (
        <p role="alert" className="rounded-lg bg-red-50 px-3 py-2 text-xs text-red-600">
          {error}
        </p>
      )}

      <div className="flex flex-col-reverse gap-3 sm:flex-row sm:items-center sm:justify-between">
        <Link
          href="/lich-su-lich-hen"
          className="inline-flex items-center justify-center gap-2 rounded-full bg-blue-50 px-6 py-3.5 text-xs font-bold text-[#0A5A84] transition hover:bg-blue-100"
        >
          <ArrowLeft className="h-4 w-4" />
          Quay lại Lịch sử khám
        </Link>
        <button
          type="button"
          onClick={() => setConfirming(true)}
          className="inline-flex items-center justify-center gap-2 rounded-full bg-[#0A5A84] px-7 py-3.5 text-xs font-bold text-white shadow transition hover:bg-[#08486B]"
        >
          <Send className="h-4 w-4" />
          Gửi đánh giá &amp; Nhận 50 MediPoint
        </button>
      </div>

      <p className="flex items-center justify-center gap-1.5 text-[11px] text-slate-400">
        <Info className="h-3.5 w-3.5" />
        Đánh giá của bạn giúp cải thiện chất lượng dịch vụ tại MediConnect mỗi ngày.
      </p>

      {/* Hộp xác nhận (SRS: hiển thị nội dung và yêu cầu xác nhận trước khi lưu) */}
      {confirming && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Xác nhận gửi đánh giá"
          className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-900/40 px-4"
        >
          <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-2xl">
            <h3 className="text-lg font-extrabold text-slate-900">Xác nhận gửi đánh giá</h3>
            <dl className="mt-4 space-y-2 text-sm">
              <div className="flex items-center justify-between">
                <dt className="text-slate-500">Đánh giá chung</dt>
                <dd className="flex items-center gap-1 font-bold text-slate-900">
                  {overall}
                  <Star className="h-4 w-4 text-amber-400" />
                </dd>
              </div>
              <div className="flex items-center justify-between">
                <dt className="text-slate-500">Từ khóa đã chọn</dt>
                <dd className="font-bold text-slate-900">{tags.length}</dd>
              </div>
              <div className="flex items-center justify-between">
                <dt className="text-slate-500">Hiển thị</dt>
                <dd className="font-bold text-slate-900">{anonymous ? "Ẩn danh" : "Công khai tên"}</dd>
              </div>
            </dl>
            <p className="mt-4 text-xs text-slate-500">
              Mỗi phiên khám chỉ được đánh giá một lần.
            </p>
            <div className="mt-5 flex gap-3">
              <button
                type="button"
                onClick={() => setConfirming(false)}
                disabled={submitting}
                className="flex-1 rounded-full border border-slate-200 py-2.5 text-xs font-bold text-slate-600 transition hover:bg-slate-50"
              >
                Xem lại
              </button>
              <button
                type="button"
                onClick={submit}
                disabled={submitting}
                className="flex-1 rounded-full bg-[#0A5A84] py-2.5 text-xs font-bold text-white transition hover:bg-[#08486B] disabled:bg-slate-300"
              >
                {submitting ? "Đang gửi..." : "Xác nhận gửi"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}