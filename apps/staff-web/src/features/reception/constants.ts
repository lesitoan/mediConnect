import type {
  ReceptionFilterValues,
} from "./types/receptionTypes";

export const PAGE_SIZE_OPTIONS = [5, 10, 20] as const;

export const DEFAULT_RECEPTION_FILTERS: ReceptionFilterValues = {
  tab: "ALL",
  search: "",
  specialty: "ALL",
  page: 1,
  pageSize: 5,
};
