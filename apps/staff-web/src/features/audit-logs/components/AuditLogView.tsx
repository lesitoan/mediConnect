"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import { toast } from "react-hot-toast";
import axios from "axios";
import { useModal } from "@/hooks/useModal";
import { useTableFilters } from "@/hooks/useTableFilters";
import type { AuditLogEntry, AuditLogFilterValues, AuditLogPreset } from "../types/auditLogTypes";
import { DEFAULT_AUDIT_LOG_FILTERS } from "../types/auditLogTypes";
import { resolveAuditDateRange, exportAuditLogs, getAuditLog, getAuditLogs, getAuditOptions, type FilterOption } from "../services/auditLogsApi";
import { AuditLogHeader } from "./AuditLogHeader";
import { AuditLogFilters } from "./AuditLogFilters";
import { AuditLogTable } from "./AuditLogTable";
import { AuditLogDetailDrawer } from "./AuditLogDetailDrawer";

export function AuditLogView() {
  const { filters, setFilter, setFilters } = useTableFilters<AuditLogFilterValues>(DEFAULT_AUDIT_LOG_FILTERS, "replace");
  const [now, setNow] = useState(() => Date.now());
  const [searchText, setSearchText] = useState(filters.search);
  const pendingSearches = useRef<string[]>([]);
  const searchParams = useSearchParams();
  const detailDrawer = useModal<AuditLogEntry>();
  const [logs, setLogs] = useState<AuditLogEntry[]>([]);
  const [totalItems, setTotalItems] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [options, setOptions] = useState<{ actors: FilterOption[]; actions: FilterOption[] }>({ actors: [], actions: [] });
  const [isExporting, setIsExporting] = useState(false);
  const detailRequest = useRef<AbortController | null>(null);
  const lastUrlId = useRef<string | null>(null);
  const { open: openDetail, close: closeDetail } = detailDrawer;
  const { preset, startDate, endDate } = resolveAuditDateRange(filters, now);
  const effectiveFilters = useMemo(() => ({ ...filters, startDate, endDate }), [filters, startDate, endDate]);

  useEffect(() => {
    const index = pendingSearches.current.indexOf(filters.search);
    if (index >= 0) { pendingSearches.current.splice(0, index + 1); return; }
    pendingSearches.current = [];
    // External URL navigation resets the input; our own URL updates must preserve newer typing.
    setSearchText(filters.search);
  }, [filters.search]);

  useEffect(() => {
    if (searchText === filters.search) return;
    const timer = window.setTimeout(() => {
      pendingSearches.current.push(searchText);
      setFilters({ search: searchText, page: 1 });
    }, 350);
    return () => window.clearTimeout(timer);
  }, [searchText, filters.search, setFilters]);

  useEffect(() => {
    let controller: AbortController;
    const load = () => {
      setNow(Date.now());
      controller?.abort();
      const request = new AbortController();
      controller = request;
      setIsLoading(true);
      void getAuditLogs(effectiveFilters, request.signal).then(({ items, totalItems: total }) => {
        if (!request.signal.aborted) { setLogs(items); setTotalItems(total); setLoadError(null); }
      }).catch((error: unknown) => {
        if (!request.signal.aborted) {
          const status = axios.isAxiosError(error) ? error.response?.status : undefined;
          setLogs([]); setTotalItems(0);
          if (status === 401 || status === 403) closeDetail();
          setLoadError(status === 401 ? "Phiên đăng nhập đã hết hạn." : status === 403 ? "Bạn không có quyền xem nhật ký." : "Không thể tải nhật ký.");
        }
      }).finally(() => { if (!request.signal.aborted) setIsLoading(false); });
      void getAuditOptions(effectiveFilters.startDate, effectiveFilters.endDate, request.signal).then((result) => {
        if (!request.signal.aborted) setOptions(result);
      }).catch(() => { if (!request.signal.aborted) setOptions({ actors: [], actions: [] }); });
    };
    const initial = window.setTimeout(load, 0);
    const timer = window.setInterval(load, 30_000);
    window.addEventListener("focus", load);
    return () => { window.clearTimeout(initial); window.clearInterval(timer); window.removeEventListener("focus", load); controller?.abort(); };
  }, [effectiveFilters, closeDetail]);

  const showDetail = useCallback(async (id: string) => {
    detailRequest.current?.abort();
    const controller = new AbortController();
    detailRequest.current = controller;
    try { const item = await getAuditLog(id, controller.signal); if (!controller.signal.aborted) openDetail(item); }
    catch { if (!controller.signal.aborted) toast.error("Không thể tải chi tiết nhật ký."); }
  }, [openDetail]);

  useEffect(() => {
    const id = searchParams.get("logId") || searchParams.get("id");
    if (id && id !== lastUrlId.current) { lastUrlId.current = id; void showDetail(id); }
    if (!id) lastUrlId.current = null;
    return () => detailRequest.current?.abort();
  }, [searchParams, showDetail]);

  const handlePresetChange = (preset: AuditLogPreset) => setFilters({ preset, startDate: "", endDate: "", executor: "ALL", actionType: "ALL", page: 1 });
  const handleExport = async () => {
    if (isExporting) return;
    setIsExporting(true);
    try { await exportAuditLogs({ ...effectiveFilters, ...resolveAuditDateRange(filters), search: searchText }); toast.success("Đã xuất nhật ký CSV."); }
    catch { toast.error("Không thể xuất nhật ký. Kiểm tra quyền, dữ liệu và khoảng ngày (tối đa 31 ngày)."); }
    finally { setIsExporting(false); }
  };

  return (
    <div className="mx-auto w-full max-w-7xl">
      <AuditLogHeader onExport={() => void handleExport()} isExporting={isExporting} />
      <AuditLogFilters
        dateRange={{ startDate, endDate }}
        onDateRangeChange={(range) => setFilters({ ...range, preset: "", executor: "ALL", actionType: "ALL", page: 1 })}
        preset={preset} onPresetChange={handlePresetChange}
        executor={filters.executor} onExecutorChange={(executor) => setFilters({ executor, page: 1 })}
        actionType={filters.actionType} onActionTypeChange={(actionType) => setFilters({ actionType, page: 1 })}
        search={searchText} onSearchChange={setSearchText}
        executorOptions={options.actors} actionOptions={options.actions}
      />
      {loadError ? <p role="alert" className="text-body text-error">Không thể tải nhật ký: {loadError}</p> : isLoading ? <p className="text-body text-muted">Đang tải nhật ký...</p> : (
        <AuditLogTable logs={logs} totalItems={totalItems} currentPage={filters.page} pageSize={filters.pageSize}
          onPageChange={(page) => setFilter("page", page)} onPageSizeChange={(pageSize) => setFilters({ pageSize, page: 1 })}
          onSelectLog={(log) => void showDetail(log.id)} />
      )}
      <AuditLogDetailDrawer isOpen={detailDrawer.isOpen} log={detailDrawer.data} onClose={() => { detailRequest.current?.abort(); closeDetail(); }} />
    </div>
  );
}
