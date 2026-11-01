"use client";
import { useState } from "react";
import Link from "next/link";
import { RefreshCw, Search, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/Input";
import { Card } from "@/components/ui/Card";
import { useTableFilters } from "@/hooks/useTableFilters";
type DoctorQueueStatus = "WAITING" | "CALLING" | "IN_PROGRESS" | "SKIPPED";
const DEFAULT_FILTERS = { search: "" };
const INITIAL_QUEUE = [
  {
    id: "q1",
    name: "Nguyễn Thị Thu Hà",
    patientCode: "BN-99214",
    number: "A-023",
    time: "09:00",
    note: "Đúng giờ",
    status: "WAITING" as DoctorQueueStatus,
    visit: "PK-8896",
  },
  {
    id: "q2",
    name: "Trần Đình Mạnh",
    patientCode: "BN-08417",
    number: "A-024",
    time: "09:15",
    note: "Đến trễ (+15p)",
    status: "WAITING" as DoctorQueueStatus,
    visit: "PK-8892",
  },
  {
    id: "q3",
    name: "Phạm Văn Tuấn",
    patientCode: "BN-10923",
    number: "A-027",
    time: "09:30",
    note: "Đúng giờ",
    status: "WAITING" as DoctorQueueStatus,
    visit: "QUEUE-WAITING",
  },
  {
    id: "q4",
    name: "Hoàng Mai Linh",
    patientCode: "BN-11480",
    number: "A-022",
    time: "08:45",
    note: "Đã gọi",
    status: "CALLING" as DoctorQueueStatus,
    visit: "QUEUE-CALLING",
  },
  {
    id: "q5",
    name: "Vũ Hải Đăng",
    patientCode: "BN-12601",
    number: "A-021",
    time: "08:30",
    note: "Đang khám",
    status: "IN_PROGRESS" as DoctorQueueStatus,
    visit: "QUEUE-CURRENT",
  },
  {
    id: "q6",
    name: "Nguyễn Bích Ngọc",
    patientCode: "BN-12562",
    number: "A-020",
    time: "08:15",
    note: "Chờ kết quả CLS",
    status: "IN_PROGRESS" as DoctorQueueStatus,
    visit: "QUEUE-RESULTS",
  },
  {
    id: "q7",
    name: "Dương Quốc Bảo",
    patientCode: "BN-10683",
    number: "A-016",
    time: "08:45",
    note: "Vắng mặt",
    status: "SKIPPED" as DoctorQueueStatus,
    visit: "QUEUE-SKIPPED",
  },
];
const COLUMNS: [DoctorQueueStatus, string, string][] = [
  ["WAITING", "Đang chờ", "bg-warning"],
  ["CALLING", "Đang gọi", "bg-primary"],
  ["IN_PROGRESS", "Đang khám", "bg-success"],
  ["SKIPPED", "Bỏ qua lượt", "bg-muted"],
];
export function DoctorQueueView() {
  const [items, setItems] = useState(INITIAL_QUEUE);
  const [recalls, setRecalls] = useState(1);
  const { filters, setFilter } = useTableFilters(DEFAULT_FILTERS, "replace");
  const change = (id: string, status: DoctorQueueStatus) =>
    setItems((previous) =>
      previous.map((item) => (item.id === id ? { ...item, status } : item)),
    );
  return (
    <div className="mx-auto w-full max-w-7xl space-y-6">
      <header className="flex flex-wrap justify-between gap-3">
        <div>
          <h1 className="text-display font-bold">Hàng chờ khám của tôi</h1>
          <p className="mt-1 text-body text-muted">
            TS.BS Lê Quang Huy · Phòng P.302 ·{" "}
            <span className="rounded-app-sm bg-success-bg px-2 py-1 text-caption font-semibold text-success">
              Ca sáng: 07:30 – 11:30
            </span>
          </p>
        </div>
        <Button
          variant="outline"
          onClick={() => {
            setItems(INITIAL_QUEUE);
            setRecalls(1);
          }}
        >
          <RefreshCw className="size-4" />
          Làm mới
        </Button>
      </header>
      <Card className="flex items-center gap-3 p-4 shadow-none">
        <span className="rounded-app-lg bg-primary-light p-2 text-primary">
          <CheckCircle2 className="size-4" />
        </span>
        <div>
          <h2 className="text-body font-semibold">
            Các lượt được phân công cho bác sĩ hiện tại
          </h2>
          <p className="mt-1 text-caption text-muted">
            Tự động đồng bộ theo thời gian thực từ quầy Lễ tân & Phân luồng
          </p>
        </div>
        <RefreshCw className="ml-auto size-3.5 text-muted" />
      </Card>
      <Card className="flex flex-wrap items-center justify-between gap-3 p-3 shadow-none">
        <div className="relative w-full sm:max-w-sm">
          <Search className="absolute left-3 top-2.5 size-4 text-muted" />
          <Input
            className="pl-9"
            aria-label="Tìm trong hàng chờ bác sĩ"
            placeholder="Tìm tên, mã BN, STT..."
            value={filters.search}
            onChange={(event) => setFilter("search", event.target.value)}
          />
        </div>
        <p className="text-label text-muted">
          Hiển thị theo:{" "}
          <span className="ml-2 rounded-app-md border border-border bg-surface-hover px-2 py-1 text-caption text-foreground">
            Chuyên khoa Tim mạch (P.302)
          </span>
        </p>
      </Card>
      <div className="grid grid-cols-1 items-stretch gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {COLUMNS.map(([status, label, color]) => {
          const group = items.filter(
            (item) =>
              item.status === status &&
              `${item.name} ${item.patientCode} ${item.number}`
                .toLocaleLowerCase("vi")
                .includes(filters.search.toLocaleLowerCase("vi")),
          );
          return (
            <section
              key={status}
              aria-label={label}
              className="min-h-128 rounded-app-2xl border border-border bg-background/30 p-3"
            >
              <h2 className="mb-4 flex items-center gap-2 px-1 text-body font-semibold">
                <span className={`size-2 rounded-full ${color}`} />
                {label}
                <span className="ml-auto rounded-full bg-secondary px-2 text-label font-medium text-muted">
                  {String(group.length).padStart(2, "0")}
                </span>
              </h2>
              <div className="space-y-3">
                {group.map((item) => (
                  <Card
                    key={item.id}
                    className={`overflow-hidden p-3 shadow-none ${status === "CALLING" ? "border-primary/30" : status === "IN_PROGRESS" && item.id === "q5" ? "border-success/30" : ""}`}
                  >
                    {status === "CALLING" && (
                      <p className="-mx-3 -mt-3 mb-3 bg-primary px-3 py-1 text-right text-label text-primary-foreground">
                        Đã gọi loa
                      </p>
                    )}
                    <div className="flex items-center gap-2">
                      <span
                        className={`shrink-0 whitespace-nowrap rounded-app-sm px-2 py-1 text-caption font-semibold ${status === "IN_PROGRESS" ? "bg-success-bg text-success" : "bg-primary-light text-primary"}`}
                      >
                        {item.number}
                      </span>
                      {status === "WAITING" ? (
                        <span className="ml-auto text-label text-muted">
                          Mã: {item.patientCode}
                        </span>
                      ) : (
                        <h3 className="text-body font-semibold">{item.name}</h3>
                      )}
                    </div>
                    {status === "WAITING" && (
                      <h3 className="mt-2 text-body font-semibold">
                        {item.name}
                      </h3>
                    )}
                    {status === "WAITING" ? (
                      <>
                        <p className="mt-2 text-caption text-muted">
                          {item.time} ·{" "}
                          <span
                            className={
                              item.note.includes("trễ")
                                ? "text-warning"
                                : "text-success"
                            }
                          >
                            {item.note}
                          </span>
                        </p>
                        <div className="mt-5 flex items-center justify-between border-t border-border pt-3">
                          <span className="text-label text-muted">Chờ gọi</span>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-auto p-0 text-caption text-primary"
                            onClick={() => change(item.id, "CALLING")}
                          >
                            Gọi khám →
                          </Button>
                        </div>
                      </>
                    ) : status === "CALLING" ? (
                      <>
                        <p className="mt-2 text-caption text-muted">
                          <span className="rounded-app-sm bg-primary-light text-primary">
                            Đã gọi
                          </span>{" "}
                          · P.302
                        </p>
                        <p className="my-5 text-caption leading-relaxed text-muted">
                          Bệnh nhân đã được phát thanh và mời đến phòng khám
                          P.302.
                        </p>
                        <Button
                          className="w-full"
                          nativeButton={false}
                          render={
                            <Link href={`/examinations?visit=${item.visit}`} />
                          }
                        >
                          Bắt đầu khám →
                        </Button>
                        <div className="mt-3 flex justify-between">
                          <button
                            className="text-label text-muted underline"
                            onClick={() => setRecalls(recalls + 1)}
                          >
                            Gọi lại lần {recalls + 1}
                          </button>
                          <button
                            className="text-label text-danger"
                            onClick={() => change(item.id, "SKIPPED")}
                          >
                            Bỏ qua →
                          </button>
                        </div>
                      </>
                    ) : status === "IN_PROGRESS" ? (
                      <>
                        {item.id === "q5" ? (
                          <>
                            <p className="mt-3 rounded-app-sm bg-success-bg px-2 py-2 text-label text-success">
                              • Phiên khám đang thực hiện
                            </p>
                            <p className="mt-3 flex justify-between text-label text-muted">
                              Thời gian khám:{" "}
                              <span className="text-foreground">14 phút</span>
                            </p>
                            <p className="mt-1 text-label text-muted">
                              Triệu chứng:{" "}
                              <span className="text-foreground">
                                Đau thắt ngực trái
                              </span>
                            </p>
                            <Button
                              className="mt-4 w-full"
                              nativeButton={false}
                              render={
                                <Link
                                  href={`/examinations?visit=${item.visit}`}
                                />
                              }
                            >
                              Tiếp tục phiên khám →
                            </Button>
                            <p className="mt-2 text-center text-label text-muted">
                              Mở phiên hiện tại · Không tạo lượt trùng
                            </p>
                          </>
                        ) : (
                          <>
                            <p className="mt-2 text-label text-warning">
                              Chờ kết quả CLS · Lấy mẫu lúc 09:05
                            </p>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="mt-3 w-full text-caption text-primary"
                              nativeButton={false}
                              render={
                                <Link
                                  href={`/examinations?visit=${item.visit}`}
                                />
                              }
                            >
                              Xem kết quả CLS →
                            </Button>
                          </>
                        )}
                      </>
                    ) : (
                      <>
                        <p className="mt-2 text-label text-muted">
                          Đã bỏ qua lúc 08:45 · Gọi loa 3 lần
                        </p>
                        <div className="mt-4 flex justify-between">
                          <span className="text-label text-muted">
                            STT lưu tạm
                          </span>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-auto p-0 text-caption text-primary"
                            onClick={() => change(item.id, "WAITING")}
                          >
                            Đưa trở lại →
                          </Button>
                        </div>
                      </>
                    )}
                  </Card>
                ))}
                {!group.length && (
                  <p className="p-4 text-center text-caption text-muted">
                    Không có lượt phù hợp.
                  </p>
                )}
              </div>
            </section>
          );
        })}
      </div>
      <div className="rounded-app-lg border border-border bg-surface p-4 text-caption leading-relaxed text-muted">
        Các trạng thái <strong>Đang chờ</strong> và <strong>Bỏ qua lượt</strong>{" "}
        giữ nguyên cấu trúc như màn Lễ tân. Các thẻ trên chỉ minh họa những hành
        động khác nhau theo quyền Bác sĩ (Bắt đầu khám, Tiếp tục phiên khám lâm
        sàng, phục hồi số thứ tự).
        <p className="mt-2 text-label">
          Dữ liệu minh họa · Chưa kết nối hàng chờ thật.
        </p>
      </div>
    </div>
  );
}
