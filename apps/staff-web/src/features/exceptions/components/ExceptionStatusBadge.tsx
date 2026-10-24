import { Badge } from "@/components/ui/Badge";
import { EXCEPTION_STATUS_LABELS } from "../constants";
import type { ExceptionStatus } from "../types/exceptionTypes";
import { getExceptionStatusVariant } from "../utils";

export function ExceptionStatusBadge({ status }: { status: ExceptionStatus }) {
  return (
    <Badge variant={getExceptionStatusVariant(status)} shape="pill">
      {EXCEPTION_STATUS_LABELS[status]}
    </Badge>
  );
}
