"use client";

import { useMemo, useState } from "react";
import { Pagination } from "@/components/shared/Pagination";
import { CONSULTATION_PAGE_SIZE, CONSULTATION_SESSIONS } from "../constants";
import {
  filterConsultations,
  getInProgressConsultation,
} from "../services/consultationService";
import type { ConsultationTab } from "../types/consultationTypes";
import { ActiveSessionCard } from "./ActiveSessionCard";
import { ConsultationHeader } from "./ConsultationHeader";
import { ConsultationTable } from "./ConsultationTable";
import { ConsultationTabs } from "./ConsultationTabs";

export function ConsultationListView() {
  const [activeTab, setActiveTab] = useState<ConsultationTab>("ALL");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);

  const filteredSessions = useMemo(
    () => filterConsultations(CONSULTATION_SESSIONS, activeTab, search),
    [activeTab, search],
  );
  const totalPages = Math.max(
    1,
    Math.ceil(filteredSessions.length / CONSULTATION_PAGE_SIZE),
  );
  const visibleSessions = filteredSessions.slice(
    (page - 1) * CONSULTATION_PAGE_SIZE,
    page * CONSULTATION_PAGE_SIZE,
  );

  function handleTabChange(tab: ConsultationTab) {
    setActiveTab(tab);
    setPage(1);
  }

  function handleSearchChange(value: string) {
    setSearch(value);
    setPage(1);
  }

  return (
    <div className="mx-auto w-full max-w-7xl space-y-4">
      <ConsultationHeader />
      <ActiveSessionCard session={getInProgressConsultation(CONSULTATION_SESSIONS)} />
      <section className="overflow-hidden rounded-app-xl border border-border-strong bg-surface shadow-xs">
        <ConsultationTabs
          sessions={CONSULTATION_SESSIONS}
          activeTab={activeTab}
          search={search}
          onTabChange={handleTabChange}
          onSearchChange={handleSearchChange}
        />
        <ConsultationTable sessions={visibleSessions} />
        <div className="flex flex-col gap-2 border-t border-border bg-sidebar/50 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="text-caption text-muted">
            Hiển thị{" "}
            <span className="font-bold text-foreground">
              {filteredSessions.length === 0
                ? "0–0"
                : `${(page - 1) * CONSULTATION_PAGE_SIZE + 1}–${Math.min(
                    page * CONSULTATION_PAGE_SIZE,
                    filteredSessions.length,
                  )}`}
            </span>{" "}
            trong{" "}
            <span className="font-bold text-foreground">{filteredSessions.length}</span>{" "}
            phiên khám
          </div>
          <Pagination
            currentPage={Math.min(page, totalPages)}
            totalPages={totalPages}
            totalItems={filteredSessions.length}
            hasItemCount={false}
            hasPageSize={false}
            onPageChange={setPage}
            className="border-0 bg-transparent px-0 py-0"
          />
        </div>
      </section>
    </div>
  );
}
