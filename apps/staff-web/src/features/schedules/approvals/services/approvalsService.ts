import type {
  ApprovalRequest,
  ApprovalTableFilterValues,
} from "../types/approvalTypes";

export function filterApprovalRequests(
  requests: ApprovalRequest[],
  filters: ApprovalTableFilterValues,
) {
  const query = filters.search.trim().toLocaleLowerCase("vi");

  return requests.filter((request) => {
    if (filters.type !== "ALL" && request.type !== filters.type) return false;
    if (filters.status !== "ALL" && request.status !== filters.status)
      return false;

    return (
      !query ||
      [
        request.doctorName,
        request.doctorCode,
        request.requestCode,
        request.specialtyName,
        request.targetDoctorName ?? "",
      ].some((value) => value.toLocaleLowerCase("vi").includes(query))
    );
  });
}
