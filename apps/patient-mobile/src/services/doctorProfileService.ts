export type StrengthIconKey =
  | 'CORONARY'
  | 'HYPERTENSION'
  | 'HEART_FAILURE'
  | 'DOPPLER'
  | 'INTERVENTION';

export type DoctorStrength = {
  id: string;
  label: string;
  iconKey: StrengthIconKey;
};

export type DoctorProfile = {
  id: string;
  fullName: string;
  academicTitle: string;
  position: string;
  hospitalName: string;
  rating: number;
  reviewCount: number;
  experienceYears: number;
  treatedCases: number;
  introduction: string;
  strengths: DoctorStrength[];
  clinicName: string;
  clinicAddress: string;
  photoUrl?: string;
};

const MOCK_DOCTOR: DoctorProfile = {
  id: 'doctor-le-quang-huy',
  fullName: 'TS.BS Lê Quang Huy',
  academicTitle: 'Tiến sĩ, Bác sĩ',
  position: 'Trưởng khoa Tim Mạch Can Thiệp',
  hospitalName: 'BVĐK Quốc tế MediConnect (Cơ sở Q1)',
  rating: 4.9,
  reviewCount: 340,
  experienceYears: 20,
  treatedCases: 15000,
  introduction:
    'Hơn 20 năm công tác và nghiên cứu chuyên sâu về Tim mạch can thiệp, bệnh mạch vành phức tạp, suy tim và các thủ thuật mở mạch ngoại biên. TS.BS Lê Quang Huy từng tu nghiệp tại các trung tâm tim mạch hàng đầu trong và ngoài nước, luôn tận tâm đồng đội giải pháp điều trị can thiệp an toàn, hiệu quả tối ưu cho bệnh nhân.',
  strengths: [
    { id: 'coronary', label: 'Bệnh mạch vành', iconKey: 'CORONARY' },
    { id: 'hypertension', label: 'Tăng huyết áp', iconKey: 'HYPERTENSION' },
    { id: 'heart-failure', label: 'Suy tim', iconKey: 'HEART_FAILURE' },
    { id: 'doppler', label: 'Siêu âm tim Doppler', iconKey: 'DOPPLER' },
    { id: 'intervention', label: 'Can thiệp mạch', iconKey: 'INTERVENTION' },
  ],
  clinicName: 'Phòng khám Tim Mạch Can Thiệp 302 - Tầng 3',
  clinicAddress: 'Bệnh viện ĐKQT MediConnect, 45 Lê Duẩn, P. Bến Nghé, Quận 1, TP.HCM',
};

export async function getDoctorProfile(doctorId: string): Promise<DoctorProfile | null> {
  return { ...MOCK_DOCTOR, id: doctorId };
}