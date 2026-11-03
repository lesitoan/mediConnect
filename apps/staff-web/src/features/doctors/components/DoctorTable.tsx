"use client";
import {
  Table,
  TableHeader,
  TableHead,
  TableBody,
  TableRow,
  TableCell,
} from "@/components/ui/Table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/Badge";
import type { Doctor } from "../types/doctorTypes";

export function DoctorTable({
  doctors,
  onViewDetails,
  onEdit,
  onDeactivate,
}: {
  doctors: Doctor[];
  onViewDetails: (doctor: Doctor) => void;
  onEdit: (doctor: Doctor) => void;
  onDeactivate: (doctor: Doctor) => void;
}) {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Bác sĩ</TableHead>
          <TableHead>Chuyên khoa / Phòng</TableHead>
          <TableHead>CCHN</TableHead>
          <TableHead>Trạng thái</TableHead>
          <TableHead>Thao tác</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {doctors.map((doctor) => (
          <TableRow key={doctor.id}>
            <TableCell>
              <Button
                variant="link"
                className="h-auto p-0 font-semibold"
                onClick={() => onViewDetails(doctor)}
              >
                {doctor.user.fullName}
              </Button>
              <p className="text-caption text-muted">{doctor.doctorCode}</p>
            </TableCell>
            <TableCell>
              {doctor.specialty.name}
              <p className="text-caption text-muted">
                {doctor.specialty.roomCode}
              </p>
            </TableCell>
            <TableCell>{doctor.licenseNumber}</TableCell>
            <TableCell>
              <Badge variant={doctor.isActive ? "success" : "neutral"}>
                {doctor.isPaused
                  ? "Đang tạm dừng"
                  : doctor.isActive
                    ? "Hoạt động"
                    : "Ngừng hoạt động"}
              </Badge>
            </TableCell>
            <TableCell>
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => onEdit(doctor)}
                >
                  Sửa
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => onDeactivate(doctor)}
                >
                  Lập tạm dừng
                </Button>
              </div>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
