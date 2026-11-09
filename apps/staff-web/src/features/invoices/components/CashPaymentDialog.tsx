"use client";

import { useRef, useState, type FormEvent } from "react";
import toast from "react-hot-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/Input";
import { Textarea } from "@/components/ui/Textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/Dialog";
import { usePendingCashPayment } from "../hooks/usePendingCashPayment";
import {
  billingErrorMessage,
  collectionBlockedReason,
  formatVnd,
  isDefinitivePaymentRejection,
  parseVnd,
} from "../invoiceUtils";
import {
  cashPaymentSnapshot,
  clearCashPayment,
  parseCashPayment,
  saveCashPayment,
  type PendingCashPayment,
} from "../services/cashPaymentStorage";
import {
  useCreateCashPaymentMutation,
  useLazyGetInvoiceQuery,
} from "../services/invoicesApi";
import type { Invoice } from "../types/invoiceTypes";

export function CashPaymentDialog({
  invoice,
  accountId,
  isRefreshing,
  onClose,
}: {
  invoice: Invoice;
  accountId: string;
  isRefreshing: boolean;
  onClose: () => void;
}) {
  const [amount, setAmount] = useState(
    () => parseVnd(invoice.outstandingAmount)?.toString() ?? "",
  );
  const [note, setNote] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const savingRef = useRef(false);
  const { pending, hasStoredPayment, storageError } = usePendingCashPayment(
    accountId,
    invoice.id,
  );
  const [createPayment] = useCreateCashPaymentMutation();
  const [getInvoice] = useLazyGetInvoiceQuery();
  const shownAmount = pending?.payment.amount ?? amount;
  const shownNote = pending?.payment.note ?? (pending ? "" : note);
  const parsedAmount = /^[1-9]\d{0,11}$/.test(shownAmount)
    ? parseVnd(shownAmount)
    : null;
  const outstanding = parseVnd(invoice.outstandingAmount);
  const isAmountValid =
    parsedAmount !== null &&
    outstanding !== null &&
    parsedAmount <= outstanding;
  const blockedReason = collectionBlockedReason(invoice);
  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (
      savingRef.current ||
      storageError ||
      isRefreshing ||
      (!pending && (!isAmountValid || blockedReason))
    )
      return;
    savingRef.current = true;
    setIsSubmitting(true);
    setError("");
    let wasSubmitted = false;
    try {
      const execute = async () => {
        const stored = parseCashPayment(
          cashPaymentSnapshot(accountId, invoice.id),
          accountId,
          invoice.id,
        );
        if (
          pending &&
          (!stored || stored.idempotencyKey !== pending.idempotencyKey)
        ) {
          throw new Error(
            "Khoản thu đã được xử lý hoặc thay đổi ở cửa sổ khác. Vui lòng tải lại hóa đơn trước khi tiếp tục.",
          );
        }
        if (
          stored &&
          !pending &&
          (stored.payment.amount !== amount ||
            (stored.payment.note ?? "") !== note.trim())
        ) {
          throw new Error(
            "Có khoản thu khác đang chờ kết quả. Vui lòng đóng và mở lại cửa sổ để kiểm tra.",
          );
        }
        if (!stored) {
          const latest = await getInvoice(invoice.id, false).unwrap();
          if (
            collectionBlockedReason(latest) ||
            parseVnd(latest.outstandingAmount) !== outstanding
          ) {
            throw new Error(
              "Số dư hóa đơn đã thay đổi. Vui lòng kiểm tra lại trước khi xác nhận khoản thu.",
            );
          }
        }
        const attempt: PendingCashPayment = stored ?? {
          version: 1,
          accountId,
          invoiceId: invoice.id,
          idempotencyKey: crypto.randomUUID(),
          payment: {
            amount: parsedAmount!.toString(),
            method: "CASH",
            ...(note.trim() ? { note: note.trim() } : {}),
          },
        };
        saveCashPayment(attempt);
        wasSubmitted = true;
        const receipt = await createPayment({
          invoiceId: invoice.id,
          payment: attempt.payment,
          idempotencyKey: attempt.idempotencyKey,
        }).unwrap();
        clearCashPayment(accountId, invoice.id);
        toast.success(`Đã ghi nhận ${formatVnd(receipt.amount)} tiền mặt.`);
        onClose();
      };
      if (navigator.locks) {
        await navigator.locks.request(
          `mediconnect-cash:${accountId}:${invoice.id}`,
          execute,
        );
      } else {
        await execute();
      }
    } catch (failure) {
      if (wasSubmitted && isDefinitivePaymentRejection(failure))
        clearCashPayment(accountId, invoice.id);
      setError(
        failure instanceof Error
          ? failure.message
          : billingErrorMessage(failure),
      );
    } finally {
      savingRef.current = false;
      setIsSubmitting(false);
    }
  };
  return (
    <Dialog
      open
      onOpenChange={(open) => {
        if (!open && !savingRef.current) onClose();
      }}
    >
      <DialogContent
        className="max-h-[calc(100dvh-2rem)] overflow-y-auto"
        showCloseButton={!isSubmitting}
      >
        <DialogHeader>
          <DialogTitle>
            {hasStoredPayment ? "Kiểm tra khoản thu đang chờ" : "Thu tiền mặt"}
          </DialogTitle>
          <DialogDescription>
            {invoice.invoiceCode} · {invoice.patient.fullName}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={(event) => void submit(event)}>
          <div className="space-y-4 p-5 sm:p-6">
            <dl className="grid grid-cols-2 gap-2 rounded-app-lg bg-surface-hover p-4 text-body">
              <dt className="text-muted">Tổng hóa đơn</dt>
              <dd className="text-right font-semibold">
                {formatVnd(invoice.totalAmount)}
              </dd>
              <dt className="text-muted">Đã thu</dt>
              <dd className="text-right">
                {formatVnd(invoice.receivedAmount)}
              </dd>
              <dt className="font-semibold">Còn thiếu</dt>
              <dd className="text-right font-bold text-primary">
                {formatVnd(invoice.outstandingAmount)}
              </dd>
            </dl>
            {pending && (
              <p className="rounded-app-md bg-warning-bg p-3 text-caption text-warning">
                Khoản thu này chưa nhận được kết quả xác nhận. Thử lại để kiểm
                tra và ghi nhận đúng khoản thu cũ, không nhập thêm một khoản
                mới.
              </p>
            )}
            <label className="block space-y-1.5 text-body font-semibold">
              <span>Số tiền đã nhận (VND)</span>
              <Input
                required
                inputMode="numeric"
                pattern="[1-9][0-9]{0,11}"
                maxLength={12}
                value={shownAmount}
                disabled={isSubmitting || hasStoredPayment}
                onChange={(event) => setAmount(event.target.value)}
                aria-invalid={!pending && shownAmount !== "" && !isAmountValid}
              />
            </label>
            {!pending && shownAmount && !isAmountValid && (
              <p className="text-caption text-error-text">
                Nhập số tiền nguyên đồng, lớn hơn 0 và không vượt số tiền còn
                thiếu.
              </p>
            )}
            <label className="block space-y-1.5 text-body font-semibold">
              <span>Ghi chú (không bắt buộc)</span>
              <Textarea
                rows={3}
                maxLength={500}
                value={shownNote}
                disabled={isSubmitting || hasStoredPayment}
                onChange={(event) => setNote(event.target.value)}
              />
            </label>
            <p className="text-caption text-muted">
              Chỉ xác nhận sau khi đã nhận tiền mặt từ bệnh nhân. Có thể thu một
              phần và tiếp tục thu phần còn lại sau.
            </p>
            {(error || storageError || (!pending && blockedReason)) && (
              <p
                role="alert"
                className="rounded-app-md bg-error-bg p-3 text-body text-error-text"
              >
                {error || storageError || blockedReason}
              </p>
            )}
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              disabled={isSubmitting}
              onClick={onClose}
            >
              Đóng
            </Button>
            <Button
              type="submit"
              disabled={
                isSubmitting ||
                isRefreshing ||
                !!storageError ||
                (!pending && (!isAmountValid || !!blockedReason))
              }
            >
              {isSubmitting
                ? "Đang ghi nhận..."
                : pending
                  ? "Thử ghi nhận lại khoản thu"
                  : "Xác nhận đã nhận tiền"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
