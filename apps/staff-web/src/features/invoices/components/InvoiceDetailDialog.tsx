"use client";

import { useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/Dialog";
import { Loading } from "@/components/shared/Loading";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/Table";
import { usePendingCashPayment } from "../hooks/usePendingCashPayment";
import {
  billingErrorMessage,
  collectionBlockedReason,
  formatBillingDate,
  formatVnd,
  invoiceCharges,
} from "../invoiceUtils";
import {
  useGetInvoiceQuery,
  usePrepareInvoiceQrMutation,
} from "../services/invoicesApi";
import type { InvoiceQr, InvoiceTransaction } from "../types/invoiceTypes";
import { CashPaymentDialog } from "./CashPaymentDialog";
import { InvoiceQrDialog } from "./InvoiceQrDialog";
import { PaymentStatusBadge } from "./PaymentStatusBadge";

const TRANSACTION_STATUS: Record<InvoiceTransaction["status"], string> = {
  SUCCESS: "Thành công",
  PENDING: "Đang chờ",
  FAILED: "Không thành công",
  PENDING_RECONCILIATION: "Chờ đối soát",
};

export function InvoiceDetailDialog({
  invoiceId,
  accountId,
  canCollectCash,
  canPrepareQr,
  onClose,
}: {
  invoiceId: string;
  accountId: string;
  canCollectCash: boolean;
  canPrepareQr: boolean;
  onClose: () => void;
}) {
  const query = useGetInvoiceQuery(invoiceId, {
    refetchOnMountOrArgChange: true,
  });
  const invoice = query.currentData;
  const [isCashOpen, setIsCashOpen] = useState(false);
  const [qr, setQr] = useState<InvoiceQr | null>(null);
  const [prepareQr, { isLoading: isPreparingQr }] =
    usePrepareInvoiceQrMutation();
  const preparingRef = useRef(false);
  const [error, setError] = useState("");
  const { hasStoredPayment, storageError } = usePendingCashPayment(
    accountId,
    invoiceId,
  );
  const blockedReason = invoice ? collectionBlockedReason(invoice) : null;
  const hasQrCode = !!invoice && /^MDC[A-F0-9]{24}$/.test(invoice.invoiceCode);
  const charges = invoiceCharges(invoice?.chargeDetails);
  const prepare = async () => {
    if (
      preparingRef.current ||
      hasStoredPayment ||
      storageError ||
      blockedReason ||
      !hasQrCode
    )
      return;
    preparingRef.current = true;
    setError("");
    try {
      setQr(await prepareQr(invoiceId).unwrap());
    } catch (failure) {
      setError(billingErrorMessage(failure));
    } finally {
      preparingRef.current = false;
    }
  };
  return (
    <>
      <Dialog
        open
        onOpenChange={(open) => {
          if (!open && !preparingRef.current && !isCashOpen && !qr) onClose();
        }}
      >
        <DialogContent
          className="max-h-[calc(100dvh-2rem)] max-w-5xl overflow-hidden"
          showCloseButton={!isPreparingQr}
        >
          <DialogHeader className="shrink-0 pr-12">
            <DialogTitle>Chi tiết hóa đơn</DialogTitle>
            <DialogDescription className="break-all">
              {invoice?.invoiceCode ??
                "Thông tin hóa đơn và lịch sử thanh toán"}
            </DialogDescription>
          </DialogHeader>
          <div
            className="min-h-0 flex-1 overflow-y-auto p-5 sm:p-6"
            aria-busy={query.isFetching}
          >
            {!invoice ? (
              query.isError ? (
                <div role="alert" className="space-y-3 py-8 text-center">
                  <p>{billingErrorMessage(query.error)}</p>
                  <Button
                    variant="outline"
                    onClick={() => void query.refetch()}
                  >
                    Thử lại
                  </Button>
                </div>
              ) : (
                <Loading label="Đang tải hóa đơn..." className="min-h-48" />
              )
            ) : (
              <div className="space-y-6">
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div>
                    <h3 className="text-xl font-bold">
                      {invoice.patient.fullName}
                    </h3>
                    <p className="mt-1 text-body text-muted">
                      {invoice.patient.patientCode} ·{" "}
                      {invoice.patient.phone || "Chưa có số điện thoại"}
                    </p>
                  </div>
                  <PaymentStatusBadge
                    status={invoice.paymentStatus}
                    isVoid={invoice.status === "VOID"}
                  />
                </div>
                <dl className="grid gap-3 text-body sm:grid-cols-2">
                  <div>
                    <dt className="text-muted">Lịch hẹn</dt>
                    <dd className="mt-1 break-all font-medium">
                      {invoice.appointmentCode}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-muted">Ngày lập</dt>
                    <dd className="mt-1 font-medium">
                      {formatBillingDate(invoice.createdAt)}
                    </dd>
                  </div>
                </dl>
                <dl className="grid gap-3 sm:grid-cols-3">
                  {[
                    ["Tổng hóa đơn", invoice.totalAmount],
                    ["Đã thu", invoice.receivedAmount],
                    ["Còn thiếu", invoice.outstandingAmount],
                  ].map(([label, amount]) => (
                    <div
                      key={label}
                      className="rounded-app-lg border border-border bg-surface-hover p-4"
                    >
                      <dt className="text-caption text-muted">{label}</dt>
                      <dd
                        className={`mt-2 text-xl font-bold tabular-nums ${label === "Còn thiếu" ? "text-primary" : ""}`}
                      >
                        {formatVnd(amount)}
                      </dd>
                    </div>
                  ))}
                </dl>
                {invoice.refundedAmount !== "0" &&
                  !/^0(?:\.0+)?$/.test(invoice.refundedAmount) && (
                    <p className="text-body">
                      Đã hoàn:{" "}
                      <strong>{formatVnd(invoice.refundedAmount)}</strong>
                    </p>
                  )}
                {invoice.paymentStatus === "OVERPAID" && (
                  <p className="rounded-app-md bg-warning-bg p-3 text-body text-warning">
                    Thu thừa {formatVnd(invoice.overpaidAmount)}. Vui lòng liên
                    hệ quản trị viên để xử lý.
                  </p>
                )}
                {invoice.hasPendingReconciliation && (
                  <p className="rounded-app-md bg-warning-bg p-3 text-body text-warning">
                    Có giao dịch chờ đối soát. Kiểm tra lịch sử trước khi thu
                    thêm tiền.
                  </p>
                )}
                {hasStoredPayment && canCollectCash && (
                  <div
                    role="status"
                    className="rounded-app-md border border-warning/20 bg-warning-bg p-3 text-body text-warning"
                  >
                    Có khoản thu tiền mặt chưa nhận được kết quả. Chọn “Kiểm tra
                    khoản thu” để tiếp tục xác nhận khoản thu cũ.
                  </div>
                )}
                {query.isError && (
                  <p
                    role="alert"
                    className="rounded-app-md bg-error-bg p-3 text-body text-error-text"
                  >
                    Không cập nhật được hóa đơn. Các thao tác thu tiền tạm dừng
                    cho đến khi tải lại thành công.
                  </p>
                )}
                <section className="overflow-hidden rounded-app-lg border border-border">
                  <h3 className="border-b border-border px-4 py-3 font-semibold">
                    Chi tiết khoản phí
                  </h3>
                  {charges.length ? (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Khoản phí</TableHead>
                          <TableHead className="text-right">Số lượng</TableHead>
                          <TableHead className="text-right">Đơn giá</TableHead>
                          <TableHead className="text-right">
                            Thành tiền
                          </TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {charges.map((charge, index) => (
                          <TableRow key={index}>
                            <TableCell>{charge.label}</TableCell>
                            <TableCell className="text-right">
                              {charge.quantity}
                            </TableCell>
                            <TableCell className="text-right whitespace-nowrap">
                              {formatVnd(charge.unitPrice)}
                            </TableCell>
                            <TableCell className="text-right whitespace-nowrap font-semibold">
                              {formatVnd(charge.amount)}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  ) : (
                    <p className="p-4 text-body text-muted">
                      Hóa đơn chưa có chi tiết khoản phí.
                    </p>
                  )}
                </section>
                <section className="overflow-hidden rounded-app-lg border border-border">
                  <h3 className="border-b border-border px-4 py-3 font-semibold">
                    Lịch sử giao dịch
                  </h3>
                  {!invoice.transactions.length ? (
                    <p className="p-6 text-center text-body text-muted">
                      Chưa ghi nhận giao dịch thanh toán.
                    </p>
                  ) : (
                    <Table className="min-w-[760px]">
                      <TableHeader>
                        <TableRow>
                          <TableHead>Thời gian</TableHead>
                          <TableHead>Hình thức</TableHead>
                          <TableHead className="text-right">Số tiền</TableHead>
                          <TableHead>Trạng thái</TableHead>
                          <TableHead>Người xử lý</TableHead>
                          <TableHead>Ghi chú</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {invoice.transactions.map((transaction) => (
                          <TableRow key={transaction.id}>
                            <TableCell className="whitespace-nowrap text-caption">
                              {formatBillingDate(transaction.occurredAt)}
                            </TableCell>
                            <TableCell>
                              <span className="whitespace-nowrap">
                                {transaction.provider === "COUNTER"
                                  ? "Tiền mặt"
                                  : "Chuyển khoản SePay"}
                              </span>
                              {transaction.transactionType === "REFUND" && (
                                <p className="text-caption text-muted">
                                  Hoàn tiền
                                </p>
                              )}
                            </TableCell>
                            <TableCell className="whitespace-nowrap text-right font-semibold tabular-nums">
                              {transaction.transactionType === "REFUND"
                                ? "−"
                                : ""}
                              {formatVnd(transaction.amount)}
                            </TableCell>
                            <TableCell
                              className={
                                transaction.status === "SUCCESS"
                                  ? "text-success"
                                  : "text-warning"
                              }
                            >
                              {TRANSACTION_STATUS[transaction.status]}
                            </TableCell>
                            <TableCell>
                              {transaction.processedByUser?.fullName ??
                                (transaction.provider === "SEPAY"
                                  ? "Tự động"
                                  : "—")}
                            </TableCell>
                            <TableCell className="max-w-64 whitespace-pre-wrap break-words text-caption text-muted">
                              {transaction.reconciliationNote || "—"}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  )}
                </section>
                {blockedReason &&
                  (canCollectCash || canPrepareQr) &&
                  !hasStoredPayment && (
                    <p className="text-caption text-muted">{blockedReason}</p>
                  )}
                {!hasQrCode && canPrepareQr && !blockedReason && (
                  <p className="text-caption text-muted">
                    Hóa đơn này chưa hỗ trợ thanh toán QR. Bạn có thể thu tiền
                    mặt.
                  </p>
                )}
                {error && (
                  <p role="alert" className="text-body text-error-text">
                    {error}
                  </p>
                )}
              </div>
            )}
            {storageError && (canCollectCash || canPrepareQr) && (
              <p
                role="alert"
                className="rounded-app-md bg-error-bg p-3 text-body text-error-text"
              >
                {storageError}
              </p>
            )}
          </div>
          <DialogFooter className="shrink-0">
            <Button
              variant="outline"
              onClick={onClose}
              disabled={isPreparingQr}
            >
              Đóng
            </Button>
            <Button
              variant="outline"
              disabled={query.isFetching || isPreparingQr}
              onClick={() => void query.refetch()}
            >
              {query.isFetching ? "Đang cập nhật..." : "Tải lại hóa đơn"}
            </Button>
            {invoice && canPrepareQr && (
              <Button
                variant="outline"
                disabled={
                  !!blockedReason ||
                  !!storageError ||
                  hasStoredPayment ||
                  !hasQrCode ||
                  query.isFetching ||
                  query.isError ||
                  isPreparingQr
                }
                onClick={() => void prepare()}
              >
                {isPreparingQr ? "Đang tạo QR..." : "Thanh toán QR"}
              </Button>
            )}
            {invoice && canCollectCash && (
              <Button
                disabled={
                  (!hasStoredPayment && !!blockedReason) ||
                  query.isFetching ||
                  query.isError ||
                  isPreparingQr
                }
                onClick={() => setIsCashOpen(true)}
              >
                {hasStoredPayment ? "Kiểm tra khoản thu" : "Thu tiền mặt"}
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
      {invoice && isCashOpen && canCollectCash && (
        <CashPaymentDialog
          invoice={invoice}
          accountId={accountId}
          isRefreshing={query.isFetching || query.isError}
          onClose={() => setIsCashOpen(false)}
        />
      )}
      {qr && <InvoiceQrDialog initialQr={qr} onClose={() => setQr(null)} />}
    </>
  );
}
