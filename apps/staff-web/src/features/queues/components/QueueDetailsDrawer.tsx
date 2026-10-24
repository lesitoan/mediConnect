import { Button } from "@/components/ui/button";
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/Drawer";
import { QUEUE_ACTION_LABELS, QUEUE_STATUS_LABELS } from "../constants";
import { getQueueAction } from "../utils";
import type { QueueAction, QueueItem } from "../types/queueTypes";

interface QueueDetailsDrawerProps {
  item: QueueItem | null;
  isOpen: boolean;
  onClose: () => void;
  onAction: (item: QueueItem, action: QueueAction) => void;
}

export function QueueDetailsDrawer({
  item,
  isOpen,
  onClose,
  onAction,
}: QueueDetailsDrawerProps) {
  if (!item) return null;
  const action = getQueueAction(item.status);
  const rows = [
    { label: "Trạng thái", value: QUEUE_STATUS_LABELS[item.status] },
    {
      label: "Giờ hẹn",
      value: `${item.appointmentStart}–${item.appointmentEnd}`,
    },
    { label: "Bác sĩ", value: item.doctorName },
    { label: "Phòng khám", value: item.room },
    {
      label: "Loại lượt",
      value:
        item.visitType === "APPOINTMENT" ? "Có lịch hẹn" : "Khám trực tiếp",
    },
  ];

  return (
    <Drawer
      open={isOpen}
      onOpenChange={(isOpen) => !isOpen && onClose()}
      swipeDirection="right"
    >
      <DrawerContent className="sm:max-w-[440px]">
        <DrawerHeader className="h-16 flex-row items-center justify-between bg-surface px-6 py-3">
          <DrawerTitle>Chi tiết lượt chờ</DrawerTitle>
          <DrawerClose
            render={
              <Button
                type="button"
                variant="ghost"
                className="text-body text-muted"
              >
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
              {item.patientId} · STT {item.queueNumber}
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
        </div>
        <DrawerFooter className="justify-end gap-3 bg-background">
          <DrawerClose
            render={
              <Button
                type="button"
                variant="outline"
                className="h-9 px-4 text-body"
              >
                Đóng
              </Button>
            }
          />
          {action && (
            <Button
              type="button"
              className="h-9 px-5 text-body"
              onClick={() => onAction(item, action)}
            >
              {QUEUE_ACTION_LABELS[action]}
            </Button>
          )}
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  );
}
