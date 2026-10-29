export type RecordCategoryId =
  | 'VISIT_HISTORY'
  | 'LAB_RESULTS'
  | 'IMAGING'
  | 'PRESCRIPTIONS'
  | 'VACCINATIONS'
  | 'ALLERGIES';

export type RecordTone = 'DEFAULT' | 'SUCCESS' | 'WARNING' | 'DANGER';

export type RecordCategory = {
  id: RecordCategoryId;
  title: string;
  highlight?: string;
  description: string;
  badgeLabel: string;
  badgeTone: RecordTone;
  actionLabel: string;
};

export type LatestVisit = {
  id: string;
  visitTypeLabel: string;
  department: string;
  doctorName: string;
  diagnosis: string;
};

export type HealthRecordOverview = {
  latestVisit: LatestVisit | null;
  categories: RecordCategory[];
};

const MOCK_OVERVIEW: HealthRecordOverview = {
  latestVisit: {
    id: 'visit-latest',
    visitTypeLabel: 'Ngoại trú',
    department: 'Nội Tim Mạch',
    doctorName: 'TS.BS Lê Quang Huy',
    diagnosis: 'Rối loạn nhịp xoang nhẹ (I49)',
  },
  categories: [
    {
      id: 'VISIT_HISTORY',
      title: 'Lịch sử khám & Chẩn đoán',
      description:
        'Hồ sơ khám ngoại trú, chuyển tuyến, xuất nhập viện và phẫu thuật can thiệp.',
      badgeLabel: '12 lượt khám',
      badgeTone: 'DEFAULT',
      actionLabel: 'Chi tiết từng đợt',
    },
    {
      id: 'LAB_RESULTS',
      title: 'Kết quả cận lâm sàng',
      description: 'Xét nghiệm công thức máu, sinh hóa máu, miễn dịch, nước tiểu & vi sinh.',
      badgeLabel: 'MỚI CÓ KẾT QUẢ HÔM NAY',
      badgeTone: 'SUCCESS',
      actionLabel: '24 chỉ số sinh hóa',
    },
    {
      id: 'IMAGING',
      title: 'Chẩn đoán hình ảnh & TDCN',
      description: 'X-Quang ngực thẳng, Siêu âm bụng tổng quát, MRI sọ não, Điện tim ECG.',
      badgeLabel: '4 tệp DICOM',
      badgeTone: 'DEFAULT',
      actionLabel: 'Xem ảnh phim chuẩn HD',
    },
    {
      id: 'PRESCRIPTIONS',
      title: 'Đơn thuốc & Lịch uống',
      description: 'Toa thuốc điện tử đang dùng, liều lượng, cảnh báo tương tác và hẹn giờ chuông.',
      badgeLabel: 'Đang uống (3)',
      badgeTone: 'WARNING',
      actionLabel: 'Nhắc uống tiếp: 12:00',
    },
    {
      id: 'VACCINATIONS',
      title: 'Sổ tiêm chủng Vắc-xin',
      description: 'Lịch sử phòng ngừa cúm mùa, viêm gan B, HPV, uốn ván và nhắc mũi tiêm tới.',
      badgeLabel: '8 mũi đã tiêm',
      badgeTone: 'DEFAULT',
      actionLabel: 'Lịch tiêm nhắc: 12/2025',
    },
    {
      id: 'ALLERGIES',
      title: 'Dị ứng & Tiền sử bệnh lý',
      highlight: 'Dị ứng: Penicillin (Mẩn ngứa cấp tính).',
      description: 'Tiền sử gia đình: Tăng huyết áp nhẹ bên ngoại.',
      badgeLabel: 'CẢNH BÁO ĐỎ',
      badgeTone: 'DANGER',
      actionLabel: 'Cập nhật cảnh báo',
    },
  ],
};

export async function getHealthRecordOverview(_profileId: string): Promise<HealthRecordOverview> {
  return MOCK_OVERVIEW;
}