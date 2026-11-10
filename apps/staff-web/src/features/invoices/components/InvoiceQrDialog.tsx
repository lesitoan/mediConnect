"use client";

import { useRef, useState } from "react";
import Image from "next/image";
import toast from "react-hot-toast";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/Dialog";
import {
  billingErrorMessage,
  collectionBlockedReason,
  formatVnd,
  parseVnd,
} from "../invoiceUtils";
import {
  useGetInvoiceQuery,
  usePrepareInvoiceQrMutation,
} from "../services/invoicesApi";
import type { InvoiceQr } from "../types/invoiceTypes";

function QrImage({ url }: { url: string }) {
  const [hasError, setHasError] = useState(false);
  if (hasError)
    return (
      <p role="alert" className="p-6 text-center text-body text-error-text">
        Không tải được ảnh QR. Bạn có thể chuyển khoản theo thông tin bên dưới
        hoặc mở lại mã QR.
      </p>
    );
  return (
    <Image
      src={url}
      alt="Mã QR thanh toán hóa đơn"
      width={280}
      height={280}
      unoptimized
      className="mx-auto max-w-full rounded-app-lg"
      onError={() => setHasError(true)}
    />
  );
}

export function InvoiceQrDialog({
  initialQr,
  onClose,
}: {
  initialQr: InvoiceQr;
  onClose: () => void;
}) {
  const [qr, setQr] = useState(initialQr);
  const [error, setError] = useState("");
  const [prepareQr, { isLoading }] = usePrepareInvoiceQrMutation();
  const preparingRef = useRef(false);
  const query = useGetInvoiceQuery(qr.invoiceId, {
    pollingInterval: 5000,
    skipPollingIfUnfocused: true,
    refetchOnMountOrArgChange: true,
  });
  const invoice = query.currentData;
  const isSettled =
    invoice && ["PAID", "OVERPAID"].includes(invoice.paymentStatus);
  const blockedReason = invoice ? collectionBlockedReason(invoice) : null;
  const isCurrentAmount =
    invoice && parseVnd(qr.amount) === parseVnd(invoice.outstandingAmount);
  const canShowQr =
    invoice && !query.isError && !blockedReason && isCurrentAmount;
  const refreshQr = async () => {
    if (preparingRef.current) return;
    preparingRef.current = true;
    setError("");
    try {
      setQr(await prepareQr(qr.invoiceId).unwrap());
    } catch (failure) {
      setError(billingErrorMessage(failure));
    } finally {
      preparingRef.current = false;
    }
  };
  const copy = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      toast.success("Đã sao chép.");
    } catch {
      toast.error(
        "Không sao chép được. Vui lòng sao chép thông tin trực tiếp.",
      );
    }
  };
  return (
    <Dialog
      open
      onOpenChange={(open) => {
        if (!open && !preparingRef.current) onClose();
      }}
    >
      <DialogContent
        className="max-h-[calc(100dvh-2rem)] overflow-y-auto"
        showCloseButton={!isLoading}
      >
        <DialogHeader>
          <DialogTitle>Thanh toán chuyển khoản</DialogTitle>
          <DialogDescription>
            {invoice?.invoiceCode ?? qr.paymentCode}
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 p-5 sm:p-6" aria-busy={query.isFetching}>
          {isSettled ? (
            <div
              role="status"
              className="rounded-app-lg bg-success-bg p-5 text-center text-success"
            >
              <h3 className="text-lg font-bold">Đã ghi nhận thanh toán</h3>
              <p className="mt-2 text-body">
                Hóa đơn không còn số tiền cần thu.
              </p>
              {invoice.paymentStatus === "OVERPAID" && (
                <p className="mt-2 text-body">
                  Số tiền thu thừa: {formatVnd(invoice.overpaidAmount)}. Vui
                  lòng liên hệ quản trị viên để xử lý.
                </p>
              )}
            </div>
          ) : (
            <>
              <p className="text-center text-body text-muted">
                Số tiền cần chuyển
              </p>
              <p className="text-center text-3xl font-bold tracking-tight text-primary">
                {formatVnd(invoice?.outstandingAmount ?? qr.amount)}
              </p>
              {canShowQr ? (
                <QrImage key={qr.qrImageUrl} url={qr.qrImageUrl} />
              ) : (
                <div className="rounded-app-lg bg-surface-hover p-5 text-center text-body">
                  {query.isError
                    ? "Chưa kiểm tra được trạng thái hóa đơn. Vui lòng tải lại trước khi thanh toán."
                    : !invoice
                      ? "Đang kiểm tra trạng thái hóa đơn..."
                      : blockedReason ||
                        "Số tiền còn thiếu đã thay đổi. Hãy tạo lại mã QR trước khi chuyển khoản."}
                </div>
              )}
              {canShowQr && (
                <dl className="space-y-3 rounded-app-lg border border-border p-4 text-body">
                  <div className="flex justify-between gap-4">
                    <dt className="text-muted">Ngân hàng</dt>
                    <dd className="font-semibold">{qr.bankCode}</dd>
                  </div>
                  <div>
                    <dt className="text-muted">Số tài khoản</dt>
                    <dd className="mt-1 flex items-center justify-between gap-2">
                      <span className="break-all font-semibold">
                        {qr.accountNumber}
                      </span>
                      <Button
                        variant="link"
                        size="sm"
                        onClick={() => void copy(qr.accountNumber)}
                      >
                        Sao chép
                      </Button>
                    </dd>
                  </div>
                  <div>
                    <dt className="text-muted">Tên tài khoản</dt>
                    <dd className="mt-1 font-semibold">{qr.accountName}</dd>
                  </div>
                  <div>
                    <dt className="text-muted">Nội dung chuyển khoản</dt>
                    <dd className="mt-1 flex flex-wrap items-center justify-between gap-2">
                      <span className="break-all font-mono text-caption font-semibold">
                        {qr.paymentCode}
                      </span>
                      <Button
                        variant="link"
                        size="sm"
                        onClick={() => void copy(qr.paymentCode)}
                      >
                        Sao chép
                      </Button>
                    </dd>
                  </div>
                </dl>
              )}
              {!blockedReason &&
                invoice &&
                !isCurrentAmount &&
                !query.isError && (
                  <Button
                    className="w-full"
                    disabled={isLoading || query.isFetching}
                    onClick={() => void refreshQr()}
                  >
                    {isLoading
                      ? "Đang tạo mã..."
                      : "Tạo lại QR theo số tiền còn thiếu"}
                  </Button>
                )}
              <p className="text-center text-caption text-muted">
                Trạng thái tự cập nhật khi cửa sổ đang mở. Chỉ ghi nhận thành
                công sau khi hệ thống xác nhận giao dịch.
              </p>
            </>
          )}
          {invoice?.hasPendingReconciliation && (
            <p className="rounded-app-md bg-warning-bg p-3 text-caption text-warning">
              Có giao dịch chờ đối soát. Vui lòng kiểm tra lịch sử giao dịch
              trước khi chuyển thêm tiền.
            </p>
          )}
          {error && (
            <p role="alert" className="text-body text-error-text">
              {error}
            </p>
          )}
        </div>
        <DialogFooter>
          <Button
            variant="outline"
            disabled={query.isFetching || isLoading}
            onClick={() => void query.refetch()}
          >
            Kiểm tra trạng thái
          </Button>
          <Button disabled={isLoading} onClick={onClose}>
            Đóng
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
