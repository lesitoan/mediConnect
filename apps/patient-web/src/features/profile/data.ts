export type IdentityForm = {
  dob: string; // yyyy-mm-dd
  gender: string;
  ethnicity: string;
  email: string;
  address: string;
  sameAddress: boolean;
};

// TODO: thay bằng API lấy hồ sơ của chính bệnh nhân đang đăng nhập (UC01, UC02 hồ sơ bệnh nhân)
export const PROFILE = {
  fullName: "NGUYỄN VĂN AN",
  idNumber: "048094008896",
  phone: "0905 123 456",
  updatedAt: "12/03/2025",
  identity: {
    dob: "1994-05-15",
    gender: "Nam",
    ethnicity: "Kinh",
    email: "an.nguyen94@gmail.com",
    address: "Số 188 Nguyễn Văn Cừ, Phường 4, Quận 5, TP. Hồ Chí Minh",
    sameAddress: true,
  } satisfies IdentityForm,
  medical: {
    blood: "O+",
    rh: "(Rh+)",
    height: 174,
    heightDate: "15/02/2025",
    weight: 68,
    allergies: [
      "Dị ứng Penicillin (Phản ứng nổi mề đay, khó thở)",
      "Không dị ứng phấn hoa, thực phẩm hay hải sản",
    ],
    chronic: [
      "Viêm loét dạ dày - trào ngược dạ dày thực quản (GERD) - Chẩn đoán 2022.",
      "Không có tiền sử đái tháo đường, tim mạch hay huyết áp cao.",
    ],
    medications: [
      "Nexium 40mg (Esomeprazole) - Uống trước ăn sáng khi có dấu hiệu trào ngược.",
      "Bổ sung Vitamin D3 1000IU hàng tuần.",
    ],
  },
  stats: [
    { value: "12", label: "Lượt khám viện" },
    { value: "04", label: "Đơn thuốc xong" },
    { value: "01", label: "Đợt điều trị gần nhất" },
    { value: "100%", label: "Tuần thủ lịch hẹn" },
  ],
  familyDoctor: "BS. CKII Trần Quốc Bảo",
  emergency: {
    name: "Nguyễn Thị Thu Hà",
    relation: "Vợ/ruột (Người liên hệ chính)",
    phone: "0912 345 678",
    note: "Trùng địa chỉ với bệnh nhân",
  },
  relatives: [
    { initials: "HN", name: "Nguyễn Hoàng Nam", desc: "Con trai • 6 tuổi (EMR: BN-9921)", pid: "BN-9921" },
    { initials: "LM", name: "Lê Thị Mai", desc: "Mẹ ruột • 63 tuổi (EMR: BN-5542)", pid: "BN-5542" },
  ],
};

export function ageOf(dob: string) {
  const d = new Date(dob);
  if (Number.isNaN(d.getTime())) return 0;
  const n = new Date();
  let age = n.getFullYear() - d.getFullYear();
  const m = n.getMonth() - d.getMonth();
  if (m < 0 || (m === 0 && n.getDate() < d.getDate())) age--;
  return age;
}

export function dobVN(dob: string) {
  const [y, m, d] = dob.split("-");
  return `${d}/${m}/${y}`;
}

export function bmiOf(weight: number, heightCm: number) {
  const h = heightCm / 100;
  return Math.round((weight / (h * h)) * 10) / 10;
}

export function bmiLabel(b: number) {
  if (b < 18.5) return "Thiếu cân";
  if (b < 23) return "Bình thường";
  if (b < 25) return "Thừa cân";
  return "Béo phì";
}