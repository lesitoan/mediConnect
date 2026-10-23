"use client";

import { Pagination, type PaginationProps } from "@/components/shared/Pagination";

export function DoctorPagination(props: Omit<PaginationProps, "itemName">) {
  return <Pagination {...props} itemName="bác sĩ" />;
}
