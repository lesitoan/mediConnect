"use client";

import { useState, useMemo } from "react";
import { UserX } from "lucide-react";
import { Button } from "@/components/ui/button";
import type {
  Doctor,
  DoctorStatusFilter,
  DoctorViewMode,
  MainTab,
  CreateDoctorInput,
  UpdateDoctorInput,
  CreateSpecialtyInput,
  DeactivateDoctorInput,
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
import { DoctorPagination } from "./DoctorPagination";
import { SpecialtyGrid } from "./SpecialtyGrid";
import { AddDoctorModal } from "./AddDoctorModal";
import { EditDoctorModal } from "./EditDoctorModal";
import { AddSpecialtyModal } from "./AddSpecialtyModal";
import { DoctorDetailsDrawer } from "./DoctorDetailsDrawer";
import { DeactivateDoctorModal } from "./DeactivateDoctorModal";

const PAGE_SIZE = 6;

export function DoctorManagementView() {
  const [doctors, setDoctors] = useState<Doctor[]>(INITIAL_DOCTORS);
  const [specialties, setSpecialties] = useState(INITIAL_SPECIALTIES);
  const [activeTab, setActiveTab] = useState<MainTab>("DOCTORS");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedSpecialty, setSelectedSpecialty] = useState("");
  const [statusFilter, setStatusFilter] = useState<DoctorStatusFilter>("ALL");
  const [viewMode, setViewMode] = useState<DoctorViewMode>("GRID");
  const [currentPage, setCurrentPage] = useState(1);

  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [selectedDoctor, setSelectedDoctor] = useState<Doctor | null>(null);
  const [editingDoctor, setEditingDoctor] = useState<Doctor | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isAddSpecialtyModalOpen, setIsAddSpecialtyModalOpen] = useState(false);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [deactivatingDoctor, setDeactivatingDoctor] = useState<Doctor | null>(null);
  const [isDeactivateModalOpen, setIsDeactivateModalOpen] = useState(false);

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
      if (statusFilter === "ACTIVE" && doc.status !== "ACTIVE") return false;
      if (statusFilter === "INACTIVE" && doc.status !== "INACTIVE") return false;

      if (selectedSpecialty && doc.specialtyName !== selectedSpecialty) {
        return false;
      }

      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        const matchName = doc.name.toLowerCase().includes(query);
        const matchCode = doc.code.toLowerCase().includes(query);
        const matchLicense = doc.licenseNumber.toLowerCase().includes(query);
        const matchSpecialty = doc.specialtyName.toLowerCase().includes(query);
        return matchName || matchCode || matchLicense || matchSpecialty;
      }

      return true;
    });
  }, [doctors, statusFilter, selectedSpecialty, searchQuery]);

  const totalPages = Math.max(1, Math.ceil(filteredDoctors.length / PAGE_SIZE));
  const paginatedDoctors = useMemo(() => {
    const startIndex = (currentPage - 1) * PAGE_SIZE;
    return filteredDoctors.slice(startIndex, startIndex + PAGE_SIZE);
  }, [filteredDoctors, currentPage]);

  const handleAddDoctor = (input: CreateDoctorInput) => {
    const newDoc = createDoctorRecord(input);
    setDoctors((prev) => [newDoc, ...prev]);
  };

  const handleDeactivateConfirm = (payload: DeactivateDoctorInput) => {
    setDoctors((prev) =>
      prev.map((doc) =>
        doc.id === payload.doctorId
          ? { ...doc, status: "INACTIVE", weeklyAppointments: 0 }
          : doc
      )
    );
    if (selectedDoctor && selectedDoctor.id === payload.doctorId) {
      setSelectedDoctor((prev) =>
        prev ? { ...prev, status: "INACTIVE", weeklyAppointments: 0 } : null
      );
    }
  };

  const handleActivate = (doctor: Doctor) => {
    setDoctors((prev) =>
      prev.map((doc) =>
        doc.id === doctor.id
          ? { ...doc, status: "ACTIVE", weeklyAppointments: 10 }
          : doc
      )
    );
    if (selectedDoctor && selectedDoctor.id === doctor.id) {
      setSelectedDoctor((prev) =>
        prev ? { ...prev, status: "ACTIVE", weeklyAppointments: 10 } : null
      );
    }
  };

  const handleOpenDrawer = (doctor: Doctor) => {
    setSelectedDoctor(doctor);
    setIsDrawerOpen(true);
  };

  const handleOpenDeactivateModal = (doctor: Doctor) => {
    setDeactivatingDoctor(doctor);
    setIsDeactivateModalOpen(true);
  };

  const handleOpenEdit = (doctor: Doctor) => {
    setEditingDoctor(doctor);
    setIsEditModalOpen(true);
  };

  const handleSaveEditDoctor = (input: UpdateDoctorInput) => {
    setDoctors((prev) =>
      prev.map((doc) =>
        doc.id === input.id ? updateDoctorRecord(doc, input) : doc
      )
    );
    if (selectedDoctor && selectedDoctor.id === input.id) {
      setSelectedDoctor((prev) =>
        prev ? updateDoctorRecord(prev, input) : null
      );
    }
  };

  const handleAddSpecialty = (input: CreateSpecialtyInput) => {
    const newSpec = createSpecialtyRecord(input);
    setSpecialties((prev) => [newSpec, ...prev]);
  };

  const handleSelectSpecialtyFromGrid = (specialtyName: string) => {
    setSelectedSpecialty(specialtyName);
    setActiveTab("DOCTORS");
  };

  return (
    <div className="mx-auto w-full max-w-7xl">
      <DoctorHeader
        activeTab={activeTab}
        onTabChange={setActiveTab}
        doctorCount={doctors.length}
        specialtyCount={specialties.length}
      />

      {activeTab === "DOCTORS" ? (
        <>
          <DoctorFilters
            searchQuery={searchQuery}
            onSearchChange={(q) => {
              setSearchQuery(q);
              setCurrentPage(1);
            }}
            selectedSpecialty={selectedSpecialty}
            onSpecialtyChange={(s) => {
              setSelectedSpecialty(s);
              setCurrentPage(1);
            }}
            statusFilter={statusFilter}
            onStatusFilterChange={(st) => {
              setStatusFilter(st);
              setCurrentPage(1);
            }}
            viewMode={viewMode}
            onViewModeChange={setViewMode}
            onAddDoctorClick={() => setIsAddModalOpen(true)}
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
                onClick={() => {
                  setSearchQuery("");
                  setSelectedSpecialty("");
                  setStatusFilter("ALL");
                }}
                className="mt-4"
              >
                Xóa tất cả bộ lọc
              </Button>
            </div>
          ) : viewMode === "GRID" ? (
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
              {paginatedDoctors.map((doc) => (
                <DoctorCard
                  key={doc.id}
                  doctor={doc}
                  onViewDetails={handleOpenDrawer}
                  onEdit={handleOpenEdit}
                  onDeactivate={handleOpenDeactivateModal}
                  onActivate={handleActivate}
                />
              ))}
            </div>
          ) : (
            <DoctorTable
              doctors={paginatedDoctors}
              onViewDetails={handleOpenDrawer}
              onEdit={handleOpenEdit}
              onDeactivate={handleOpenDeactivateModal}
              onActivate={handleActivate}
            />
          )}

          <DoctorPagination
            currentPage={currentPage}
            totalPages={totalPages}
            totalItems={filteredDoctors.length}
            pageSize={PAGE_SIZE}
            onPageChange={setCurrentPage}
          />
        </>
      ) : (
        <SpecialtyGrid
          specialties={specialties}
          onSelectSpecialty={handleSelectSpecialtyFromGrid}
          onAddSpecialtyClick={() => setIsAddSpecialtyModalOpen(true)}
        />
      )}

      <AddDoctorModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onSubmit={handleAddDoctor}
        specialties={specialties}
      />

      <EditDoctorModal
        doctor={editingDoctor}
        isOpen={isEditModalOpen}
        onClose={() => {
          setIsEditModalOpen(false);
          setEditingDoctor(null);
        }}
        onSave={handleSaveEditDoctor}
        specialties={specialties}
      />

      <AddSpecialtyModal
        isOpen={isAddSpecialtyModalOpen}
        onClose={() => setIsAddSpecialtyModalOpen(false)}
        onSubmit={handleAddSpecialty}
      />

      <DoctorDetailsDrawer
        doctor={selectedDoctor}
        isOpen={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
        onEdit={handleOpenEdit}
        onDeactivate={handleOpenDeactivateModal}
        onActivate={handleActivate}
      />

      <DeactivateDoctorModal
        doctor={deactivatingDoctor}
        isOpen={isDeactivateModalOpen}
        onClose={() => setIsDeactivateModalOpen(false)}
        onConfirm={handleDeactivateConfirm}
      />
    </div>
  );
}
