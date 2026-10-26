import { MOCK_APPOINTMENTS, MOCK_RECORDS } from "@/features/appointments/data";

export type Visit = {
  code: string;
  status: "completed" | "other";
  alreadyReviewed: boolean;
  doctor: { name: string; specialty: string; clinic: string; initials: string };
  time: string;
  diagnosis: string;
  room: string;
};

const CLINIC = "Bệnh viện Đa khoa MediConnect Đà Nẵng";

function initialsOf(name: string) {
  const last = name.trim().split(/\s+/).slice(-1)[0] ?? "";
  return last.charAt(0).toUpperCase();
}

// TODO: thay toàn bộ hàm này bằng API: GET /visits/:code
// (backend kiểm tra phiên khám thuộc bệnh nhân đang đăng nhập, đã "Hoàn thành",
// và chưa được đánh giá; trả 404 nếu không hợp lệ)
export function getVisit(code: string): Visit | null {
  // Phiên khám đã hoàn tất (hồ sơ khám & xét nghiệm)
  const rec = MOCK_RECORDS.find((r) => r.visitCode === code);
  if (rec) {
    return {
      code,
      status: "completed",
      alreadyReviewed: rec.reviewed,
      doctor: {
        name: rec.doctor.name,
        specialty: rec.doctor.dept,
        clinic: CLINIC,
        initials: initialsOf(rec.doctor.name),
      },
      time: rec.date,
      diagnosis: rec.type === "visit" ? rec.conclusion : rec.title,
      room: rec.room,
    };
  }

  // Lịch sắp tới / đã hủy: chưa thể đánh giá
  const appt = MOCK_APPOINTMENTS.find((a) => a.code === code);
  if (appt) {
    return {
      code,
      status: "other",
      alreadyReviewed: false,
      doctor: {
        name: appt.doctor.name,
        specialty: appt.doctor.specialty,
        clinic: CLINIC,
        initials: appt.doctor.initials,
      },
      time: `${appt.time} - ${appt.bookedAt}`,
      diagnosis: "Theo hồ sơ bệnh án",
      room: appt.room,
    };
  }

  return null;
}

export const MOODS = [
  { value: 5, icon: "✨", label: "Tuyệt vời" },
  { value: 4, icon: "😊", label: "Rất tốt" },
  { value: 3, icon: "🙂", label: "Bình thường" },
  { value: 2, icon: "😕", label: "Chưa ưng" },
  { value: 1, icon: "⚠️", label: "Thất vọng" },
] as const;

export const OVERALL_TEXT: Record<number, { title: string; desc: string }> = {
  5: { title: "Rất hài lòng & An tâm", desc: "Đã mặc định mức đánh giá cao nhất" },
  4: { title: "Hài lòng", desc: "Trải nghiệm tốt, còn vài điểm nhỏ cần hoàn thiện" },
  3: { title: "Bình thường", desc: "Trải nghiệm ở mức chấp nhận được" },
  2: { title: "Chưa hài lòng", desc: "Một số điểm chưa đáp ứng mong đợi" },
  1: { title: "Rất thất vọng", desc: "Trải nghiệm chưa tốt, chúng tôi rất tiếc" },
};

export const CRITERIA = [
  { key: "doctor", title: "Thái độ & Chuyên môn Bác sĩ", desc: "Lắng nghe triệu chứng, khám cẩn thận, y đức." },
  { key: "waiting", title: "Thời gian chờ & Tiếp đón", desc: "Đúng giờ hẹn, điều phối luồng vào phòng khám." },
  { key: "facility", title: "Cơ sở vật chất & Vệ sinh phòng khám", desc: "Không gian vô trùng, thiết bị hiện đại, thoáng mát." },
  { key: "guidance", title: "Hướng dẫn điều trị & Kê đơn thuốc", desc: "Giải thích liều dùng, dặn dò tái khám rõ ràng." },
] as const;

export const TAGS = [
  "Bác sĩ tận tâm",
  "Giải thích rõ ràng",
  "Không phải chờ lâu",
  "Thủ tục nhanh gọn",
  "Phòng khám hiện đại, sạch sẽ",
  "Tư vấn chế độ ăn chu đáo",
  "Y tá hỗ trợ nhiệt tình",
];

export const MAX_TAGS = 5;
export const MAX_COMMENT = 500;