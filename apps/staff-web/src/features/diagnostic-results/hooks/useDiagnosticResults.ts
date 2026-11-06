"use client";
import { useCallback, useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { listDiagnosticResults, type DiagnosticFilters } from '../services/diagnosticResultsService';
import type { DiagnosticOrder } from '../types/diagnosticTypes';

export function useDiagnosticResults(filters: DiagnosticFilters) {
  const [orders, setOrders] = useState<DiagnosticOrder[]>([]);
  const [pagination, setPagination] = useState({ page: 1, pageSize: 10, total: 0, totalPages: 0 });
  const [isLoading, setIsLoading] = useState(true);
  const load = useCallback(async (signal?: AbortSignal) => {
    try { const result = await listDiagnosticResults(filters, signal); setOrders(result.items); setPagination(result.pagination); }
    catch (error) { if (!signal?.aborted) toast.error(error instanceof Error ? error.message : 'Không thể tải danh sách CLS.'); }
    finally { if (!signal?.aborted) setIsLoading(false); }
  }, [filters]);
  useEffect(() => {
    const controller = new AbortController();
    const initialTimer = window.setTimeout(() => void load(controller.signal), 0);
    const timer = window.setInterval(() => void load(controller.signal), 10_000);
    return () => { controller.abort(); window.clearTimeout(initialTimer); window.clearInterval(timer); };
  }, [load]);
  return { orders, pagination, isLoading, reload: load };
}
