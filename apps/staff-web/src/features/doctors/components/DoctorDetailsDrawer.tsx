"use client";
import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerDescription,
  DrawerFooter,
} from "@/components/ui/Drawer";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/Tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/Input";
import { Badge } from "@/components/ui/Badge";
import { DoctorTabRecords } from "./DoctorTabRecords";
import {
  useGetDoctorQuery,
  useGetDoctorPausesQuery,
  useCancelDoctorPauseMutation,
} from "../services/doctorsApi";
import {
  formatClinicTime,
  formatDoctorName,
  getDoctorApiError,
} from "../doctorUtils";
import type { Doctor } from "../types/doctorTypes";

type DoctorDetailTab = "INFO" | "SCHEDULE" | "HISTORY" | "REVIEWS";

export function DoctorDetailsDrawer({
  doctorId,
  onClose,
  onEdit,
}: {
  doctorId: string;
  onClose: () => void;
  onEdit: (doctor: Doctor) => void;
}) {
  const [activeTab, setActiveTab] = useState<DoctorDetailTab>("INFO");
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 60000);
    return () => clearInterval(timer);
  }, []);
  const profile = useGetDoctorQuery(doctorId, {
    refetchOnMountOrArgChange: true,
    pollingInterval: 60000,
    skipPollingIfUnfocused: true,
  });
  const doctor = profile.currentData;
  const pauses = useGetDoctorPausesQuery(doctorId, {
    skip: activeTab !== "SCHEDULE" || !doctor || profile.isError,
    refetchOnMountOrArgChange: true,
  });
  const [cancelPause, cancellation] = useCancelDoctorPauseMutation();
  const handleCancel = async (pauseId: string) => {
    try {
      await cancelPause({ doctorId, pauseId }).unwrap();
      toast.success("Đã hủy kế hoạch tạm dừng.");
    } catch (error) {
      toast.error(getDoctorApiError(error));
    }
  };
  return (
    <Drawer
      open
      onOpenChange={(open) => {
        if (!open && !cancellation.isLoading) onClose();
      }}
    >
      <DrawerContent className="w-full max-w-3xl">
        <DrawerHeader>
          <DrawerTitle>Hồ sơ bác sĩ</DrawerTitle>
          <DrawerDescription>
            Thông tin chuyên môn, lịch làm, lịch sử khám và đánh giá từ bệnh
            nhân.
          </DrawerDescription>
        </DrawerHeader>
        {profile.isLoading || (!doctor && profile.isFetching) ? (
          <p role="status" className="p-6">
            Đang tải hồ sơ...
          </p>
        ) : profile.isError ? (
          <div role="alert" className="space-y-3 p-6">
            <p>{getDoctorApiError(profile.error)}</p>
            <Button variant="outline" onClick={() => profile.refetch()}>
              Thử lại
            </Button>
          </div>
        ) : (
          doctor && (
            <>
              <div className="border-b border-border px-5 py-4 sm:px-6">
                <div className="flex flex-wrap items-center gap-2">
                  <h2 className="text-title font-bold">
                    {formatDoctorName(doctor)}
                  </h2>
                  <Badge
                    shape="pill"
                    variant={doctor.isActive ? "success" : "neutral"}
                  >
                    {doctor.isPaused
                      ? "Đang tạm dừng"
                      : doctor.isActive
                        ? "Hoạt động"
                        : "Ngừng hoạt động"}
                  </Badge>
                </div>
                <p className="mt-1 text-body text-muted">
                  {doctor.doctorCode} · {doctor.specialty.name}
                </p>
              </div>
              <Tabs
                value={activeTab}
                onValueChange={(value) => {
                  if (!cancellation.isLoading)
                    setActiveTab(value as DoctorDetailTab);
                }}
                className="flex min-h-0 flex-1 flex-col overflow-hidden"
              >
                <div className="shrink-0 border-b border-border px-5 sm:px-6">
                  <TabsList
                    className="grid w-full grid-cols-2 justify-start gap-x-3 rounded-none border-0 bg-transparent p-0 sm:grid-cols-4"
                    aria-label="Chi tiết bác sĩ"
                  >
                    {[
                      ["INFO", "Thông tin chuyên môn"],
                      ["SCHEDULE", "Lịch làm"],
                      ["HISTORY", "Lịch sử khám"],
                      ["REVIEWS", "Đánh giá từ bệnh nhân"],
                    ].map(([value, label]) => (
                      <TabsTrigger
                        key={value}
                        value={value!}
                        disabled={cancellation.isLoading}
                        className="rounded-none border-b-2 border-transparent px-0 py-3 text-caption aria-selected:border-primary aria-selected:bg-transparent aria-selected:text-primary aria-selected:shadow-none"
                      >
                        {label}
                      </TabsTrigger>
                    ))}
                  </TabsList>
                </div>
                <div className="min-h-0 flex-1 overflow-y-auto p-5 sm:p-6">
                  <TabsContent value="INFO" className="mt-0 space-y-5">
                    {" "}
                    <div className="grid gap-3 sm:grid-cols-2">
                      {[
                        ["Email", doctor.user.email],
                        ["Số điện thoại", doctor.user.phone],
                        ["Chứng chỉ hành nghề", doctor.licenseNumber],
                        ["Phòng khám", doctor.specialty.roomCode],
                        [
                          "Trạng thái hồ sơ",
                          doctor.isPaused
                            ? "Đang tạm dừng"
                            : doctor.isActive
                              ? "Hoạt động"
                              : "Ngừng hoạt động",
                        ],
                        ["Trạng thái tài khoản", doctor.user.status],
                      ].map(([label, value]) => (
                        <label
                          key={label ?? ""}
                          className="space-y-1.5 text-caption font-semibold"
                        >
                          {label}
                          <Input disabled value={value || "Chưa cập nhật"} />
                        </label>
                      ))}
                    </div>
                    <dl className="space-y-4 text-body">
                      <div>
                        <dt className="font-semibold">Học hàm</dt>
                        <dd>
                          {doctor.academicTitle === "PROFESSOR"
                            ? "Giáo sư"
                            : doctor.academicTitle === "ASSOCIATE_PROFESSOR"
                              ? "Phó giáo sư"
                              : "Chưa cập nhật"}
                        </dd>
                      </div>
                      <div>
                        <dt className="font-semibold">Trình độ chuyên môn</dt>
                        <dd className="whitespace-pre-wrap">
                          {doctor.qualification || "Chưa cập nhật"}
                        </dd>
                      </div>
                      <div>
                        <dt className="font-semibold">Giới thiệu</dt>
                        <dd className="whitespace-pre-wrap">
                          {doctor.bio || "Chưa cập nhật"}
                        </dd>
                      </div>
                    </dl>
                  </TabsContent>
                  <TabsContent value="SCHEDULE" className="mt-0 space-y-5">
                    {activeTab === "SCHEDULE" && (
                      <DoctorTabRecords
                        key={`${doctorId}:SCHEDULE`}
                        doctorId={doctorId}
                        tab="SCHEDULE"
                      />
                    )}
                    <section className="space-y-3 border-t border-border pt-4">
                      <h3 className="text-heading font-bold">
                        Kế hoạch tạm dừng (giờ Việt Nam)
                      </h3>
                      {pauses.isFetching ? (
                        <p role="status">Đang tải kế hoạch...</p>
                      ) : pauses.isError ? (
                        <div role="alert">
                          <p>{getDoctorApiError(pauses.error)}</p>
                          <Button
                            variant="outline"
                            onClick={() => pauses.refetch()}
                          >
                            Tải lại kế hoạch
                          </Button>
                        </div>
                      ) : !pauses.currentData?.length ? (
                        <p className="text-body text-muted">
                          Chưa có kế hoạch tạm dừng.
                        </p>
                      ) : (
                        <ul className="space-y-3">
                          {pauses.currentData.map((pause) => (
                            <li
                              key={pause.id}
                              className="space-y-2 rounded-app-lg border border-border p-3 text-body"
                            >
                              <p>
                                {formatClinicTime(pause.startsAt)} –{" "}
                                {pause.endsAt
                                  ? formatClinicTime(pause.endsAt)
                                  : "Không xác định kết thúc"}
                              </p>
                              <p className="whitespace-pre-wrap text-muted">
                                {pause.reason}
                              </p>
                              <p>
                                {pause.status === "APPROVED"
                                  ? "Đã duyệt"
                                  : pause.status === "CANCELLED"
                                    ? "Đã hủy"
                                    : pause.status === "REJECTED"
                                      ? "Từ chối"
                                      : "Chờ duyệt"}
                              </p>
                              {pause.status === "APPROVED" &&
                                (!pause.endsAt ||
                                  Date.parse(pause.endsAt) > now) && (
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    disabled={
                                      cancellation.isLoading ||
                                      pauses.isFetching
                                    }
                                    onClick={() => handleCancel(pause.id)}
                                  >
                                    Hủy kế hoạch tạm dừng
                                  </Button>
                                )}
                            </li>
                          ))}
                        </ul>
                      )}
                    </section>
                  </TabsContent>
                  <TabsContent value="HISTORY" className="mt-0">
                    {activeTab === "HISTORY" && (
                      <DoctorTabRecords
                        key={`${doctorId}:HISTORY`}
                        doctorId={doctorId}
                        tab="HISTORY"
                      />
                    )}
                  </TabsContent>
                  <TabsContent value="REVIEWS" className="mt-0">
                    {activeTab === "REVIEWS" && (
                      <DoctorTabRecords
                        key={`${doctorId}:REVIEWS`}
                        doctorId={doctorId}
                        tab="REVIEWS"
                      />
                    )}
                  </TabsContent>
                </div>
              </Tabs>
            </>
          )
        )}
        <DrawerFooter className="flex-wrap gap-2">
          <Button
            variant="outline"
            disabled={cancellation.isLoading}
            onClick={onClose}
          >
            Đóng
          </Button>
          <Button
            disabled={
              !doctor ||
              profile.isFetching ||
              profile.isError ||
              cancellation.isLoading
            }
            onClick={() => doctor && onEdit(doctor)}
          >
            Chỉnh sửa hồ sơ
          </Button>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  );
}
