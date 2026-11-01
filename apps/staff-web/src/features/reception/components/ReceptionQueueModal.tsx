"use client";

import { useCallback, useEffect, useState } from "react";
import { RefreshCw } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/Dialog";
import { Button } from "@/components/ui/button";
import { getReceptionError, getReceptionQueue } from "../services/receptionService";
import type {
  PatientAppointment,
  ReceptionQueueItem,
} from "../types/receptionTypes";

interface ReceptionQueueModalProps {
  appointment: PatientAppointment | null;
  isOpen: boolean;
  onClose: () => void;
}

function clinicToday(): string {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Ho_Chi_Minh",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(new Date());
  const values = Object.fromEntries(
    parts
      .filter(({ type }) => type !== "literal")
      .map(({ type, value }) => [type, value]),
  );
  return `${values.year}-${values.month}-${values.day}`;
}

export function ReceptionQueueModal({
  appointment,
  isOpen,
  onClose,
}: ReceptionQueueModalProps) {
  const [items, setItems] = useState<ReceptionQueueItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const loadQueue = useCallback(async () => {
    if (!appointment?.specialtyId) return;
    setIsLoading(true);
    setErrorMessage(null);
    try {
      const response = await getReceptionQueue({
        specialtyId: appointment.specialtyId,
        date: clinicToday(),
      });
      setItems(response.items);
    } catch (error) {
      setErrorMessage(getReceptionError(error).message);
    } finally {
      setIsLoading(false);
    }
  }, [appointment]);

  useEffect(() => {
    if (!isOpen) return;
    const timer = window.setTimeout(() => void loadQueue(), 0);
    return () => window.clearTimeout(timer);
  }, [isOpen, loadQueue]);

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-[720px]">
        <DialogHeader>
          <DialogTitle>Hàng chờ {appointment?.specialtyName ?? ""}</DialogTitle>
        </DialogHeader>
        <div className="flex justify-end">
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={isLoading}
            onClick={() => void loadQueue()}
          >
            <RefreshCw className="size-3.5" />
            Làm mới
          </Button>
        </div>
        {isLoading ? (
          <div className="p-8 text-center text-muted">Đang tải hàng chờ...</div>
        ) : errorMessage ? (
          <div className="space-y-3 p-8 text-center">
            <p className="text-body text-error">{errorMessage}</p>
            <Button type="button" size="sm" onClick={() => void loadQueue()}>
              Thử lại
            </Button>
          </div>
        ) : items.length === 0 ? (
          <div className="p-8 text-center text-muted">Chưa có bệnh nhân trong hàng chờ.</div>
        ) : (
          <div className="max-h-[420px] overflow-auto">
            <table className="w-full text-left text-caption">
              <thead>
                <tr className="border-b border-border text-muted">
                  <th className="px-2 py-2">STT</th>
                  <th className="px-2 py-2">Bệnh nhân</th>
                  <th className="px-2 py-2">Giờ hẹn</th>
                  <th className="px-2 py-2">Trạng thái</th>
                </tr>
              </thead>
              <tbody>
                {items.map((item) => (
                  <tr
                    key={item.id}
                    className={
                      item.appointmentId === appointment?.id
                        ? "bg-primary-light/40 font-semibold"
                        : "border-b border-border/60"
                    }
                  >
                    <td className="px-2 py-2 font-bold">
                      {item.queueDisplayNumber ?? ""}
                    </td>
                    <td className="px-2 py-2">{item.patientName}</td>
                    <td className="px-2 py-2">{item.appointmentTime}</td>
                    <td className="px-2 py-2">{item.status}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
