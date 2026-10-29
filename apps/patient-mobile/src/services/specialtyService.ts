export type SpecialtyIconKey =
  | 'STETHOSCOPE'
  | 'HEART_PULSE'
  | 'SMILE'
  | 'SKIN'
  | 'SPINE'
  | 'EAR'
  | 'MATERNITY'
  | 'DIGESTIVE';

export type SpecialtyService = {
  id: string;
  name: string;
  description: string;
  iconKey: SpecialtyIconKey;
  minFee: number;
  isAvailable: boolean;
};

export type Specialty = {
  id: string;
  name: string;
  doctorCount: number;
  iconKey: SpecialtyIconKey;
  services: SpecialtyService[];
};

export type SpecialtyCatalog = {
  totalCount: number;
  popular: Specialty[];
};

const MOCK_CATALOG: SpecialtyCatalog = {
  totalCount: 28,
  popular: [
    {
      id: 'internal',
      name: 'Nội khoa',
      doctorCount: 16,
      iconKey: 'STETHOSCOPE',
      services: [
        {
          id: 'internal-cardio',
          name: 'Tim Mạch Can Thiệp',
          description: 'Khám và điều trị tăng huyết áp, rối loạn nhịp, bệnh mạch vành, can thiệp tim mạch chuyên sâu.',
          iconKey: 'HEART_PULSE',
          minFee: 300000,
          isAvailable: true,
        },
        {
          id: 'internal-general',
          name: 'Nội Tổng Quát',
          description: 'Khám sàng lọc sức khỏe tổng quát, phát hiện sớm bệnh lý nội khoa, tư vấn lộ trình chăm sóc toàn diện.',
          iconKey: 'STETHOSCOPE',
          minFee: 250000,
          isAvailable: true,
        },
        {
          id: 'internal-pediatric',
          name: 'Nhi Khoa & Tiêm Chủng',
          description: 'Khám bệnh lý trẻ nhỏ, theo dõi phát triển thể chất toàn diện, dinh dưỡng và tư vấn vắc xin.',
          iconKey: 'SMILE',
          minFee: 250000,
          isAvailable: true,
        },
        {
          id: 'internal-musculoskeletal',
          name: 'Cơ Xương Khớp & Cột Sống',
          description: 'Điều trị thoái hóa khớp, thoát vị đĩa đệm, đau nhức xương khớp và phục hồi chức năng vận động.',
          iconKey: 'SPINE',
          minFee: 300000,
          isAvailable: false,
        },
        {
          id: 'internal-dermatology',
          name: 'Da Liễu & Thẩm Mỹ Da',
          description: 'Điều trị mụn chuyên sâu, viêm da cơ địa, dị ứng vảy nến và các liệu trình laser trẻ hóa da.',
          iconKey: 'SKIN',
          minFee: 250000,
          isAvailable: true,
        },
      ],
    },
    {
      id: 'cardiology',
      name: 'Tim mạch',
      doctorCount: 12,
      iconKey: 'HEART_PULSE',
      services: [
        {
          id: 'cardiology-general',
          name: 'Khám Tim Mạch Tổng Quát',
          description: 'Đánh giá nguy cơ tim mạch, đo huyết áp, điện tim và tư vấn điều trị.',
          iconKey: 'HEART_PULSE',
          minFee: 280000,
          isAvailable: true,
        },
        {
          id: 'cardiology-echo',
          name: 'Siêu Âm Tim',
          description: 'Siêu âm đánh giá cấu trúc và chức năng tim, van tim và mạch máu lớn.',
          iconKey: 'HEART_PULSE',
          minFee: 350000,
          isAvailable: true,
        },
      ],
    },
    {
      id: 'pediatrics',
      name: 'Nhi khoa',
      doctorCount: 14,
      iconKey: 'SMILE',
      services: [
        {
          id: 'pediatrics-general',
          name: 'Khám Nhi Tổng Quát',
          description: 'Khám bệnh thường gặp ở trẻ em, theo dõi tăng trưởng và dinh dưỡng.',
          iconKey: 'SMILE',
          minFee: 200000,
          isAvailable: true,
        },
        {
          id: 'pediatrics-vaccine',
          name: 'Tư Vấn Tiêm Chủng',
          description: 'Tư vấn lịch tiêm chủng theo độ tuổi và theo dõi phản ứng sau tiêm.',
          iconKey: 'SMILE',
          minFee: 150000,
          isAvailable: true,
        },
      ],
    },
    {
      id: 'dermatology',
      name: 'Da liễu',
      doctorCount: 9,
      iconKey: 'SKIN',
      services: [
        {
          id: 'dermatology-acne',
          name: 'Điều Trị Mụn',
          description: 'Đánh giá tình trạng da, xây dựng phác đồ điều trị mụn phù hợp từng người.',
          iconKey: 'SKIN',
          minFee: 250000,
          isAvailable: true,
        },
        {
          id: 'dermatology-eczema',
          name: 'Viêm Da Cơ Địa',
          description: 'Khám và kiểm soát viêm da, dị ứng, ngứa kéo dài.',
          iconKey: 'SKIN',
          minFee: 250000,
          isAvailable: false,
        },
      ],
    },
    {
      id: 'musculoskeletal',
      name: 'Xương khớp',
      doctorCount: 11,
      iconKey: 'SPINE',
      services: [
        {
          id: 'musculoskeletal-disc',
          name: 'Thoát Vị Đĩa Đệm',
          description: 'Khám cột sống, đánh giá thoát vị đĩa đệm và hướng điều trị không phẫu thuật.',
          iconKey: 'SPINE',
          minFee: 300000,
          isAvailable: true,
        },
        {
          id: 'musculoskeletal-arthritis',
          name: 'Thoái Hóa Khớp',
          description: 'Điều trị đau khớp gối, khớp háng và tư vấn vận động phục hồi.',
          iconKey: 'SPINE',
          minFee: 280000,
          isAvailable: true,
        },
      ],
    },
    {
      id: 'ent',
      name: 'Tai Mũi Họng',
      doctorCount: 8,
      iconKey: 'EAR',
      services: [
        {
          id: 'ent-general',
          name: 'Khám Tai Mũi Họng',
          description: 'Khám viêm xoang, viêm họng, viêm tai giữa và các bệnh lý tai mũi họng thường gặp.',
          iconKey: 'EAR',
          minFee: 220000,
          isAvailable: true,
        },
        {
          id: 'ent-endoscopy',
          name: 'Nội Soi Tai Mũi Họng',
          description: 'Nội soi chẩn đoán chính xác các tổn thương vùng tai, mũi, họng.',
          iconKey: 'EAR',
          minFee: 320000,
          isAvailable: true,
        },
      ],
    },
    {
      id: 'obstetrics',
      name: 'Sản phụ',
      doctorCount: 15,
      iconKey: 'MATERNITY',
      services: [
        {
          id: 'obstetrics-prenatal',
          name: 'Khám Thai Định Kỳ',
          description: 'Theo dõi sức khỏe mẹ và thai nhi, siêu âm và tư vấn dinh dưỡng thai kỳ.',
          iconKey: 'MATERNITY',
          minFee: 250000,
          isAvailable: true,
        },
        {
          id: 'obstetrics-gynecology',
          name: 'Tầm Soát Phụ Khoa',
          description: 'Khám và tầm soát các bệnh lý phụ khoa thường gặp.',
          iconKey: 'MATERNITY',
          minFee: 280000,
          isAvailable: true,
        },
      ],
    },
    {
      id: 'digestive',
      name: 'Tiêu hóa',
      doctorCount: 10,
      iconKey: 'DIGESTIVE',
      services: [
        {
          id: 'digestive-general',
          name: 'Khám Tiêu Hóa Gan Mật',
          description: 'Khám đau bụng, trào ngược, rối loạn tiêu hóa và bệnh lý gan mật.',
          iconKey: 'DIGESTIVE',
          minFee: 260000,
          isAvailable: true,
        },
        {
          id: 'digestive-endoscopy',
          name: 'Nội Soi Dạ Dày',
          description: 'Nội soi dạ dày tá tràng phát hiện viêm loét và tổn thương sớm.',
          iconKey: 'DIGESTIVE',
          minFee: 450000,
          isAvailable: true,
        },
      ],
    },
  ],
};

export async function getSpecialtyCatalog(): Promise<SpecialtyCatalog> {
  return MOCK_CATALOG;
}