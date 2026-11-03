"use client";
import { useCallback } from "react";
import toast from "react-hot-toast";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/Dialog";
import { Pagination } from "@/components/shared/Pagination";
import { useModal } from "@/hooks/useModal";
import { useTableFilters } from "@/hooks/useTableFilters";
import { useGetDoctorsQuery } from "../services/doctorsApi";
import {
  useGetSpecialtiesQuery,
  useGetSpecialtyOptionsQuery,
  useUpdateSpecialtyStatusMutation,
} from "@/features/specialties/services/specialtiesApi";
import { SpecialtyFormModal } from "@/features/specialties/components/SpecialtyFormModal";
import type { SpecialtyRecord } from "@/features/specialties/types/specialtyTypes";
import {
  DEFAULT_DOCTOR_FILTERS,
  DOCTOR_PAGE_SIZE_OPTIONS,
  type Doctor,
  type DoctorFilterValues,
} from "../types/doctorTypes";
import { getCatalogQuery, getDoctorApiError } from "../doctorUtils";
import { DoctorHeader } from "./DoctorHeader";
import { DoctorFilters } from "./DoctorFilters";
import { DoctorCard } from "./DoctorCard";
import { DoctorTable } from "./DoctorTable";
import { SpecialtyGrid } from "./SpecialtyGrid";
import { DoctorFormModal } from "./DoctorFormModal";
import { DoctorDetailsDrawer } from "./DoctorDetailsDrawer";
import { DeactivateDoctorModal } from "./DeactivateDoctorModal";

export function DoctorManagementView() {
  const { filters, setFilter, setFilters } =
    useTableFilters<DoctorFilterValues>(DEFAULT_DOCTOR_FILTERS);
  const { tab, page, limit, specialtyId, search } = getCatalogQuery(filters);
  const doctors = useGetDoctorsQuery(
    { page, limit, search, specialtyId: specialtyId || undefined },
    {
      skip: tab !== "DOCTORS",
      refetchOnMountOrArgChange: true,
      pollingInterval: 60000,
      skipPollingIfUnfocused: true,
    },
  );
  const specialties = useGetSpecialtiesQuery(
    { page, limit, search },
    { skip: tab !== "SPECIALTIES" },
  );
  const options = useGetSpecialtyOptionsQuery();
  const doctorForm = useModal<Doctor>();
  const specialtyForm = useModal<SpecialtyRecord>();
  const details = useModal<string>();
  const pauseForm = useModal<Doctor>();
  const statusModal = useModal<SpecialtyRecord>();
  const [setStatus, statusRequest] = useUpdateSpecialtyStatusMutation();
  const onSearchChange = useCallback(
    (value: string) => setFilter("search", value),
    [setFilter],
  );
  const current = tab === "DOCTORS" ? doctors : specialties;
  const result = current.currentData;
  const selectedId = details.data || filters.doctorId;
  const closeDetails = () => {
    details.close();
    if (filters.doctorId) setFilter("doctorId", "");
  };
  const changeStatus = async () => {
    if (!statusModal.data || statusRequest.isLoading) return;
    try {
      await setStatus({
        id: statusModal.data.id,
        isActive: !statusModal.data.isActive,
      }).unwrap();
      toast.success("Đã cập nhật trạng thái chuyên khoa.");
      statusModal.close();
    } catch (error) {
      toast.error(getDoctorApiError(error));
    }
  };
  const showDoctor = (doctor: Doctor) => details.open(doctor.id);
  return (
    <div className="mx-auto w-full max-w-7xl">
      <DoctorHeader
        activeTab={tab}
        onTabChange={(value) =>
          setFilters({ tab: value, search: "", specialty: "", page: 1 })
        }
        doctorCount={
          tab === "DOCTORS" ? result?.pagination.totalItems : undefined
        }
        specialtyCount={
          tab === "SPECIALTIES"
            ? result?.pagination.totalItems
            : options.data?.length
        }
      />
      <DoctorFilters
        tab={tab}
        searchQuery={filters.search}
        onSearchChange={onSearchChange}
        specialtyId={specialtyId}
        onSpecialtyChange={(value) => setFilter("specialty", value)}
        viewMode={filters.view === "LIST" ? "LIST" : "GRID"}
        onViewModeChange={(value) => setFilter("view", value)}
        onAdd={() =>
          tab === "DOCTORS" ? doctorForm.open() : specialtyForm.open()
        }
        specialties={options.data ?? []}
        isLoading={tab === "DOCTORS" && (!options.data || options.isFetching)}
      />
      {options.isError && (
        <div
          role="alert"
          className="mb-4 rounded-app-lg border border-error-border bg-error-bg p-4 text-body"
        >
          <p>
            Không tải được lựa chọn chuyên khoa:{" "}
            {getDoctorApiError(options.error)}
          </p>
          <Button variant="outline" size="sm" onClick={() => options.refetch()}>
            Thử lại
          </Button>
        </div>
      )}
      {current.isFetching ? (
        <p
          role="status"
          className="rounded-app-xl bg-surface p-8 text-center text-muted"
        >
          Đang tải danh sách...
        </p>
      ) : current.isError ? (
        <div
          role="alert"
          className="rounded-app-xl border border-error-border bg-error-bg p-6"
        >
          <p>{getDoctorApiError(current.error)}</p>
          <Button variant="outline" onClick={() => current.refetch()}>
            Tải lại danh sách
          </Button>
        </div>
      ) : !result?.data.length ? (
        <div className="rounded-app-xl border border-border bg-surface p-8 text-center">
          <p>Không có kết quả phù hợp.</p>
          <Button
            className="mt-3"
            variant="outline"
            onClick={() => setFilters({ page: 1, search: "", specialty: "" })}
          >
            Về trang đầu và bỏ bộ lọc
          </Button>
        </div>
      ) : tab === "SPECIALTIES" ? (
        <SpecialtyGrid
          specialties={specialties.currentData?.data ?? []}
          onSelectSpecialty={(id) =>
            setFilters({ tab: "DOCTORS", specialty: id, search: "", page: 1 })
          }
          onEdit={specialtyForm.open}
          onSetStatus={(specialty) => {
            statusRequest.reset();
            statusModal.open(specialty);
          }}
        />
      ) : filters.view === "LIST" ? (
        <div className="overflow-hidden rounded-app-xl border border-border bg-surface">
          <DoctorTable
            doctors={doctors.currentData?.data ?? []}
            onViewDetails={showDoctor}
            onEdit={doctorForm.open}
            onDeactivate={pauseForm.open}
          />
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
          {doctors.currentData?.data.map((doctor) => (
            <DoctorCard
              key={doctor.id}
              doctor={doctor}
              onViewDetails={showDoctor}
              onEdit={doctorForm.open}
              onDeactivate={pauseForm.open}
            />
          ))}
        </div>
      )}
      {result && !current.isFetching && !current.isError && (
        <div className="mt-4 rounded-app-xl border border-border bg-surface">
          <Pagination
            currentPage={page}
            totalPages={Math.max(1, result.pagination.totalPages)}
            totalItems={result.pagination.totalItems}
            pageSize={limit}
            pageSizeOptions={DOCTOR_PAGE_SIZE_OPTIONS}
            itemName={tab === "DOCTORS" ? "bác sĩ" : "chuyên khoa"}
            onPageChange={(value) => setFilter("page", value)}
            onPageSizeChange={(value) => setFilter("pageSize", value)}
          />
        </div>
      )}
      {doctorForm.isOpen && (
        <DoctorFormModal
          key={doctorForm.data?.id ?? "create"}
          doctor={doctorForm.data ?? undefined}
          specialties={options.data ?? []}
          onClose={doctorForm.close}
        />
      )}
      {specialtyForm.isOpen && (
        <SpecialtyFormModal
          key={specialtyForm.data?.id ?? "create"}
          specialty={specialtyForm.data ?? undefined}
          onClose={specialtyForm.close}
        />
      )}
      {selectedId && (
        <DoctorDetailsDrawer
          key={selectedId}
          doctorId={selectedId}
          onClose={closeDetails}
          onEdit={(doctor) => {
            closeDetails();
            doctorForm.open(doctor);
          }}
        />
      )}
      {pauseForm.isOpen && pauseForm.data && (
        <DeactivateDoctorModal
          doctor={pauseForm.data}
          onClose={pauseForm.close}
        />
      )}
      <Dialog
        open={statusModal.isOpen}
        onOpenChange={(open) => {
          if (!open && !statusRequest.isLoading) statusModal.close();
        }}
      >
        <DialogContent showCloseButton={!statusRequest.isLoading}>
          <DialogHeader>
            <DialogTitle>Đổi trạng thái chuyên khoa</DialogTitle>
            <DialogDescription>
              {statusModal.data?.isActive ? "Tạm dừng" : "Kích hoạt"} chuyên
              khoa {statusModal.data?.name}? Hệ thống kiểm tra bác sĩ và lịch
              liên quan trước khi cho phép.
            </DialogDescription>
          </DialogHeader>
          {statusRequest.isError && (
            <p role="alert" className="px-5 pb-4 text-body text-error">
              {getDoctorApiError(statusRequest.error)}
            </p>
          )}
          <DialogFooter>
            <Button
              variant="outline"
              disabled={statusRequest.isLoading}
              onClick={statusModal.close}
            >
              Hủy
            </Button>
            <Button disabled={statusRequest.isLoading} onClick={changeStatus}>
              {statusRequest.isLoading ? "Đang lưu..." : "Xác nhận"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
