"use client";

import { useEffect, useId } from "react";
import { useForm, useWatch } from "react-hook-form";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { QUEUE_SEARCH_DEBOUNCE_MS } from "../constants";
import type { QueueFilterOption, QueueFilterValues } from "../types/queueTypes";

interface QueueFiltersProps {
  filters: QueueFilterValues;
  specialties: QueueFilterOption[];
  doctors: QueueFilterOption[];
  onFilterChange: <K extends keyof QueueFilterValues>(
    key: K,
    value: QueueFilterValues[K],
  ) => void;
  onSpecialtyChange: (specialtyId: string) => void;
}

export function QueueFilters({
  filters,
  specialties,
  doctors,
  onFilterChange,
  onSpecialtyChange,
}: QueueFiltersProps) {
  const id = useId();
  const { register, control, reset } = useForm<{ search: string }>({
    defaultValues: { search: filters.search },
  });
  const search = useWatch({ control, name: "search" });

  useEffect(() => {
    reset({ search: filters.search });
  }, [filters.search, reset]);

  useEffect(() => {
    if (search === filters.search) return;
    const timer = setTimeout(
      () => onFilterChange("search", search),
      QUEUE_SEARCH_DEBOUNCE_MS,
    );
    return () => clearTimeout(timer);
  }, [search, filters.search, onFilterChange]);

  return (
    <div
      role="search"
      aria-label="Lọc hàng chờ"
      className="grid gap-3 rounded-app-xl border border-border-strong bg-surface p-4 shadow-xs sm:grid-cols-2 lg:grid-cols-[minmax(0,1fr)_210px_250px]"
    >
      <div className="min-w-0 sm:col-span-2 lg:col-span-1">
        <label htmlFor={`${id}-search`} className="sr-only">
          Tìm tên, mã bệnh nhân hoặc số thứ tự
        </label>
        <Input
          id={`${id}-search`}
          type="search"
          {...register("search")}
          placeholder="Tìm tên, mã BN, STT..."
          className="h-10"
        />
      </div>
      <div role="group" aria-labelledby={`${id}-specialty-label`}>
        <span id={`${id}-specialty-label`} className="sr-only">
          Chuyên khoa
        </span>
        <Select
          name="specialtyId"
          value={filters.specialtyId}
          onChange={(event) => onSpecialtyChange(event.target.value)}
          className="h-10"
        >
          <option value="ALL">Tất cả chuyên khoa</option>
          {specialties.map((specialty) => (
            <option key={specialty.id} value={specialty.id}>
              {specialty.name}
            </option>
          ))}
        </Select>
      </div>
      <div role="group" aria-labelledby={`${id}-doctor-label`}>
        <span id={`${id}-doctor-label`} className="sr-only">
          Bác sĩ
        </span>
        <Select
          name="doctorId"
          value={filters.doctorId}
          onChange={(event) => onFilterChange("doctorId", event.target.value)}
          className="h-10"
        >
          <option value="ALL">Tất cả bác sĩ</option>
          {doctors.map((doctor) => (
            <option key={doctor.id} value={doctor.id}>
              {doctor.name}
            </option>
          ))}
        </Select>
      </div>
    </div>
  );
}
