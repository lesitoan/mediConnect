"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Clock } from "lucide-react";
import { toast } from "react-hot-toast";
import { Pagination } from "@/components/shared/Pagination";
import { useModal } from "@/hooks/useModal";
import { useTableFilters } from "@/hooks/useTableFilters";
import {
  DEFAULT_RECEPTION_FILTERS,
  PAGE_SIZE_OPTIONS,
} from "../constants";
import {
  getReceptionError,
  listReceptionAppointments,
  searchReceptionSpecialties,
} from "../services/receptionService";
import type {
  PatientAppointment,
  ReceptionFilterValues,
  SpecialtyOption,
} from "../types/receptionTypes";
import { ReceptionHeader } from "./ReceptionHeader";
import { ReceptionFilters } from "./ReceptionFilters";
import { ReceptionTable } from "./ReceptionTable";
import { WalkInReceptionModal } from "./WalkInReceptionModal";
import { CheckInModal } from "./CheckInModal";
import { CheckInSuccessModal } from "./CheckInSuccessModal";
import { ReceptionQueueModal } from "./ReceptionQueueModal";

function clinicToday(): string {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Ho_Chi_Minh",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(new Date());
  const values = Object.fromEntries(
    parts
      .filter(({ type }) => type !== "literal")
      .map(({ type, value }) => [type, value]),
  );
  return `${values.year}-${values.month}-${values.day}`;
}

export function ReceptionManagementView() {
  const [appointments, setAppointments] = useState<PatientAppointment[]>([]);
  const [total, setTotal] = useState(0);
  const [specialties, setSpecialties] = useState<SpecialtyOption[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [selectedAppointment, setSelectedAppointment] =
    useState<PatientAppointment | null>(null);
  const [successAppointment, setSuccessAppointment] =
    useState<PatientAppointment | null>(null);
  const [queueAppointment, setQueueAppointment] =
    useState<PatientAppointment | null>(null);
  const [isQueueOpen, setIsQueueOpen] = useState(false);
  const { filters, setFilter } =
    useTableFilters<ReceptionFilterValues>(DEFAULT_RECEPTION_FILTERS);
  const walkInModal = useModal();
  const requestId = useRef(0);
  const date = clinicToday();

  const [stats, setStats] = useState({
    total: 0,
    waitingCheckIn: 0,
    upcoming: 0,
    late: 0,
    checkedIn: 0,
  });

  const loadAppointments = useCallback(async (signal?: AbortSignal) => {
    const currentRequestId = ++requestId.current;
    setIsLoading(true);
    setErrorMessage(null);
    try {
      const response = await listReceptionAppointments({
        date,
        tab: filters.tab === "ALL" ? undefined : filters.tab,
        search: filters.search.trim() || undefined,
        specialtyId:
          filters.specialty === "ALL" ? undefined : filters.specialty,
        page: filters.page,
        pageSize: filters.pageSize,
      }, signal);
      if (currentRequestId !== requestId.current) return;
      setAppointments(response.items);
      setTotal(response.total);
      setStats(response.stats);
    } catch (error) {
      if (currentRequestId !== requestId.current) return;
      const normalizedError = getReceptionError(error);
      if (normalizedError.message !== "canceled") {
        setErrorMessage(normalizedError.message);
      }
    } finally {
      if (currentRequestId === requestId.current) setIsLoading(false);
    }
  }, [
    date,
    filters.page,
    filters.pageSize,
    filters.search,
    filters.specialty,
    filters.tab,
  ]);

  useEffect(() => {
    const controller = new AbortController();
    const timer = window.setTimeout(
      () => void loadAppointments(controller.signal),
      0,
    );
    return () => {
      window.clearTimeout(timer);
      controller.abort();
    };
  }, [loadAppointments]);

  useEffect(() => {
    let isMounted = true;
    void searchReceptionSpecialties().then(
      (items) => {
        if (isMounted) setSpecialties(items);
      },
      (error: unknown) => {
        if (isMounted) toast.error(getReceptionError(error).message);
      },
    );
    return () => {
      isMounted = false;
    };
  }, []);

  const resetPageAndSetFilter = useCallback(
    <K extends keyof ReceptionFilterValues>(
      key: K,
      value: ReceptionFilterValues[K],
    ) => {
      setFilter(key, value);
    },
    [setFilter],
  );

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "F4") {
        event.preventDefault();
        walkInModal.open();
      }
      if (event.key === "F5") {
        event.preventDefault();
        void loadAppointments();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [loadAppointments, walkInModal]);

  return (
    <div className="mx-auto w-full max-w-7xl space-y-4">
      <ReceptionHeader onOpenWalkInModal={walkInModal.open} />
      <ReceptionFilters
        statusFilter={filters.tab}
        onStatusFilterChange={(value) =>
          resetPageAndSetFilter("tab", value)
        }
        specialtyFilter={filters.specialty}
        onSpecialtyFilterChange={(value) =>
          resetPageAndSetFilter("specialty", value)
        }
        searchQuery={filters.search}
        onSearchChange={(value) => resetPageAndSetFilter("search", value)}
        specialties={specialties}
        stats={stats}
      />
      <div className="overflow-hidden rounded-app-xl border border-border-strong bg-surface shadow-xs">
        {isLoading ? (
          <div className="p-12 text-center text-muted">Đang tải danh sách...</div>
        ) : errorMessage ? (
          <div className="flex flex-col items-center gap-3 p-12 text-center">
            <p className="text-body text-error">{errorMessage}</p>
            <button
              type="button"
              onClick={() => void loadAppointments()}
              className="rounded-app-md bg-primary px-3 py-2 text-caption font-semibold text-primary-foreground"
            >
              Thử lại
            </button>
          </div>
        ) : appointments.length === 0 ? (
          <div className="flex flex-col items-center justify-center p-12 text-center">
            <Clock className="size-6 text-muted" />
            <h3 className="mt-3 text-base font-bold text-foreground">
              Không có lịch hẹn nào phù hợp
            </h3>
          </div>
        ) : (
          <>
            <ReceptionTable
              appointments={appointments}
              onCheckIn={setSelectedAppointment}
              onViewDetails={(appointment) => {
                setSuccessAppointment(appointment);
              }}
            />
            <Pagination
              currentPage={filters.page}
              totalPages={Math.max(1, Math.ceil(total / filters.pageSize))}
              totalItems={total}
              pageSize={filters.pageSize}
              pageSizeOptions={PAGE_SIZE_OPTIONS}
              itemName="lịch hẹn"
              onPageChange={(page) => setFilter("page", page)}
              onPageSizeChange={(pageSize) => {
                setFilter("pageSize", pageSize);
              }}
            />
          </>
        )}
      </div>
      <WalkInReceptionModal
        isOpen={walkInModal.isOpen}
        onClose={walkInModal.close}
        onSuccess={(appointment) => {
          walkInModal.close();
          void loadAppointments();
          if (appointment.status === "CHECKED_IN") {
            setSuccessAppointment(appointment);
          } else {
            toast.success(
              `Tiếp nhận thành công: ${appointment.appointmentCode}`,
            );
          }
        }}
      />
      <CheckInModal
        appointment={selectedAppointment}
        isOpen={selectedAppointment !== null}
        onClose={() => setSelectedAppointment(null)}
        onSuccess={(appointment) => {
          setSelectedAppointment(null);
          setSuccessAppointment(appointment);
          void loadAppointments();
        }}
        onRefetch={loadAppointments}
      />
      <CheckInSuccessModal
        appointment={successAppointment}
        isOpen={successAppointment !== null}
        onClose={() => setSuccessAppointment(null)}
        onViewQueue={(appointment) => {
          setQueueAppointment(appointment);
          setSuccessAppointment(null);
          setIsQueueOpen(true);
        }}
      />
      <ReceptionQueueModal
        appointment={queueAppointment}
        isOpen={isQueueOpen}
        onClose={() => setIsQueueOpen(false)}
      />
    </div>
  );
}
