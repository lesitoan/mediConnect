import { baseApi } from "@/lib/redux/baseApi";
import type { ApiResponse, CatalogPage } from "@/types/apiTypes";
import type {
  BillingCandidate,
  BillingCandidateQuery,
  BillingPage,
  CashPaymentInput,
  CashPaymentReceipt,
  Invoice,
  InvoiceDetail,
  InvoiceListQuery,
  InvoiceQr,
} from "../types/invoiceTypes";

export const invoicesApi = baseApi
  .enhanceEndpoints({ addTagTypes: ["INVOICES", "BILLING_CANDIDATES"] })
  .injectEndpoints({
    endpoints: (build) => ({
      getInvoices: build.query<BillingPage<Invoice>, InvoiceListQuery>({
        query: (params) => ({ url: "/staff/invoices", params }),
        transformResponse: (response: CatalogPage<Invoice>) => ({
          data: response.data,
          pagination: response.pagination,
        }),
        providesTags: [{ type: "INVOICES", id: "LIST" }],
      }),
      getBillingCandidates: build.query<
        BillingPage<BillingCandidate>,
        BillingCandidateQuery
      >({
        query: (params) => ({ url: "/staff/billing-candidates", params }),
        transformResponse: (response: CatalogPage<BillingCandidate>) => ({
          data: response.data,
          pagination: response.pagination,
        }),
        providesTags: [{ type: "BILLING_CANDIDATES", id: "LIST" }],
      }),
      getInvoice: build.query<InvoiceDetail, string>({
        query: (id) => ({ url: `/staff/invoices/${encodeURIComponent(id)}` }),
        transformResponse: (response: ApiResponse<InvoiceDetail>) =>
          response.data,
        providesTags: (_result, _error, id) => [{ type: "INVOICES", id }],
      }),
      createInvoice: build.mutation<
        Pick<Invoice, "id" | "invoiceCode">,
        string
      >({
        query: (consultationId) => ({
          url: "/staff/invoices",
          method: "POST",
          data: { consultationId },
        }),
        transformResponse: (
          response: ApiResponse<Pick<Invoice, "id" | "invoiceCode">>,
        ) => response.data,
        invalidatesTags: [
          { type: "INVOICES", id: "LIST" },
          { type: "BILLING_CANDIDATES", id: "LIST" },
        ],
      }),
      createCashPayment: build.mutation<
        CashPaymentReceipt,
        {
          invoiceId: string;
          payment: CashPaymentInput;
          idempotencyKey: string;
        }
      >({
        query: ({ invoiceId, payment, idempotencyKey }) => ({
          url: `/staff/invoices/${encodeURIComponent(invoiceId)}/manual-payments`,
          method: "POST",
          data: payment,
          headers: { "Idempotency-Key": idempotencyKey },
        }),
        transformResponse: (response: ApiResponse<CashPaymentReceipt>) =>
          response.data,
        invalidatesTags: (_result, _error, { invoiceId }) => [
          { type: "INVOICES", id: invoiceId },
          { type: "INVOICES", id: "LIST" },
        ],
      }),
      prepareInvoiceQr: build.mutation<InvoiceQr, string>({
        query: (id) => ({
          url: `/staff/invoices/${encodeURIComponent(id)}/sepay-qr`,
          method: "POST",
        }),
        transformResponse: (response: ApiResponse<InvoiceQr>) => response.data,
        invalidatesTags: (_result, _error, id) => [{ type: "INVOICES", id }],
      }),
    }),
  });

export const {
  useGetInvoicesQuery,
  useGetBillingCandidatesQuery,
  useGetInvoiceQuery,
  useLazyGetInvoiceQuery,
  useCreateInvoiceMutation,
  useCreateCashPaymentMutation,
  usePrepareInvoiceQrMutation,
} = invoicesApi;
