"use client";

import { useState, useMemo, useEffect, useCallback } from "react";
import { Clock } from "lucide-react";
import { toast } from "react-hot-toast";
import { Pagination } from "@/components/shared/Pagination";
import { useModal } from "@/hooks/useModal";
import { useTableFilters } from "@/hooks/useTableFilters";
import {
  INITIAL_APPOINTMENTS,
  PAGE_SIZE_OPTIONS,
  DEFAULT_RECEPTION_FILTERS,
} from "../constants";
import {
  computeReceptionStats,
  filterAppointments,
  checkInExistingAppointment,
  createWalkInAppointment,
} from "../services/receptionService";
import type {
  PatientAppointment,
  ReceptionFilterValues,
  WalkInReceptionInput,
} from "../types/receptionTypes";
import { ReceptionHeader } from "./ReceptionHeader";
import { ReceptionFilters } from "./ReceptionFilters";
import { ReceptionTable } from "./ReceptionTable";
import { WalkInReceptionModal } from "./WalkInReceptionModal";
import { CheckInModal } from "./CheckInModal";
import { CheckInSuccessModal } from "./CheckInSuccessModal";

export function ReceptionManagementView() {
  const [appointments, setAppointments] =
    useState<PatientAppointment[]>(INITIAL_APPOINTMENTS);

  // Table filters & URL sync via shared useTableFilters hook
  const { filters, setFilter } =
    useTableFilters<ReceptionFilterValues>(DEFAULT_RECEPTION_FILTERS);

  // Modals management via shared useModal hook
  const walkInModal = useModal();
  const checkInModal = useModal<PatientAppointment>();
  const successModal = useModal<PatientAppointment>();

  // Compute dynamic stats
  const stats = useMemo(
    () => computeReceptionStats(appointments),
    [appointments]
  );

  // Filter appointments using filters from useTableFilters
  const filteredAppointments = useMemo(
    () =>
      filterAppointments(
        appointments,
        filters.tab,
        filters.search,
        filters.specialty
      ),
    [appointments, filters.tab, filters.search, filters.specialty]
  );

  // Pagination calculation
  const totalPages = Math.max(
    1,
    Math.ceil(filteredAppointments.length / filters.pageSize)
  );
  const paginatedAppointments = useMemo(() => {
    const startIndex = (filters.page - 1) * filters.pageSize;
    return filteredAppointments.slice(startIndex, startIndex + filters.pageSize);
  }, [filteredAppointments, filters.page, filters.pageSize]);

  const handleRefresh = useCallback(() => {
    toast.success("Đã làm mới danh sách tiếp nhận!");
  }, []);

  // Keyboard shortcuts [F4] -> Walk-in, [F5] -> Refresh
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "F4") {
        e.preventDefault();
        walkInModal.open();
      } else if (e.key === "F5") {
        e.preventDefault();
        handleRefresh();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleRefresh, walkInModal]);

  // Actions
  const handleOpenCheckIn = (apt: PatientAppointment) => {
    checkInModal.open(apt);
  };

  const handleConfirmCheckIn = (apt: PatientAppointment) => {
    const updated = checkInExistingAppointment(apt);
    setAppointments((prev) =>
      prev.map((item) => (item.id === apt.id ? updated : item))
    );
    checkInModal.close();

    // Show success ticket
    successModal.open(updated);
    toast.success(`Check-in thành công: ${updated.patientName} (${updated.queueNumber})`);
  };

  const handleViewDetails = (apt: PatientAppointment) => {
    successModal.open(apt);
  };

  const handleWalkInSubmit = (input: WalkInReceptionInput) => {
    const newApt = createWalkInAppointment(input, appointments.length);
    setAppointments((prev) => [newApt, ...prev]);

    // Show success ticket
    successModal.open(newApt);
    toast.success(
      `Tiếp nhận vãng lai thành công: ${newApt.patientName} (${newApt.queueNumber})`
    );
  };

  return (
    <div className="mx-auto w-full max-w-7xl space-y-4">
      {/* 1. Header with Breadcrumb, Title and Action */}
      <ReceptionHeader onOpenWalkInModal={() => walkInModal.open()} />

      {/* 2. Filters Toolbar */}
      <ReceptionFilters
        statusFilter={filters.tab}
        onStatusFilterChange={(tab) => setFilter("tab", tab)}
        specialtyFilter={filters.specialty}
        onSpecialtyFilterChange={(spec) => setFilter("specialty", spec)}
        searchQuery={filters.search}
        onSearchChange={(query) => setFilter("search", query)}
        stats={stats}
      />

      {/* 3. Appointments Table & Pagination (Unified Enterprise Card Container) */}
      <div className="overflow-hidden rounded-app-xl border border-border-strong bg-surface shadow-xs">
        {filteredAppointments.length === 0 ? (
          <div className="flex flex-col items-center justify-center p-12 text-center">
            <div className="flex size-12 items-center justify-center rounded-full bg-secondary text-muted">
              <Clock className="size-6" />
            </div>
            <h3 className="mt-3 text-base font-bold text-foreground">
              Không có lịch hẹn nào phù hợp
            </h3>
            <p className="mt-1 text-caption text-muted">
              Thử thay đổi bộ lọc trạng thái hoặc từ khóa tìm kiếm bệnh nhân.
            </p>
          </div>
        ) : (
          <>
            <ReceptionTable
              appointments={paginatedAppointments}
              onCheckIn={handleOpenCheckIn}
              onViewDetails={handleViewDetails}
            />

            <Pagination
              currentPage={filters.page}
              totalPages={totalPages}
              totalItems={filteredAppointments.length}
              pageSize={filters.pageSize}
              pageSizeOptions={PAGE_SIZE_OPTIONS}
              itemName="lịch hẹn"
              onPageChange={(page) => setFilter("page", page)}
              onPageSizeChange={(newSize) => setFilter("pageSize", newSize)}
            />
          </>
        )}
      </div>

      {/* Modals managed by useModal */}
      <WalkInReceptionModal
        isOpen={walkInModal.isOpen}
        onClose={walkInModal.close}
        onSubmit={handleWalkInSubmit}
      />

      <CheckInModal
        appointment={checkInModal.data}
        isOpen={checkInModal.isOpen}
        onClose={checkInModal.close}
        onConfirmCheckIn={handleConfirmCheckIn}
      />

      <CheckInSuccessModal
        appointment={successModal.data}
        isOpen={successModal.isOpen}
        onClose={successModal.close}
        onViewQueue={() => {
          toast("Chức năng hàng chờ đang chuẩn bị kết nối", { icon: "ℹ️" });
        }}
      />
    </div>
  );
}

