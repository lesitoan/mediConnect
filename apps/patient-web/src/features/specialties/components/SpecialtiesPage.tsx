"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { ChevronRight, Funnel, Home, Plus, Search } from "@/components/layout/icons";
import {
  GROUPS,
  norm,
  OTHER_SPECIALTIES,
  SPECIALTIES,
  TAG_FILTERS,
  type Group,
  type Tag,
} from "../data";
import SpecialtyCard from "./SpecialtyCard";
import { AiSymptomBanner, ConciergeBar, Hero, Journey } from "./SpecialtySections";

export default function SpecialtiesPage() {
  const [group, setGroup] = useState<"all" | Group>("all");
  const [query, setQuery] = useState("");
  const [tags, setTags] = useState<Tag[]>([]);

  const toggleTag = (t: Tag) =>
    setTags((cur) => (cur.includes(t) ? cur.filter((x) => x !== t) : [...cur, t]));

  const list = useMemo(() => {
    const q = norm(query.trim());
    return SPECIALTIES.filter((s) => group === "all" || s.group === group)
      .filter((s) => tags.every((t) => s.tags.includes(t)))
      .filter(
        (s) =>
          !q ||
          norm(s.name).includes(q) ||
          norm(s.head.name).includes(q) ||
          s.techniques.some((t) => norm(t).includes(q)) ||
          s.keywords.some((k) => norm(k).includes(q)),
      );
  }, [group, query, tags]);

  const scrollTo = (id: string) =>
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });

  return (
    <section className="bg-gradient-to-b from-[#EAF3FD] to-[#F6FAFE] pb-14">
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
            <li>Chuyên khoa y tế</li>
            <ChevronRight className="h-3 w-3" />
            <li className="font-bold text-[#0A5A84]">Khám phá chuyên khoa</li>
          </ol>
        </nav>

        <Hero onList={() => scrollTo("list")} onAi={() => scrollTo("ai")} />

        {/* Bộ lọc */}
        <div id="list" className="scroll-mt-32 rounded-2xl bg-white p-5 shadow-[0_6px_24px_rgba(10,90,132,0.08)]">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex w-full max-w-xl items-center gap-2.5 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 focus-within:border-[#2B6CB0] focus-within:bg-white focus-within:ring-2 focus-within:ring-[#2B6CB0]/20">
              <Search className="h-4 w-4 text-slate-400" />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Nhập tên chuyên khoa, bác sĩ, triệu chứng (VD: Tim mạch, Đau dạ dày, Khớp, Đột quỵ...)"
                aria-label="Tìm chuyên khoa"
                className="w-full bg-transparent text-xs text-slate-800 outline-none placeholder:text-slate-400"
              />
            </div>
            <p className="flex items-center gap-1.5 text-[11px] text-slate-500">
              <Funnel className="h-3.5 w-3.5 text-[#2B6CB0]" />
              Bộ lọc thông minh: Đang hiển thị{" "}
              <b className="text-[#0A5A84]">{list.length} chuyên khoa tiêu biểu</b>
            </p>
          </div>

          <div className="mt-4 flex flex-wrap gap-2.5" role="tablist">
            {GROUPS.map((g) => {
              const active = group === g.key;
              return (
                <button
                  key={g.key}
                  type="button"
                  role="tab"
                  aria-selected={active}
                  onClick={() => setGroup(g.key)}
                  className={`inline-flex items-center gap-2 rounded-full px-4 py-2 text-xs font-bold transition ${
                    active
                      ? "bg-[#0A5A84] text-white shadow"
                      : "border border-slate-200 bg-white text-slate-700 hover:bg-blue-50"
                  }`}
                >
                  {g.label}
                  <span
                    className={`rounded-full px-1.5 py-0.5 text-[10px] ${
                      active ? "bg-white/20" : "bg-slate-100 text-slate-500"
                    }`}
                  >
                    {g.count}
                  </span>
                </button>
              );
            })}
          </div>

          <div className="mt-4 flex flex-wrap items-center gap-x-6 gap-y-2 border-t border-slate-100 pt-4 text-xs text-slate-600">
            <span className="flex items-center gap-1.5 font-bold text-slate-500">
              <Funnel className="h-3.5 w-3.5" />
              Lọc theo nhu cầu:
            </span>
            {TAG_FILTERS.map((t) => (
              <label key={t.key} className="flex cursor-pointer items-center gap-2">
                <input
                  type="checkbox"
                  checked={tags.includes(t.key)}
                  onChange={() => toggleTag(t.key)}
                  className="h-4 w-4 accent-[#0A5A84]"
                />
                {t.label}
              </label>
            ))}
          </div>
        </div>

        {/* Lưới chuyên khoa */}
        {list.length === 0 ? (
          <div className="mt-6 rounded-2xl bg-white px-6 py-16 text-center shadow-[0_6px_24px_rgba(10,90,132,0.08)]">
            <p className="text-sm font-bold text-slate-800">Không tìm thấy chuyên khoa phù hợp</p>
            <p className="mt-1 text-xs text-slate-500">
              Thử đổi từ khóa, bỏ bớt bộ lọc hoặc dùng gợi ý khoa khám bằng AI bên dưới.
            </p>
            <button
              type="button"
              onClick={() => {
                setQuery("");
                setTags([]);
                setGroup("all");
              }}
              className="mt-5 rounded-full bg-[#0A5A84] px-6 py-2.5 text-xs font-bold text-white transition hover:bg-[#08486B]"
            >
              Xóa bộ lọc
            </button>
          </div>
        ) : (
          <div className="mt-6 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {list.map((s) => (
              <SpecialtyCard key={s.slug} s={s} />
            ))}
          </div>
        )}

        {/* 13 chuyên khoa khác */}
        <div className="mt-6 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-blue-100 bg-blue-50/70 px-5 py-4">
          <div className="flex items-center gap-3">
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#0A5A84] text-white">
              <Plus className="h-4 w-4" />
            </span>
            <p className="text-xs leading-relaxed text-slate-700">
              Cùng <b className="text-[#0A5A84]">13 chuyên khoa khác:</b> {OTHER_SPECIALTIES}
            </p>
          </div>
          <button
            type="button"
            // TODO: tải thêm danh mục chuyên khoa từ API (phân trang)
            className="rounded-full bg-white px-5 py-2.5 text-xs font-bold text-[#0A5A84] shadow-sm ring-1 ring-slate-200 transition hover:bg-blue-50"
          >
            Tải thêm tất cả chuyên khoa
          </button>
        </div>

        <div className="mt-10">
          <AiSymptomBanner />
        </div>

        <Journey />
        <ConciergeBar />
      </div>
    </section>
  );
}