"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import { toast } from "react-hot-toast";
import { getApiErrorMessage } from "@/lib/api/apiErrorMessage";
import { Loading } from "@/components/shared/Loading";
import { useModal } from "@/hooks/useModal";
import { useTableFilters } from "@/hooks/useTableFilters";
import type {
  AuditLogEntry,
  AuditLogFilterValues,
  AuditLogPreset,
} from "../types/auditLogTypes";
import { DEFAULT_AUDIT_LOG_FILTERS } from "../types/auditLogTypes";
import {
  resolveAuditDateRange,
  exportAuditLogs,
  useGetAuditLogsQuery,
  useLazyGetAuditLogQuery,
  useGetAuditOptionsQuery,
} from "../services/auditLogsApi";
import { AuditLogHeader } from "./AuditLogHeader";
import { AuditLogFilters } from "./AuditLogFilters";
import { AuditLogTable } from "./AuditLogTable";
import { AuditLogDetailDrawer } from "./AuditLogDetailDrawer";

export function AuditLogView() {
  const { filters, setFilter, setFilters } =
    useTableFilters<AuditLogFilterValues>(DEFAULT_AUDIT_LOG_FILTERS, "replace");
  const [now, setNow] = useState(() => Date.now());
  const [searchText, setSearchText] = useState(filters.search);
  const pendingSearches = useRef<string[]>([]);
  const searchParams = useSearchParams();
  const detailDrawer = useModal<AuditLogEntry>();
  const [isExporting, setIsExporting] = useState(false);
  const [loadDetail] = useLazyGetAuditLogQuery();
  const detailRequest = useRef<ReturnType<typeof loadDetail> | null>(null);
  const lastUrlId = useRef<string | null>(null);
  const { open: openDetail, close: closeDetail } = detailDrawer;
  const { preset, startDate, endDate } = resolveAuditDateRange(filters, now);
  const effectiveFilters = useMemo(
    () => ({ ...filters, startDate, endDate }),
    [filters, startDate, endDate],
  );
  const logs = useGetAuditLogsQuery(effectiveFilters, {
    pollingInterval: 30_000,
    refetchOnMountOrArgChange: true,
  });
  const options = useGetAuditOptionsQuery(
    { startDate, endDate },
    {
      pollingInterval: 30_000,
      refetchOnMountOrArgChange: true,
    },
  );

  useEffect(() => {
    const index = pendingSearches.current.indexOf(filters.search);
    if (index >= 0) {
      pendingSearches.current.splice(0, index + 1);
      return;
    }
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
    const updateClock = () => setNow(Date.now());
    const timer = window.setInterval(updateClock, 30_000);
    window.addEventListener("focus", updateClock);
    return () => {
      window.clearInterval(timer);
      window.removeEventListener("focus", updateClock);
    };
  }, []);

  const errorStatus =
    logs.error && "status" in logs.error ? logs.error.status : undefined;
  useEffect(() => {
    if (errorStatus === 401 || errorStatus === 403) {
      detailRequest.current?.abort();
      detailRequest.current = null;
      closeDetail();
    }
  }, [errorStatus, closeDetail]);

  const showDetail = useCallback(
    async (id: string) => {
      if (detailRequest.current?.arg === id) return;
      detailRequest.current?.abort();
      const request = loadDetail(id);
      detailRequest.current = request;
      try {
        const item = await request.unwrap();
        if (detailRequest.current === request) openDetail(item);
      } catch (error) {
        if (detailRequest.current === request)
          toast.error(getApiErrorMessage(error));
      } finally {
        if (detailRequest.current === request) detailRequest.current = null;
      }
    },
    [loadDetail, openDetail],
  );

  useEffect(() => {
    const id = searchParams.get("logId") || searchParams.get("id");
    if (id && id !== lastUrlId.current) {
      lastUrlId.current = id;
      void showDetail(id);
    }
    if (!id) lastUrlId.current = null;
    return () => {
      detailRequest.current?.abort();
      detailRequest.current = null;
    };
  }, [searchParams, showDetail]);

  const handlePresetChange = (preset: AuditLogPreset) =>
    setFilters({
      preset,
      startDate: "",
      endDate: "",
      executor: "ALL",
      actionType: "ALL",
      page: 1,
    });
  const handleExport = async () => {
    if (isExporting) return;
    setIsExporting(true);
    try {
      await exportAuditLogs({
        ...effectiveFilters,
        ...resolveAuditDateRange(filters),
        search: searchText,
      });
      void logs.refetch();
      void options.refetch();
      toast.success("Đã xuất nhật ký CSV.");
    } catch (error) {
      toast.error(getApiErrorMessage(error));
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="mx-auto w-full max-w-7xl">
      <AuditLogHeader
        onExport={() => void handleExport()}
        isExporting={isExporting}
      />
      <AuditLogFilters
        dateRange={{ startDate, endDate }}
        onDateRangeChange={(range) =>
          setFilters({
            ...range,
            preset: "",
            executor: "ALL",
            actionType: "ALL",
            page: 1,
          })
        }
        preset={preset}
        onPresetChange={handlePresetChange}
        executor={filters.executor}
        onExecutorChange={(executor) => setFilters({ executor, page: 1 })}
        actionType={filters.actionType}
        onActionTypeChange={(actionType) => setFilters({ actionType, page: 1 })}
        search={searchText}
        onSearchChange={setSearchText}
        executorOptions={
          options.isError ? [] : (options.currentData?.actors ?? [])
        }
        actionOptions={
          options.isError ? [] : (options.currentData?.actions ?? [])
        }
      />
      {logs.isError ? (
        <p role="alert" className="text-body text-error">
          Không thể tải nhật ký: {getApiErrorMessage(logs.error)}
        </p>
      ) : logs.isFetching ? (
        <Loading label="Đang tải nhật ký..." />
      ) : (
        <AuditLogTable
          logs={logs.currentData?.items ?? []}
          totalItems={logs.currentData?.totalItems ?? 0}
          currentPage={filters.page}
          pageSize={filters.pageSize}
          onPageChange={(page) => setFilter("page", page)}
          onPageSizeChange={(pageSize) => setFilters({ pageSize, page: 1 })}
          onSelectLog={(log) => void showDetail(log.id)}
        />
      )}
      <AuditLogDetailDrawer
        isOpen={detailDrawer.isOpen}
        log={detailDrawer.data}
        onClose={() => {
          detailRequest.current?.abort();
          detailRequest.current = null;
          closeDetail();
        }}
      />
    </div>
  );
}
