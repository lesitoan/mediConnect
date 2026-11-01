import { Button } from "@/components/ui/button";
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/Drawer";
import { QUEUE_STATUS_LABELS } from "../constants";
import type { QueueItem } from "../types/queueTypes";

interface QueueDetailsDrawerProps {
  item: QueueItem | null;
  isOpen: boolean;
  onClose: () => void;
}

export function QueueDetailsDrawer({
  item,
  isOpen,
  onClose,
}: QueueDetailsDrawerProps) {
  if (!item) return null;
  const rows = [
    {
      label: "Trạng thái",
      value: item.isNoShow ? "Vắng mặt" : QUEUE_STATUS_LABELS[item.status],
    },
    { label: "Giờ hẹn", value: item.appointmentTime },
    { label: "Mã lịch hẹn", value: item.appointmentCode },
    { label: "Bác sĩ", value: item.doctorName },
    { label: "Chuyên khoa", value: item.specialtyName },
    { label: "Phòng khám", value: item.room ?? "Chưa cập nhật" },
    { label: "Số lần bỏ qua", value: String(item.skipCount) },
  ];

  return (
    <Drawer
      open={isOpen}
      onOpenChange={(open) => !open && onClose()}
      swipeDirection="right"
    >
      <DrawerContent className="sm:max-w-[440px]">
        <DrawerHeader className="h-16 flex-row items-center justify-between bg-surface px-6 py-3">
          <DrawerTitle>Chi tiết lượt khám</DrawerTitle>
          <DrawerClose
            render={
              <Button type="button" variant="ghost">
                Đóng
              </Button>
            }
          />
        </DrawerHeader>
        <div className="flex-1 overflow-y-auto p-6">
          <div className="space-y-1 border-b border-border/60 pb-4">
            <h3 className="text-title font-bold text-foreground">
              {item.patientName}
            </h3>
            <DrawerDescription className="text-caption font-medium">
              {item.patientCode} · STT {item.queueDisplayNumber ?? "—"}
            </DrawerDescription>
          </div>
          <dl>
            {rows.map((row) => (
              <div
                key={row.label}
                className="flex items-start justify-between gap-4 border-b border-border/60 py-3.5 text-body"
              >
                <dt className="shrink-0 font-medium text-muted">{row.label}</dt>
                <dd className="text-right font-semibold text-foreground">
                  {row.value}
                </dd>
              </div>
            ))}
          </dl>
          {item.status === "SKIPPED" && (
            <p className="mt-4 text-body font-semibold">
              Lần bỏ qua tiếp theo: {item.nextSkipCount}
            </p>
          )}
          {!item.canCall &&
            item.status === "SKIPPED" &&
            item.cannotCallReason && (
              <p className="mt-2 text-caption text-muted">
                {item.cannotCallReason}
              </p>
            )}
        </div>
      </DrawerContent>
    </Drawer>
  );
}
