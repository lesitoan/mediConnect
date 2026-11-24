import { getEligibleVisits } from "./services/reviewsService";

export type Visit = {
  code: string;
  status: "completed" | "other";
  alreadyReviewed: boolean;
  consultationId: string | null;
  isPaid: boolean;
  doctor: { name: string; specialty: string; clinic: string; initials: string };
  time: string;
  diagnosis: string;
  room: string;
};

const CLINIC = "Phòng khám Đa khoa MediConnect Đà Nẵng";

function initialsOf(name: string) {
  const last = name.trim().split(/\s+/).slice(-1)[0] ?? "";
  return last.charAt(0).toUpperCase();
}

export async function getVisit(code: string): Promise<Visit | null> {
  const eligibleVisits = await getEligibleVisits();
  const item = eligibleVisits.find(
    ({ consultation }) =>
      consultation.careSession.appointment.appointmentCode === code,
  );
  if (!item) return null;

  const { consultation } = item;
  const { careSession } = consultation;
  const doctor = careSession.appointmentSlot.doctorSchedule.doctor;
  const startsAt = new Date(careSession.appointmentSlot.startsAt);
  const completedAt = consultation.completedAt
    ? new Date(consultation.completedAt)
    : startsAt;

  return {
    code,
    status: "completed",
    alreadyReviewed: !item.canReview || !!consultation.review,
    consultationId: consultation.id,
    isPaid: true,
    doctor: {
      name: doctor.user.fullName,
      specialty: careSession.specialty.name,
      clinic: CLINIC,
      initials: initialsOf(doctor.user.fullName),
    },
    time: `${startsAt.toLocaleTimeString("vi-VN", {
      hour: "2-digit",
      minute: "2-digit",
    })} - ${completedAt.toLocaleDateString("vi-VN")}`,
    diagnosis: "Theo hồ sơ phiên khám",
    room: careSession.specialty.roomCode
      ? `Phòng ${careSession.specialty.roomCode}`
      : "Chưa cập nhật",
  };
}

export const MOODS = [
  { value: 5, icon: "", label: "Tuyệt vời" },
  { value: 4, icon: "", label: "Rất tốt" },
  { value: 3, icon: "", label: "Bình thường" },
  { value: 2, icon: "", label: "Chưa ưng" },
  { value: 1, icon: "", label: "Thất vọng" },
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
