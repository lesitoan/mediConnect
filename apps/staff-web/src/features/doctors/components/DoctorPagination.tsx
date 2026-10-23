"use client";

import { Pagination, type PaginationProps } from "@/components/shared/Pagination";
import { DOCTOR_PAGE_SIZE_OPTIONS } from "../types/doctorTypes";

export function DoctorPagination({
  itemName = "bác sĩ",
  pageSizeOptions = DOCTOR_PAGE_SIZE_OPTIONS,
  ...props
}: PaginationProps) {
  return (
    <Pagination
      {...props}
      itemName={itemName}
      pageSizeOptions={pageSizeOptions}
    />
  );
}

