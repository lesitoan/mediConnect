"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { ChevronRight, Home, Search } from "@/components/layout/icons";
import { getPublicDoctors, type PublicDoctor } from "@/features/providers/services/providersService";
import { norm } from "../data";
import { getPublicSpecialties, type PublicSpecialty } from "../services/specialtiesService";
import SpecialtyCard from "./SpecialtyCard";
import { AiSymptomBanner, ConciergeBar, Hero, Journey } from "./SpecialtySections";

export default function SpecialtiesPage() {
  const [query, setQuery] = useState("");
  const [specialties, setSpecialties] = useState<PublicSpecialty[]>([]);
  const [doctors, setDoctors] = useState<PublicDoctor[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState("");

  const doctorsBySpecialty = useMemo(() => {
    const result = new Map<string, PublicDoctor[]>();
    for (const doctor of doctors) {
      const current = result.get(doctor.specialty.id) ?? [];
      current.push(doctor);
      result.set(doctor.specialty.id, current);
    }
    return result;
  }, [doctors]);

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
        setDoctors(doctorItems);
        setLoadError("");
      })
      .catch((error: unknown) => {
        if (!isCancelled) {
          setLoadError(
            error instanceof Error
              ? error.message
              : "Không thể tải danh sách chuyên khoa và bác sĩ.",
          );
        }
      })
      .finally(() => {
        if (!isCancelled) setIsLoading(false);
      });
    return () => {
      isCancelled = true;
      controller.abort();
    };
  }, []);

  const list = useMemo(() => {
    const q = norm(query.trim());
    return specialties.filter((specialty) => {
      if (!q) return true;
      const specialtyDoctors = doctorsBySpecialty.get(specialty.id) ?? [];
      return (
        norm(specialty.name).includes(q) ||
        norm(specialty.code).includes(q) ||
        norm(specialty.description ?? "").includes(q) ||
        specialtyDoctors.some((doctor) => norm(doctor.user.fullName).includes(q))
      );
    });
  }, [doctorsBySpecialty, query, specialties]);

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

        <Hero
          onList={() => scrollTo("list")}
          onAi={() => scrollTo("ai")}
          specialtyCount={isLoading || loadError ? null : specialties.length}
          doctorCount={isLoading || loadError ? null : doctors.length}
        />

        {/* Bộ lọc */}
        <div id="list" className="scroll-mt-32 rounded-2xl bg-white p-5 shadow-[0_6px_24px_rgba(10,90,132,0.08)]">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex w-full max-w-xl items-center gap-2.5 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 focus-within:border-[#2B6CB0] focus-within:bg-white focus-within:ring-2 focus-within:ring-[#2B6CB0]/20">
              <Search className="h-4 w-4 text-slate-400" />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Tìm theo tên chuyên khoa, mã khoa hoặc bác sĩ"
                aria-label="Tìm chuyên khoa"
                className="w-full bg-transparent text-xs text-slate-800 outline-none placeholder:text-slate-400"
              />
            </div>
            <p className="text-[11px] text-slate-500">
              Đang hiển thị{" "}
              <b className="text-[#0A5A84]">{list.length} chuyên khoa</b>
            </p>
          </div>
        </div>

        {/* Lưới chuyên khoa */}
        {loadError ? (
          <p role="alert" className="mt-6 rounded-2xl bg-white px-6 py-10 text-center text-sm text-red-600">
            Không thể tải danh sách chuyên khoa và bác sĩ: {loadError}
          </p>
        ) : isLoading ? (
          <p className="mt-6 rounded-2xl bg-white px-6 py-10 text-center text-sm text-slate-500">
            Đang tải danh sách chuyên khoa và bác sĩ...
          </p>
        ) : list.length === 0 ? (
          <div className="mt-6 rounded-2xl bg-white px-6 py-16 text-center shadow-[0_6px_24px_rgba(10,90,132,0.08)]">
            <p className="text-sm font-bold text-slate-800">Không tìm thấy chuyên khoa phù hợp</p>
            <p className="mt-1 text-xs text-slate-500">
              Thử đổi từ khóa hoặc dùng gợi ý khoa khám bằng AI bên dưới.
            </p>
            <button
              type="button"
              onClick={() => setQuery("")}
              className="mt-5 rounded-full bg-[#0A5A84] px-6 py-2.5 text-xs font-bold text-white transition hover:bg-[#08486B]"
            >
              Xóa từ khóa
            </button>
          </div>
        ) : (
          <div className="mt-6 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {list.map((specialty) => (
              <SpecialtyCard
                key={specialty.id}
                specialty={specialty}
                doctors={doctorsBySpecialty.get(specialty.id) ?? []}
              />
            ))}
          </div>
        )}

        <div className="mt-10">
          <AiSymptomBanner />
        </div>

        <Journey />
        <ConciergeBar />
      </div>
    </section>
  );
}