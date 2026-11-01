import type {
  ConsultationSession,
  ConsultationTab,
} from "../types/consultationTypes";

function normalizeText(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
}

export function getConsultationStatusCount(
  sessions: readonly ConsultationSession[],
  tab: ConsultationTab,
): number {
  if (tab === "ALL") return sessions.length;
  return sessions.filter((session) => session.status === tab).length;
}

export function filterConsultations(
  sessions: readonly ConsultationSession[],
  tab: ConsultationTab,
  search: string,
): ConsultationSession[] {
  const normalizedSearch = normalizeText(search);
  return sessions.filter((session) => {
    const matchesTab = tab === "ALL" || session.status === tab;
    const searchableText = normalizeText(
      [
        session.patientName,
        session.patientCode,
        session.sessionCode,
        session.queueNumber,
        session.room,
      ].join(" "),
    );
    return matchesTab && searchableText.includes(normalizedSearch);
  });
}

export function getInProgressConsultation(
  sessions: readonly ConsultationSession[],
): ConsultationSession | undefined {
  return sessions.find((session) => session.status === "IN_PROGRESS");
}

export function getVietnameseTodayLabel(): string {
  return new Intl.DateTimeFormat("vi-VN", {
    timeZone: "Asia/Ho_Chi_Minh",
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(new Date());
}
