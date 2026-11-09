import type { InvoiceFilterValues } from "./types/invoiceTypes";

export const DEFAULT_INVOICE_FILTERS: InvoiceFilterValues = {
  search: "",
  from: "",
  to: "",
  paymentStatus: "ALL",
  status: "ALL",
};
