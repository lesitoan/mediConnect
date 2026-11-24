"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { listDiagnosticResults } from "../services/diagnosticResultsApi";
import type { DiagnosticOrder } from "../types/diagnosticTypes";

export function useDiagnosticResults() {
  const [orders, setOrders] = useState<DiagnosticOrder[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const hasLoaded = useRef(false);

  const refetch = useCallback(async () => {
    if (!hasLoaded.current) setIsLoading(true);
    try {
      setOrders(await listDiagnosticResults());
      setError("");
    } catch (error) {
      setError(
        error instanceof Error
          ? error.message
          : "Không thể tải hàng chờ CLS.",
      );
    } finally {
      hasLoaded.current = true;
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void refetch();
    const interval = window.setInterval(() => {
      if (!document.hidden) void refetch();
    }, 10000);
    const handleFocus = () => void refetch();
    window.addEventListener("focus", handleFocus);
    return () => {
      window.clearInterval(interval);
      window.removeEventListener("focus", handleFocus);
    };
  }, [refetch]);

  return { orders, isLoading, error, refetch };
}
