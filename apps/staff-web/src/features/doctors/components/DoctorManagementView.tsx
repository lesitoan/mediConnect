"use client";

import { useState, useMemo, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { UserX } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Pagination } from "@/components/shared/Pagination";
import { useModal } from "@/hooks/useModal";
import { useTableFilters } from "@/hooks/useTableFilters";
import type {
  Doctor,
  CreateDoctorInput,
  UpdateDoctorInput,
  CreateSpecialtyInput,
  DeactivateDoctorInput,
  DoctorFilterValues,
} from "../types/doctorTypes";
import {
  DEFAULT_DOCTOR_FILTERS,
  DOCTOR_PAGE_SIZE_OPTIONS,
} from "../types/doctorTypes";
import {
  INITIAL_DOCTORS,
  INITIAL_SPECIALTIES,
  createDoctorRecord,
  updateDoctorRecord,
  createSpecialtyRecord,
} from "../services/doctorsService";
import { DoctorHeader } from "./DoctorHeader";
import { DoctorFilters } from "./DoctorFilters";
import { DoctorCard } from "./DoctorCard";
import { DoctorTable } from "./DoctorTable";
import { SpecialtyGrid } from "./SpecialtyGrid";
import { AddDoctorModal } from "./AddDoctorModal";
import { EditDoctorModal } from "./EditDoctorModal";
import { AddSpecialtyModal } from "./AddSpecialtyModal";
import { DoctorDetailsDrawer } from "./DoctorDetailsDrawer";
import { DeactivateDoctorModal } from "./DeactivateDoctorModal";

export function DoctorManagementView() {
  const [doctors, setDoctors] = useState<Doctor[]>(INITIAL_DOCTORS);
  const [specialties, setSpecialties] = useState(INITIAL_SPECIALTIES);

  // Table filters & URL sync via shared useTableFilters hook
  const { filters, setFilter, setFilters, resetFilters } =
    useTableFilters<DoctorFilterValues>(DEFAULT_DOCTOR_FILTERS);

  // Modals management via shared useModal hook
  const addDoctorModal = useModal();
  const editDoctorModal = useModal<Doctor>();
  const addSpecialtyModal = useModal();
  const detailsDrawer = useModal<Doctor>();
  const deactivateModal = useModal<Doctor>();

  const searchParams = useSearchParams();

  useEffect(() => {
    const doctorParam = searchParams.get("doctorId") || searchParams.get("doctor");
    if (doctorParam && !detailsDrawer.isOpen) {
      const found = doctors.find(
        (d) => d.id === doctorParam || d.code.toLowerCase() === doctorParam.toLowerCase()
      );
      if (found) {
        detailsDrawer.open(found);
      }
    }
  }, [searchParams, doctors, detailsDrawer.isOpen]);

  const activeCount = useMemo(
    () => doctors.filter((d) => d.status === "ACTIVE").length,
    [doctors]
  );
  const inactiveCount = useMemo(
    () => doctors.filter((d) => d.status === "INACTIVE").length,
    [doctors]
  );

  const filteredDoctors = useMemo(() => {
    return doctors.filter((doc) => {
      if (filters.status === "ACTIVE" && doc.status !== "ACTIVE") return false;
      if (filters.status === "INACTIVE" && doc.status !== "INACTIVE") return false;

      if (filters.specialty && doc.specialtyName !== filters.specialty) {
        return false;
      }

      if (filters.search.trim()) {
        const query = filters.search.toLowerCase();
        const matchName = doc.name.toLowerCase().includes(query);
        const matchCode = doc.code.toLowerCase().includes(query);
        const matchLicense = doc.licenseNumber.toLowerCase().includes(query);
        const matchSpecialty = doc.specialtyName.toLowerCase().includes(query);
        return matchName || matchCode || matchLicense || matchSpecialty;
      }

      return true;
    });
  }, [doctors, filters.status, filters.specialty, filters.search]);

  const totalPages = Math.max(1, Math.ceil(filteredDoctors.length / filters.pageSize));
  const paginatedDoctors = useMemo(() => {
    const startIndex = (filters.page - 1) * filters.pageSize;
    return filteredDoctors.slice(startIndex, startIndex + filters.pageSize);
  }, [filteredDoctors, filters.page, filters.pageSize]);

  const handleAddDoctor = (input: CreateDoctorInput) => {
    const newDoc = createDoctorRecord(input);
    setDoctors((prev) => [newDoc, ...prev]);
    addDoctorModal.close();
  };

  const handleDeactivateConfirm = (payload: DeactivateDoctorInput) => {
    setDoctors((prev) =>
      prev.map((doc) =>
        doc.id === payload.doctorId
          ? {
              ...doc,
              status: "INACTIVE",
              weeklyAppointments: 0,
              pauseReason: payload.reason,
              pauseStartDate: payload.startDate,
              pauseEndDate: payload.endDate,
              isIndefinitePause: payload.isIndefinite,
              pauseStrategy: payload.strategy,
            }
          : doc
      )
    );
    if (detailsDrawer.data?.id === payload.doctorId) {
      detailsDrawer.setData((prev) =>
        prev
          ? {
              ...prev,
              status: "INACTIVE",
              weeklyAppointments: 0,
              pauseReason: payload.reason,
              pauseStartDate: payload.startDate,
              pauseEndDate: payload.endDate,
              isIndefinitePause: payload.isIndefinite,
              pauseStrategy: payload.strategy,
            }
          : null
      );
    }
    deactivateModal.close();
  };

  const handleActivate = (doctor: Doctor) => {
    setDoctors((prev) =>
      prev.map((doc) =>
        doc.id === doctor.id
          ? {
              ...doc,
              status: "ACTIVE",
              weeklyAppointments: 10,
              pauseReason: undefined,
              pauseStartDate: undefined,
              pauseEndDate: undefined,
              isIndefinitePause: undefined,
              pauseStrategy: undefined,
            }
          : doc
      )
    );
    if (detailsDrawer.data?.id === doctor.id) {
      detailsDrawer.setData((prev) =>
        prev
          ? {
              ...prev,
              status: "ACTIVE",
              weeklyAppointments: 10,
              pauseReason: undefined,
              pauseStartDate: undefined,
              pauseEndDate: undefined,
              isIndefinitePause: undefined,
              pauseStrategy: undefined,
            }
          : null
      );
    }
  };

  const handleSaveEditDoctor = (input: UpdateDoctorInput) => {
    setDoctors((prev) =>
      prev.map((doc) =>
        doc.id === input.id ? updateDoctorRecord(doc, input) : doc
      )
    );
    if (detailsDrawer.data?.id === input.id) {
      detailsDrawer.setData((prev) =>
        prev ? updateDoctorRecord(prev, input) : null
      );
    }
    editDoctorModal.close();
  };

  const handleAddSpecialty = (input: CreateSpecialtyInput) => {
    const newSpec = createSpecialtyRecord(input);
    setSpecialties((prev) => [newSpec, ...prev]);
    addSpecialtyModal.close();
  };

  const handleSelectSpecialtyFromGrid = (specialtyName: string) => {
    setFilters({
      tab: "DOCTORS",
      specialty: specialtyName,
      page: 1,
    });
  };

  return (
    <div className="mx-auto w-full max-w-7xl">
      <DoctorHeader
        activeTab={filters.tab}
        onTabChange={(tab) => setFilter("tab", tab)}
        doctorCount={doctors.length}
        specialtyCount={specialties.length}
      />

      {filters.tab === "DOCTORS" ? (
        <>
          <DoctorFilters
            searchQuery={filters.search}
            onSearchChange={(q) => setFilter("search", q)}
            selectedSpecialty={filters.specialty}
            onSpecialtyChange={(s) => setFilter("specialty", s)}
            statusFilter={filters.status}
            onStatusFilterChange={(st) => setFilter("status", st)}
            viewMode={filters.view}
            onViewModeChange={(mode) => setFilter("view", mode)}
            onAddDoctorClick={() => addDoctorModal.open()}
            specialties={specialties}
            totalCount={doctors.length}
            activeCount={activeCount}
            inactiveCount={inactiveCount}
          />

          {paginatedDoctors.length === 0 ? (
            <div className="flex flex-col items-center justify-center rounded-app-2xl border border-dashed border-border bg-surface p-12 text-center shadow-xs">
              <div className="flex size-14 items-center justify-center rounded-full bg-secondary text-muted">
                <UserX className="size-7" />
              </div>
              <h3 className="mt-3 text-base font-bold text-foreground">
                Không tìm thấy bác sĩ phù hợp
              </h3>
              <p className="mt-1 text-label text-muted">
                Thử thay đổi từ khóa tìm kiếm hoặc lọc theo chuyên khoa khác.
              </p>
              <Button
                type="button"
                variant="default"
                size="sm"
                onClick={resetFilters}
                className="mt-4"
              >
                Xóa tất cả bộ lọc
              </Button>
            </div>
          ) : filters.view === "GRID" ? (
            <div className="space-y-4">
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
                {paginatedDoctors.map((doc) => (
                  <DoctorCard
                    key={doc.id}
                    doctor={doc}
                    onViewDetails={(d) => detailsDrawer.open(d)}
                    onEdit={(d) => editDoctorModal.open(d)}
                    onDeactivate={(d) => deactivateModal.open(d)}
                    onActivate={handleActivate}
                  />
                ))}
              </div>

              <div className="overflow-hidden rounded-app-xl border border-border-strong bg-surface shadow-xs">
                <Pagination
                  currentPage={filters.page}
                  totalPages={totalPages}
                  totalItems={filteredDoctors.length}
                  pageSize={filters.pageSize}
                  pageSizeOptions={DOCTOR_PAGE_SIZE_OPTIONS}
                  itemName="bác sĩ"
                  onPageChange={(page) => setFilter("page", page)}
                  onPageSizeChange={(newSize) => setFilter("pageSize", newSize)}
                />
              </div>
            </div>
          ) : (
            <div className="overflow-hidden rounded-app-xl border border-border-strong bg-surface shadow-xs">
              <DoctorTable
                doctors={paginatedDoctors}
                onViewDetails={(d) => detailsDrawer.open(d)}
                onEdit={(d) => editDoctorModal.open(d)}
                onDeactivate={(d) => deactivateModal.open(d)}
                onActivate={handleActivate}
              />
              <Pagination
                currentPage={filters.page}
                totalPages={totalPages}
                totalItems={filteredDoctors.length}
                pageSize={filters.pageSize}
                pageSizeOptions={DOCTOR_PAGE_SIZE_OPTIONS}
                itemName="bác sĩ"
                onPageChange={(page) => setFilter("page", page)}
                onPageSizeChange={(newSize) => setFilter("pageSize", newSize)}
              />
            </div>
          )}
        </>
      ) : (
        <SpecialtyGrid
          specialties={specialties}
          onSelectSpecialty={handleSelectSpecialtyFromGrid}
          onAddSpecialtyClick={() => addSpecialtyModal.open()}
        />
      )}

      <AddDoctorModal
        isOpen={addDoctorModal.isOpen}
        onClose={addDoctorModal.close}
        onSubmit={handleAddDoctor}
        specialties={specialties}
      />

      <EditDoctorModal
        doctor={editDoctorModal.data}
        isOpen={editDoctorModal.isOpen}
        onClose={editDoctorModal.close}
        onSave={handleSaveEditDoctor}
        specialties={specialties}
      />

      <AddSpecialtyModal
        isOpen={addSpecialtyModal.isOpen}
        onClose={addSpecialtyModal.close}
        onSubmit={handleAddSpecialty}
      />

      <DoctorDetailsDrawer
        doctor={detailsDrawer.data}
        isOpen={detailsDrawer.isOpen}
        onClose={detailsDrawer.close}
        onEdit={(doc) => {
          detailsDrawer.close();
          editDoctorModal.open(doc);
        }}
        onDeactivate={(doc) => deactivateModal.open(doc)}
        onActivate={handleActivate}
      />

      <DeactivateDoctorModal
        doctor={deactivateModal.data}
        isOpen={deactivateModal.isOpen}
        onClose={deactivateModal.close}
        onConfirm={handleDeactivateConfirm}
      />
    </div>
  );
}
