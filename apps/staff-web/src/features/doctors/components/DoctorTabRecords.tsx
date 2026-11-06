"use client";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { useGetDoctorTabQuery } from "../services/doctorsApi";
import { formatClinicTime, getDoctorApiError } from "../doctorUtils";
import type { DoctorDataTab } from "../types/doctorDetailTypes";

export function DoctorTabRecords({
  doctorId,
  tab,
}: {
  doctorId: string;
  tab: DoctorDataTab;
}) {
  const [page, setPage] = useState(1);
  const result = useGetDoctorTabQuery(
    { id: doctorId, tab, page, limit: 10 },
    { refetchOnMountOrArgChange: true },
  );
  const data = result.currentData;
  if (result.isFetching) return <p role="status">Đang tải dữ liệu...</p>;
  if (result.isError)
    return (
      <div role="alert">
        <p>{getDoctorApiError(result.error)}</p>
        <Button variant="outline" onClick={() => result.refetch()}>
          Thử lại
        </Button>
      </div>
    );
  return (
    <div className="space-y-3">
      {!data?.data.length ? (
        <p className="text-body text-muted">Chưa có dữ liệu để hiển thị.</p>
      ) : (
        <ul className="space-y-3">
          {data.data.map((item) => (
            <li
              key={item.id}
              className="space-y-2 rounded-app-lg border border-border p-3 text-body"
            >
              {"startsAt" in item ? (
                <>
                  <p>
                    {formatClinicTime(item.startsAt)} –{" "}
                    {formatClinicTime(item.endsAt)}
                  </p>
                  <p className="text-muted">
                    {{
                      DRAFT: "Bản nháp",
                      PUBLISHED: "Đã công bố",
                      ABSENT: "Vắng mặt",
                      CANCELLED: "Đã hủy",
                    }[item.status] ?? item.status}
                  </p>
                </>
              ) : "patient" in item ? (
                <>
                  <p>
                    {item.patient.fullName} · {item.patient.patientCode}
                  </p>
                  <p>
                    {item.appointmentCode} · {item.specialtyName}
                  </p>
                  <p className="text-muted">
                    {item.completedAt
                      ? formatClinicTime(item.completedAt)
                      : "Chưa cập nhật thời gian"}
                  </p>
                </>
              ) : (
                <>
                  <p>
                    Đánh giá bác sĩ: {item.doctorRating}/5 · Dịch vụ:{" "}
                    {item.serviceRating}/5
                  </p>
                  <p className="whitespace-pre-wrap">
                    {item.comment || "Không có nhận xét."}
                  </p>
                  <p className="text-muted">
                    {formatClinicTime(item.createdAt)}
                  </p>
                </>
              )}
            </li>
          ))}
        </ul>
      )}
      <div className="flex items-center justify-between gap-3">
        <Button
          variant="outline"
          disabled={page === 1}
          onClick={() => setPage(page - 1)}
        >
          Trước
        </Button>
        <p className="text-caption text-muted">
          Trang {page} · {data?.pagination.totalItems ?? 0} bản ghi
        </p>
        <Button
          variant="outline"
          disabled={!data || page >= data.pagination.totalPages}
          onClick={() => setPage(page + 1)}
        >
          Sau
        </Button>
      </div>
    </div>
  );
}
