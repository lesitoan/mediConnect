"use client";
import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Badge } from "@/components/ui/Badge";
import { Card } from "@/components/ui/Card";
import {
  Table,
  TableHeader,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
} from "@/components/ui/Table";
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerDescription,
  DrawerFooter,
} from "@/components/ui/Drawer";
import { Pagination } from "@/components/shared/Pagination";
import { useModal } from "@/hooks/useModal";
import { useTableFilters } from "@/hooks/useTableFilters";
import { useDiagnosticPreview } from "../hooks/useDiagnosticPreview";
import { ensureDiagnosticDemoOrders } from "../services/diagnosticPreviewStore";
import {
  DIAGNOSTIC_CATEGORY_LABELS,
  DIAGNOSTIC_STATUS_LABELS,
} from "../types/diagnosticTypes";
import { formatDiagnosticTime } from "../diagnosticUtils";
import { DiagnosticResultEditor } from "./DiagnosticResultEditor";
import { DiagnosticResultsPanel } from "./DiagnosticResultsPanel";

const DEFAULT_FILTERS = {
  search: "",
  category: "ALL",
  status: "ALL",
  page: 1,
  pageSize: 10,
};
const PAGE_SIZES = [10, 20] as const;
export function DiagnosticResultsView() {
  const orders = useDiagnosticPreview();
  const { filters, setFilter, resetFilters } = useTableFilters(
    DEFAULT_FILTERS,
    "replace",
  );
  const editor = useModal<string>();
  const record = useModal<string>();
  useEffect(() => {
    ensureDiagnosticDemoOrders();
  }, []);
  const normalized = filters.search.trim().toLocaleLowerCase("vi");
  const filtered = orders.filter(
    (order) =>
      (filters.category === "ALL" || order.category === filters.category) &&
      (filters.status === "ALL" || order.status === filters.status) &&
      [
        order.visit.patientName,
        order.visit.patientCode,
        order.visit.examinationCode,
        order.service,
        order.serviceCode,
      ].some((value) => value.toLocaleLowerCase("vi").includes(normalized)),
  );
  const size = PAGE_SIZES.find((value) => value === filters.pageSize) ?? 10;
  const totalPages = Math.max(1, Math.ceil(filtered.length / size));
  const page = Math.min(totalPages, Math.max(1, Math.floor(filters.page) || 1));
  const selectedVisit = orders.find(
    (order) => order.visit.careSessionId === record.data,
  )?.visit;
  const viewRecord = (id: string) => {
    editor.close();
    record.open(id);
  };
  return (
    <div className="mx-auto w-full max-w-7xl space-y-5">
      <header className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-display font-bold">Trả kết quả cận lâm sàng</h1>
          <p className="mt-1 text-body text-muted">
            Tiếp nhận chỉ định, đính kèm ảnh xét nghiệm / chụp chiếu và trả về
            hồ sơ khám.
          </p>
        </div>
        <Badge variant="brand">Giao diện minh họa</Badge>
      </header>
      <div className="rounded-app-xl border border-primary/20 bg-primary-light p-4 text-body">
        <p className="font-semibold text-primary">
          Bản UI xem thử — chưa kết nối trả kết quả thật
        </p>
        <p className="mt-1 text-muted">
          Dữ liệu và ảnh chỉ giữ trong tab hiện tại. Tải lại trang sẽ mất bản
          nháp và kết quả minh họa. Các phiên khám có chỉ định đã mở trong tab
          này sẽ xuất hiện ở danh sách.
        </p>
      </div>
      <div className="grid gap-3 sm:grid-cols-3">
        {(["WAITING", "IN_PROGRESS", "COMPLETED"] as const).map((status) => (
          <Card key={status} className="p-4">
            <p className="text-body text-muted">
              {DIAGNOSTIC_STATUS_LABELS[status]}
            </p>
            <p
              className={
                "mt-1 text-display font-bold " +
                (status === "COMPLETED"
                  ? "text-success"
                  : status === "IN_PROGRESS"
                    ? "text-primary"
                    : "text-foreground")
              }
            >
              {orders.filter((order) => order.status === status).length}
            </p>
          </Card>
        ))}
      </div>
      <div className="flex flex-col gap-3 rounded-app-xl border border-border-strong bg-surface p-4 lg:flex-row lg:items-center">
        <Input
          aria-label="Tìm chỉ định"
          placeholder="Tìm bệnh nhân, mã hồ sơ hoặc dịch vụ..."
          value={filters.search}
          maxLength={100}
          className="min-w-0 flex-1"
          onChange={(event) => setFilter("search", event.target.value)}
        />
        <Select
          aria-label="Loại chỉ định"
          value={filters.category}
          wrapperClassName="w-full lg:w-56 lg:shrink-0"
          onChange={(event) => setFilter("category", event.target.value)}
        >
          <option value="ALL">Tất cả loại chỉ định</option>
          {Object.entries(DIAGNOSTIC_CATEGORY_LABELS).map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </Select>
        <Select
          aria-label="Trạng thái chỉ định"
          value={filters.status}
          wrapperClassName="w-full lg:w-48 lg:shrink-0"
          onChange={(event) => setFilter("status", event.target.value)}
        >
          <option value="ALL">Tất cả trạng thái</option>
          {Object.entries(DIAGNOSTIC_STATUS_LABELS).map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </Select>
      </div>
      <Card className="overflow-hidden border-border-strong">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border px-4 py-3">
          <h2 className="text-heading font-bold">Danh sách chỉ định</h2>
          <p className="text-caption text-muted">
            Tiếp nhận · Đính kèm ảnh · Hoàn tất · Hồ sơ khám
          </p>
        </div>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Bệnh nhân / Phiên khám</TableHead>
              <TableHead>Chỉ định</TableHead>
              <TableHead>Thời gian</TableHead>
              <TableHead>Trạng thái</TableHead>
              <TableHead>Thao tác</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.slice((page - 1) * size, page * size).map((order) => (
              <TableRow key={order.id}>
                <TableCell>
                  <p className="font-semibold">{order.visit.patientName}</p>
                  <p className="mt-1 text-caption text-muted">
                    {order.visit.patientCode} · {order.visit.examinationCode}
                  </p>
                </TableCell>
                <TableCell className="max-w-xs whitespace-normal">
                  <p className="font-medium">{order.service}</p>
                  <p className="mt-1 text-caption text-muted">
                    {order.serviceCode} ·{" "}
                    {DIAGNOSTIC_CATEGORY_LABELS[order.category]}
                  </p>
                </TableCell>
                <TableCell className="text-caption text-muted">
                  {formatDiagnosticTime(order.completedAt ?? order.orderedAt)}
                  <p className="mt-1">
                    {order.completedAt
                      ? "Đã trả kết quả"
                      : "Thời điểm chỉ định"}
                  </p>
                </TableCell>
                <TableCell>
                  <Badge
                    variant={
                      order.status === "COMPLETED"
                        ? "success"
                        : order.status === "IN_PROGRESS"
                          ? "warning"
                          : "neutral"
                    }
                  >
                    {DIAGNOSTIC_STATUS_LABELS[order.status]}
                  </Badge>
                </TableCell>
                <TableCell>
                  <div className="flex flex-wrap gap-2">
                    <Button
                      size="sm"
                      variant={
                        order.status === "COMPLETED" ? "outline" : "default"
                      }
                      onClick={() => editor.open(order.id)}
                    >
                      {order.status === "WAITING"
                        ? "Tiếp nhận"
                        : order.status === "IN_PROGRESS"
                          ? "Nhập kết quả"
                          : "Xem kết quả"}
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => record.open(order.visit.careSessionId)}
                    >
                      Hồ sơ khám
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
        {!filtered.length && (
          <div className="space-y-3 p-10 text-center">
            <p className="text-body text-muted">Không có chỉ định phù hợp.</p>
            <Button variant="outline" onClick={resetFilters}>
              Bỏ bộ lọc
            </Button>
          </div>
        )}
        <Pagination
          currentPage={page}
          totalPages={totalPages}
          totalItems={filtered.length}
          pageSize={size}
          pageSizeOptions={PAGE_SIZES}
          itemName="chỉ định"
          onPageChange={(value) => setFilter("page", value)}
          onPageSizeChange={(value) => setFilter("pageSize", value)}
        />
      </Card>
      {editor.isOpen && editor.data && (
        <DiagnosticResultEditor
          key={editor.data}
          orderId={editor.data}
          onClose={editor.close}
          onViewRecord={viewRecord}
        />
      )}
      <Drawer
        open={record.isOpen}
        onOpenChange={(open) => {
          if (!open) record.close();
        }}
      >
        <DrawerContent className="w-full max-w-3xl">
          <DrawerHeader>
            <DrawerTitle>Hồ sơ bệnh án đang khám</DrawerTitle>
            <DrawerDescription>
              Xem kết quả đã trả về đúng bệnh nhân và phiên khám · Minh họa
              trong tab hiện tại
            </DrawerDescription>
          </DrawerHeader>
          <div className="min-h-0 flex-1 space-y-5 overflow-y-auto p-5">
            {selectedVisit && (
              <>
                <Card className="space-y-2 bg-background p-4">
                  <h2 className="text-title font-bold">
                    {selectedVisit.patientName}
                  </h2>
                  <p className="text-body text-muted">
                    {selectedVisit.patientCode} · {selectedVisit.demographics}
                  </p>
                  <p className="text-body">
                    Phiên khám #{selectedVisit.examinationCode} ·{" "}
                    {selectedVisit.room}
                  </p>
                  <p className="text-caption text-muted">
                    Lý do chỉ định: {selectedVisit.reason || "Chưa ghi nhận"}
                  </p>
                </Card>
                <DiagnosticResultsPanel
                  careSessionId={selectedVisit.careSessionId}
                />
              </>
            )}
          </div>
          <DrawerFooter>
            <Button variant="outline" onClick={record.close}>
              Đóng hồ sơ
            </Button>
          </DrawerFooter>
        </DrawerContent>
      </Drawer>
    </div>
  );
}
