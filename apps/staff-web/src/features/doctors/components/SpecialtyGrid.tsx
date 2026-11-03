"use client";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/Badge";
import type { SpecialtyRecord } from "@/features/specialties/types/specialtyTypes";

export function SpecialtyGrid({
  specialties,
  onSelectSpecialty,
  onEdit,
  onSetStatus,
}: {
  specialties: SpecialtyRecord[];
  onSelectSpecialty: (id: string) => void;
  onEdit: (specialty: SpecialtyRecord) => void;
  onSetStatus: (specialty: SpecialtyRecord) => void;
}) {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {specialties.map((spec) => (
        <Card
          key={spec.id}
          className="flex flex-col gap-3 border-border-strong bg-surface p-4"
        >
          <div className="flex justify-between gap-2">
            <span className="text-caption font-semibold text-muted">
              {spec.code}
            </span>
            <Badge variant={spec.isActive ? "success" : "neutral"}>
              {spec.isActive ? "Hoạt động" : "Tạm dừng"}
            </Badge>
          </div>
          <h2 className="text-doctor font-bold">{spec.name}</h2>
          <p className="line-clamp-3 whitespace-pre-wrap text-body text-muted">
            {spec.description || "Chưa có mô tả"}
          </p>
          <dl className="space-y-1 rounded-app-md bg-background p-3 text-body">
            <div className="flex justify-between gap-2">
              <dt className="text-muted">Phòng khám</dt>
              <dd>{spec.roomCode}</dd>
            </div>
            <div className="flex justify-between gap-2">
              <dt className="text-muted">Phí khám</dt>
              <dd>
                {spec.consultationFee === null
                  ? "Chưa cập nhật"
                  : new Intl.NumberFormat("vi-VN", {
                      style: "currency",
                      currency: "VND",
                    }).format(Number(spec.consultationFee))}
              </dd>
            </div>
          </dl>
          <div className="mt-auto flex flex-wrap gap-2 border-t border-border pt-3">
            <Button size="sm" variant="outline" onClick={() => onEdit(spec)}>
              Chỉnh sửa
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => onSetStatus(spec)}
            >
              {spec.isActive ? "Tạm dừng" : "Kích hoạt"}
            </Button>
            <Button
              size="sm"
              variant="link"
              onClick={() => onSelectSpecialty(spec.id)}
            >
              Xem bác sĩ
            </Button>
          </div>
        </Card>
      ))}
    </div>
  );
}
