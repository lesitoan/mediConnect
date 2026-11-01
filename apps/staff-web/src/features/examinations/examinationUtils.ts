import type { Examination } from "./types/examinationTypes";
export function filterExaminations(
  items: Examination[],
  filters: { search: string; status: string; date: string },
) {
  const search = filters.search.trim().toLocaleLowerCase("vi-VN");
  return items.filter(
    (item) =>
      (!filters.date || item.date === filters.date) &&
      (filters.status === "ALL" || item.status === filters.status) &&
      `${item.patientName} ${item.patientCode} ${item.id}`
        .toLocaleLowerCase("vi-VN")
        .includes(search),
  );
}
export function canCompleteExamination(item: Examination): boolean {
  return (
    item.status === "IN_PROGRESS" &&
    !!item.clinicalNotes.trim() &&
    !!item.diagnosis.trim()
  );
}

export function applyExaminationChanges(
  item: Examination,
  changes: Partial<Examination>,
): Examination {
  if (item.status === "COMPLETED") return item;
  if (changes.status === "COMPLETED" && !canCompleteExamination(item))
    return item;
  return { ...item, ...changes, id: item.id };
}
