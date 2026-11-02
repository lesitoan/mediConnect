"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import toast from "react-hot-toast";
import {
  completeExamination,
  ExaminationApiError,
  listExaminations,
  markExaminationIncomplete,
  openExamination,
  pauseExamination,
  referExamination,
  resumeExamination,
  updateExamination,
} from "../services/examinationsService";
import type { Examination } from "../types/examinationTypes";

const COMPLETE_FIELD_LABELS: Record<string, string> = {
  complaint: "Lý do khám",
  clinicalNotes: "Khám lâm sàng",
  diagnosis: "Chẩn đoán",
};

export function useExaminations(isPaused = false) {
  const [items, setItems] = useState<Examination[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const listRequestId = useRef(0);
  const mutationRequestId = useRef(0);
  const activeMutations = useRef(0);

  const refetch = useCallback((force = false) => {
    if ((!force && isPaused) || activeMutations.current > 0) return;
    const currentRequest = ++listRequestId.current;
    setIsLoading(true);
    void listExaminations()
      .then((value) => {
        if (currentRequest === listRequestId.current) setItems(value);
      })
      .catch((error: unknown) => {
        if (currentRequest === listRequestId.current)
          toast.error(error instanceof Error ? error.message : "Không thể tải phiên khám");
      })
      .finally(() => {
        if (currentRequest === listRequestId.current) setIsLoading(false);
      });
  }, [isPaused]);

  useEffect(() => {
    refetch(true);
    const interval = window.setInterval(() => {
      if (!document.hidden && !isPaused) refetch();
    }, 10_000);
    const handleFocus = () => refetch();
    window.addEventListener("focus", handleFocus);
    return () => {
      window.clearInterval(interval);
      window.removeEventListener("focus", handleFocus);
    };
  }, [isPaused, refetch]);

  const open = async (id: string) => {
    const item = items.find((value) => value.id === id);
    if (!item || !["CALLED", "WAITING_RESULTS"].includes(item.status) || !item.updatedAt) return false;
    const currentRequest = ++mutationRequestId.current;
    activeMutations.current++;
    try {
      const value = await openExamination(item.careSessionId ?? id, item.updatedAt);
      if (currentRequest === mutationRequestId.current) {
        setItems((previous) => previous.map((entry) => entry.id === id ? value : entry));
      }
      return true;
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Không thể mở phiên khám");
      if ((error as { status?: number }).status === 409) refetch(true);
      return false;
    } finally {
      activeMutations.current--;
      refetch(true);
    }
  };

  const update = (id: string, changes: Partial<Examination>) => {
    const item = items.find((value) => value.id === id);
    const currentRequest = ++mutationRequestId.current;
    activeMutations.current++;
    let shouldRefetch = false;
    return updateExamination(item?.careSessionId ?? id, {
      ...changes,
      updatedAt: item?.updatedAt,
    })
      .then((value) => {
        setItems((previous) => previous.map((entry) => entry.id === id && currentRequest === mutationRequestId.current ? value : entry));
        return value;
      })
      .catch((error: unknown) => {
        toast.error(error instanceof Error ? error.message : "Không thể cập nhật phiên khám");
        shouldRefetch = (error as { status?: number }).status === 409;
        throw error;
      })
      .finally(() => {
        activeMutations.current--;
        if (shouldRefetch) refetch(true);
      });
  };

  const transition = async (id: string, action: "pause" | "resume" | "complete" | "referral" | "incomplete", values: { reason?: string; plan?: string; targetSpecialtyName?: string; priority?: "NORMAL" | "URGENT"; requestedDoctorId?: string; expectedUpdatedAt?: string }) => {
    const item = items.find((value) => value.id === id);
    const expectedUpdatedAt = values.expectedUpdatedAt ?? item?.updatedAt;
    if (!expectedUpdatedAt || item?.isLocked || !item || ["COMPLETED", "INCOMPLETE"].includes(item.status)) throw new Error("Phiên khám đã khóa hoặc không còn hiệu lực");
    const careSessionId = item.careSessionId ?? id;
    const requests = {
      pause: () => pauseExamination(careSessionId, values.reason ?? "", expectedUpdatedAt),
      resume: () => resumeExamination(careSessionId, expectedUpdatedAt),
      complete: () => completeExamination(careSessionId, expectedUpdatedAt),
      referral: () => referExamination(careSessionId, { targetSpecialtyName: values.targetSpecialtyName ?? "", reason: values.reason ?? "", priority: values.priority ?? "NORMAL", requestedDoctorId: values.requestedDoctorId, expectedUpdatedAt }),
      incomplete: () => markExaminationIncomplete(careSessionId, values.reason ?? "", values.plan ?? "", expectedUpdatedAt),
    };
    activeMutations.current++;
    let shouldRefetch = false;
    try {
      const value = await requests[action]();
      setItems((previous) => previous.map((entry) => entry.id === id ? value : entry));
      return value;
    } catch (error) {
      const status = (error as { status?: number }).status;
      shouldRefetch = status === 409;
      if (action === "complete" && status === 400 && error instanceof ExaminationApiError && error.fields.length) {
        const missingFields = error.fields.map((field) => {
          const key = field.split(" ")[0];
          return COMPLETE_FIELD_LABELS[key] ?? field;
        });
        toast.error(`Thiếu thông tin: ${missingFields.join(", ")}`);
      } else {
        toast.error(error instanceof Error ? error.message : "Không thể cập nhật phiên khám");
      }
      throw error;
    } finally {
      activeMutations.current--;
      if (shouldRefetch) refetch(true);
    }
  };

  return { items, isLoading, open, update, transition, refetch };
}
