"use client";

import { useCallback, useRef, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Empty } from "@/components/ui/Empty";
import { Loading } from "@/components/shared/Loading";
import { Pagination } from "@/components/shared/Pagination";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/Table";
import { useGetAuthUserQuery } from "@/features/auth/services/authApi";
import {
  billingErrorMessage,
  formatBillingDate,
  formatVnd,
} from "../invoiceUtils";
import {
  useGetBillingCandidatesQuery,
  useGetInvoicesQuery,
} from "../services/invoicesApi";
import type {
  BillingCandidate,
  InvoiceFilterValues,
} from "../types/invoiceTypes";
import { CreateInvoiceDialog } from "./CreateInvoiceDialog";
import { InvoiceDetailDialog } from "./InvoiceDetailDialog";
import { PaymentStatusBadge } from "./PaymentStatusBadge";
import { InvoiceFilters } from "./InvoiceFilters";
import { DEFAULT_INVOICE_FILTERS } from "../constants";

interface InvoiceManagementViewProps {
  mode: "CANDIDATES" | "INVOICES";
}

export function InvoiceManagementView({ mode }: InvoiceManagementViewProps) {
  const { data: user, isLoading: isLoadingUser } = useGetAuthUserQuery();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const selectedInvoiceId = searchParams.get("invoice");
  const permissions = user?.permissions ?? [];
  const isReceptionist = user?.role === "RECEPTIONIST";
  const isBillingStaff = isReceptionist || user?.role === "ADMIN";
  const canReadInvoices =
    isBillingStaff && permissions.includes("INVOICES_READ");
  const canReadCandidates =
    isReceptionist && permissions.includes("BILLING_CANDIDATES_READ");
  const canCreateInvoice =
    canReadInvoices &&
    isReceptionist &&
    permissions.includes("INVOICES_CREATE");
  const canCollectCash =
    isReceptionist && permissions.includes("PAYMENTS_CONFIRM");
  const canPrepareQr =
    isReceptionist && permissions.includes("PAYMENTS_PREPARE");
  const [filters, setFilters] = useState<InvoiceFilterValues>(
    DEFAULT_INVOICE_FILTERS,
  );
  const [filterResetKey, setFilterResetKey] = useState(0);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [candidate, setCandidate] = useState<BillingCandidate | null>(null);
  const invoices = useGetInvoicesQuery(
    {
      page,
      limit,
      search: filters.search.trim() || undefined,
      createdFrom: filters.from || undefined,
      createdTo: filters.to || undefined,
      paymentStatus:
        filters.paymentStatus === "ALL" ? undefined : filters.paymentStatus,
      status: filters.status === "ALL" ? undefined : filters.status,
    },
    { skip: !canReadInvoices || mode !== "INVOICES" },
  );
  const candidates = useGetBillingCandidatesQuery(
    {
      page,
      limit,
      search: filters.search.trim() || undefined,
      completedFrom: filters.from || undefined,
      completedTo: filters.to || undefined,
    },
    { skip: !canReadCandidates || mode !== "CANDIDATES" },
  );
  const currentQuery = mode === "CANDIDATES" ? candidates : invoices;
  const currentData = currentQuery.currentData;
  const pagination = currentData?.pagination;
  const hasRows = !!currentData?.data.length;
  const openInvoice = (id: string | null) => {
    const params = new URLSearchParams(searchParams.toString());
    if (id) params.set("invoice", id);
    else params.delete("invoice");
    router.replace(params.size ? `${pathname}?${params}` : pathname, {
      scroll: false,
    });
  };
  const changeFilters = useCallback((changes: Partial<InvoiceFilterValues>) => {
    setFilters((current) => ({ ...current, ...changes }));
    setPage(1);
  }, []);
  const resetFilters = () => {
    setFilters(DEFAULT_INVOICE_FILTERS);
    setFilterResetKey((current) => current + 1);
    setPage(1);
  };
  const tableRef = useRef<HTMLDivElement>(null);
  const changePage = (next: number) => {
    setPage(next);
    tableRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  if (isLoadingUser || !user)
    return (
      <Loading label="Đang tải thông tin tài khoản..." className="min-h-64" />
    );
  if (mode === "CANDIDATES" ? !canReadCandidates : !canReadInvoices)
    return (
      <Empty
        role="alert"
        title={
          mode === "CANDIDATES"
            ? "Chưa có quyền xem phiên khám chờ lập hóa đơn"
            : "Chưa có quyền xem hóa đơn"
        }
        description="Vui lòng liên hệ quản trị viên để kiểm tra quyền tài khoản."
      />
    );

  return (
    <div className="mx-auto max-w-7xl space-y-5">
      <header>
        <h1 id="billing-heading" className="text-display font-bold tracking-tight">
          {mode === "CANDIDATES" ? "Chờ lập hóa đơn" : "Hóa đơn"}
        </h1>
      </header>

      <InvoiceFilters
        key={`${mode}-${filterResetKey}`}
        filters={filters}
        isInvoiceTab={mode === "INVOICES"}
        onChange={changeFilters}
        onReset={resetFilters}
      />

      <div
        ref={tableRef}
        id="billing-table"
        role="region"
        aria-labelledby="billing-heading"
        aria-busy={currentQuery.isFetching}
        className="overflow-hidden rounded-app-xl border border-border bg-surface shadow-2xs"
      >
        {currentQuery.isError && (
          <div
            role="alert"
            className="flex flex-wrap items-center justify-between gap-3 border-b border-error-border bg-error-bg px-4 py-3 text-body text-error-text"
          >
            <p>{billingErrorMessage(currentQuery.error)}</p>
            <Button
              variant="outline"
              disabled={currentQuery.isFetching}
              onClick={() => void currentQuery.refetch()}
            >
              Thử lại
            </Button>
          </div>
        )}
        {!currentData && currentQuery.isFetching ? (
          <Loading label="Đang tải dữ liệu hóa đơn..." className="min-h-64" />
        ) : !hasRows ? (
          <Empty
            title={
              currentQuery.isError
                ? "Chưa tải được dữ liệu"
                : mode === "CANDIDATES"
                  ? "Không có phiên khám chờ lập hóa đơn"
                  : "Chưa có hóa đơn phù hợp"
            }
            description={
              mode === "CANDIDATES"
                ? "Các phiên khám đã hoàn tất và khóa hồ sơ sẽ xuất hiện tại đây khi chưa có hóa đơn."
                : "Thử thay đổi bộ lọc hoặc lập hóa đơn từ phiên khám đã hoàn tất."
            }
          />
        ) : mode === "CANDIDATES" ? (
          <Table className="min-w-[850px]">
            <TableHeader>
              <TableRow>
                <TableHead>Bệnh nhân / Lịch hẹn</TableHead>
                <TableHead>Bác sĩ / Chuyên khoa</TableHead>
                <TableHead>Hoàn tất</TableHead>
                <TableHead className="text-right">Phí khám</TableHead>
                <TableHead className="text-right">Thao tác</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {candidates.currentData?.data.map((row) => (
                <TableRow key={row.consultationId}>
                  <TableCell>
                    <p className="font-semibold">{row.patient.fullName}</p>
                    <p className="mt-1 text-caption text-muted">
                      {row.patient.patientCode} ·{" "}
                      {row.patient.phone || "Chưa có SĐT"}
                    </p>
                    <p className="mt-1 font-mono text-caption text-muted">
                      {row.appointmentCode}
                    </p>
                  </TableCell>
                  <TableCell>
                    <p className="font-medium">{row.doctor.fullName}</p>
                    <p className="mt-1 text-caption text-muted">
                      {row.specialty.name} · {row.specialty.roomCode}
                    </p>
                  </TableCell>
                  <TableCell className="whitespace-nowrap text-caption">
                    {formatBillingDate(row.completedAt)}
                  </TableCell>
                  <TableCell className="text-right">
                    <p className="whitespace-nowrap font-semibold tabular-nums">
                      {formatVnd(row.consultationFee)}
                    </p>
                    {!row.canCreateInvoice && (
                      <p className="mt-1 max-w-52 text-caption text-warning">
                        {row.blockedReason === "SPECIALTY_INACTIVE"
                          ? "Chuyên khoa ngừng hoạt động"
                          : "Chưa cấu hình phí khám"}
                      </p>
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    {canCreateInvoice ? (
                      <Button
                        size="sm"
                        disabled={
                          !row.canCreateInvoice ||
                          candidates.isFetching ||
                          candidates.isError
                        }
                        onClick={() => setCandidate(row)}
                      >
                        Lập hóa đơn
                      </Button>
                    ) : (
                      <span className="text-caption text-muted">Chỉ xem</span>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        ) : (
          <Table className="min-w-[900px]">
            <TableHeader>
              <TableRow>
                <TableHead>Hóa đơn / Ngày lập</TableHead>
                <TableHead>Bệnh nhân</TableHead>
                <TableHead className="text-right">Tổng tiền</TableHead>
                <TableHead className="text-right">Đã thu</TableHead>
                <TableHead className="text-right">Còn thiếu</TableHead>
                <TableHead>Trạng thái</TableHead>
                <TableHead className="text-right">Chi tiết</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {invoices.currentData?.data.map((row) => (
                <TableRow key={row.id}>
                  <TableCell>
                    <p className="max-w-56 break-all font-mono text-caption font-semibold text-primary">
                      {row.invoiceCode}
                    </p>
                    <p className="mt-1 text-caption text-muted">
                      {formatBillingDate(row.createdAt)}
                    </p>
                  </TableCell>
                  <TableCell>
                    <p className="font-semibold">{row.patient.fullName}</p>
                    <p className="mt-1 text-caption text-muted">
                      {row.patient.patientCode}
                    </p>
                    <p className="text-caption text-muted">
                      {row.patient.phone || "Chưa có SĐT"}
                    </p>
                  </TableCell>
                  <TableCell className="whitespace-nowrap text-right font-semibold tabular-nums">
                    {formatVnd(row.totalAmount)}
                  </TableCell>
                  <TableCell className="whitespace-nowrap text-right tabular-nums">
                    {formatVnd(row.receivedAmount)}
                  </TableCell>
                  <TableCell className="whitespace-nowrap text-right font-semibold tabular-nums text-primary">
                    {formatVnd(row.outstandingAmount)}
                  </TableCell>
                  <TableCell>
                    <PaymentStatusBadge
                      status={row.paymentStatus}
                      isVoid={row.status === "VOID"}
                    />
                    {row.hasPendingReconciliation && (
                      <p className="mt-1 text-caption text-warning">
                        Có giao dịch chờ đối soát
                      </p>
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => openInvoice(row.id)}
                    >
                      Xem hóa đơn
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
        {pagination && (
          <Pagination
            currentPage={page}
            totalPages={Math.max(1, pagination.totalPages)}
            totalItems={pagination.totalItems}
            pageSize={limit}
            itemName={mode === "CANDIDATES" ? "phiên khám" : "hóa đơn"}
            onPageChange={changePage}
            onPageSizeChange={(size) => {
              setLimit(size);
              setPage(1);
            }}
          />
        )}
        {pagination && page > Math.max(1, pagination.totalPages) && (
          <div className="border-t border-border p-3 text-center">
            <Button
              variant="outline"
              onClick={() => setPage(Math.max(1, pagination.totalPages))}
            >
              Về trang có dữ liệu
            </Button>
          </div>
        )}
      </div>

      {candidate && canCreateInvoice && (
        <CreateInvoiceDialog
          candidate={candidate}
          onClose={() => setCandidate(null)}
          onCreated={(id) => {
            setCandidate(null);
            router.push(`/invoices/list?invoice=${encodeURIComponent(id)}`);
          }}
        />
      )}
      {mode === "INVOICES" && selectedInvoiceId && canReadInvoices && (
        <InvoiceDetailDialog
          key={selectedInvoiceId}
          invoiceId={selectedInvoiceId}
          accountId={user.id}
          canCollectCash={canCollectCash}
          canPrepareQr={canPrepareQr}
          onClose={() => openInvoice(null)}
        />
      )}
    </div>
  );
}
