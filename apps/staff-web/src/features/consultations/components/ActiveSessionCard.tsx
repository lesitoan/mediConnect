import { ArrowRight } from "lucide-react";
import { toast } from "react-hot-toast";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/button";
import type { ConsultationSession } from "../types/consultationTypes";

interface ActiveSessionCardProps {
  session?: ConsultationSession;
}

export function ActiveSessionCard({ session }: ActiveSessionCardProps) {
  return (
    <section className="rounded-app-xl border border-border-strong bg-surface px-4 py-3.5 shadow-xs sm:px-5">
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-body font-bold text-foreground">
          Phiên khám đang thực hiện
        </h2>
        <span className="text-label text-muted">Theo trạng thái thực tế</span>
      </div>
      {session ? (
        <div className="mt-3 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="min-w-0">
            <p className="truncate text-body font-bold text-foreground">
              {session.patientName}
            </p>
            <p className="mt-0.5 text-caption text-muted">
              {session.sessionCode} • STT {session.queueNumber} • {session.room}
            </p>
          </div>
          <div className="flex items-center gap-2 self-start sm:self-auto">
            <Badge variant="success" shape="pill">
              <span className="size-1.5 rounded-full bg-success" />
              Đang khám
            </Badge>
            <Button
              type="button"
              size="sm"
              onClick={() => toast("Chức năng đang được kết nối")}
              aria-label={`Tiếp tục khám cho ${session.patientName}`}
              className="h-8 gap-1 px-3 text-caption font-semibold"
            >
              Tiếp tục
              <ArrowRight className="size-3.5" />
            </Button>
          </div>
        </div>
      ) : (
        <p className="mt-3 text-caption text-muted">
          Hiện không có phiên khám nào đang thực hiện.
        </p>
      )}
    </section>
  );
}
