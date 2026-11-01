"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import toast from "react-hot-toast";
import {
  listExaminations,
  openExamination,
  updateExamination,
} from "../services/examinationsService";
import type { Examination } from "../types/examinationTypes";

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
          toast.error(
            error instanceof Error ? error.message : "Không thể tải phiên khám",
          );
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

  const open = (id: string) => {
    const item = items.find((value) => value.id === id);
    if (!item || item.status !== "CALLED") return;
    const currentRequest = ++mutationRequestId.current;
    activeMutations.current++;
    void openExamination(item.careSessionId ?? id)
      .then((value) => {
        if (currentRequest === mutationRequestId.current)
          setItems((previous) =>
            previous.map((entry) => (entry.id === id ? value : entry)),
          );
      })
      .catch((error: unknown) => {
        if (currentRequest === mutationRequestId.current)
          toast.error(
            error instanceof Error ? error.message : "Không thể mở phiên khám",
          );
      })
      .finally(() => {
        activeMutations.current--;
        refetch(true);
      });
  };

  const update = (id: string, changes: Partial<Examination>) => {
    const item = items.find((value) => value.id === id);
    const currentRequest = ++mutationRequestId.current;
    activeMutations.current++;
    void updateExamination(item?.careSessionId ?? id, changes)
      .then((value) => {
        setItems((previous) =>
          previous.map((entry) =>
            entry.id === id && currentRequest === mutationRequestId.current
              ? value
              : entry,
          ),
        );
      })
      .catch((error: unknown) => {
        toast.error(
          error instanceof Error
            ? error.message
            : "Không thể cập nhật phiên khám",
        );
      })
      .finally(() => {
        activeMutations.current--;
        refetch(true);
      });
  };

  return { items, isLoading, open, update };
}
