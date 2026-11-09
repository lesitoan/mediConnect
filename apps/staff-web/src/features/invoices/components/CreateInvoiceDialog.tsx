"use client";

import { useRef, useState } from "react";
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
  formatBillingDate,
  formatVnd,
} from "../invoiceUtils";
import { useCreateInvoiceMutation } from "../services/invoicesApi";
import type { BillingCandidate } from "../types/invoiceTypes";

export function CreateInvoiceDialog({
  candidate,
  onClose,
  onCreated,
}: {
  candidate: BillingCandidate;
  onClose: () => void;
  onCreated: (id: string) => void;
}) {
  const [createInvoice, { isLoading }] = useCreateInvoiceMutation();
  const [error, setError] = useState("");
  const savingRef = useRef(false);
  const create = async () => {
    if (savingRef.current || !candidate.canCreateInvoice) return;
    savingRef.current = true;
    setError("");
    try {
      const invoice = await createInvoice(candidate.consultationId).unwrap();
      toast.success("Đã mở hóa đơn. Bạn có thể tiếp tục thu tiền.");
      onCreated(invoice.id);
    } catch (failure) {
      setError(billingErrorMessage(failure));
    } finally {
      savingRef.current = false;
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
        showCloseButton={!isLoading}
      >
        <DialogHeader>
          <DialogTitle>Lập hóa đơn khám bệnh</DialogTitle>
          <DialogDescription>
            Kiểm tra thông tin phiên khám trước khi lập hóa đơn.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-5 p-5 sm:p-6">
          <dl className="grid grid-cols-[auto_1fr] gap-x-5 gap-y-3 text-body">
            <dt className="text-muted">Bệnh nhân</dt>
            <dd className="font-semibold">{candidate.patient.fullName}</dd>
            <dt className="text-muted">Mã lịch hẹn</dt>
            <dd className="break-all">{candidate.appointmentCode}</dd>
            <dt className="text-muted">Bác sĩ</dt>
            <dd>{candidate.doctor.fullName}</dd>
            <dt className="text-muted">Chuyên khoa</dt>
            <dd>{candidate.specialty.name}</dd>
            <dt className="text-muted">Hoàn tất</dt>
            <dd>{formatBillingDate(candidate.completedAt)}</dd>
          </dl>
          <div className="flex items-center justify-between gap-4 rounded-app-lg bg-primary-light p-4">
            <span className="font-semibold">Phí khám dự kiến</span>
            <strong className="text-xl text-primary">
              {formatVnd(candidate.consultationFee)}
            </strong>
          </div>
          <p className="text-caption text-muted">
            Phí khám được lấy theo giá chuyên khoa tại thời điểm lập hóa đơn.
            Bước này chưa ghi nhận thanh toán.
          </p>
          {error && (
            <p
              role="alert"
              className="rounded-app-md bg-error-bg p-3 text-body text-error-text"
            >
              {error}
            </p>
          )}
        </div>
        <DialogFooter>
          <Button variant="outline" disabled={isLoading} onClick={onClose}>
            Hủy
          </Button>
          <Button
            disabled={isLoading || !candidate.canCreateInvoice}
            onClick={() => void create()}
          >
            {isLoading ? "Đang lập hóa đơn..." : "Xác nhận lập hóa đơn"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
