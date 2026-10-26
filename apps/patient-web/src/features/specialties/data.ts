export type Group = "noi" | "ngoai" | "nhi-san" | "cls";
export type Tag = "bhyt" | "evening" | "vip" | "ai";
export type IconKey =
  | "heart"
  | "digestive"
  | "bone"
  | "ear"
  | "eye"
  | "tooth"
  | "brain"
  | "child"
  | "womb";

export type Specialty = {
  slug: string;
  group: Group;
  badge: string;
  icon: IconKey;
  name: string;
  head: { name: string; years: number };
  techniques: string[];
  doctors: number;
  highlight: string;
  tags: Tag[];
  keywords: string[]; // từ khóa triệu chứng để tìm kiếm / gợi ý
};

export const GROUPS: { key: "all" | Group; label: string; count: number }[] = [
  { key: "all", label: "Tất cả", count: 22 },
  { key: "noi", label: "Khối Nội khoa", count: 8 },
  { key: "ngoai", label: "Khối Ngoại & Phẫu thuật", count: 6 },
  { key: "nhi-san", label: "Khối Nhi & Sản phụ khoa", count: 3 },
  { key: "cls", label: "Cận lâm sàng & CĐHA", count: 5 },
];

export const TAG_FILTERS: { key: Tag; label: string }[] = [
  { key: "bhyt", label: "Hỗ trợ khám BHYT" },
  { key: "evening", label: "Khám ngoài giờ (Tối & Cuối tuần)" },
  { key: "vip", label: "Khám Chuyên gia VIP" },
  { key: "ai", label: "Tư vấn qua Trợ lý AI" },
];

export const OTHER_SPECIALTIES =
  "Khoa Hô Hấp, Nội Tiết - Đái Tháo Đường, Ung Bướu, Ngoại Tạo Niệu, Da Liễu Thẩm Mỹ, Gây Mê Hồi Sức, Dinh Dưỡng Lâm Sàng...";

// TODO: thay bằng API danh mục chuyên khoa (UC04) và bác sĩ đang hoạt động (UC03)
export const SPECIALTIES: Specialty[] = [
  {
    slug: "tim-mach-can-thiep",
    group: "noi",
    badge: "KHỐI NỘI CAN THIỆP",
    icon: "heart",
    name: "Khoa Tim Mạch Can Thiệp & Đột Quỵ",
    head: { name: "PGS.TS.BS Trần Mai Loan", years: 25 },
    techniques: [
      "Đặt Stent mạch vành cấp cứu 24/7 (Can thiệp <60 phút)",
      "Can thiệp mạch máu não & lấy huyết khối cơ học",
      "Siêu âm Doppler màu 4D sắc nét thế hệ mới",
    ],
    doctors: 18,
    highlight: "Chuẩn JCI Hoa Kỳ",
    tags: ["bhyt", "evening", "vip", "ai"],
    keywords: ["tim", "đau ngực", "hồi hộp", "khó thở", "huyết áp", "đột quỵ"],
  },
  {
    slug: "noi-tieu-hoa-gan-mat",
    group: "noi",
    badge: "KHỐI NỘI KHOA",
    icon: "digestive",
    name: "Khoa Nội Tiêu Hóa - Gan Mật",
    head: { name: "TS.BS Lê Quang Huy", years: 22 },
    techniques: [
      "Nội soi NBI dải tần hẹp không đau phát hiện sớm ung thư tiêu hóa",
      "Điều trị trào ngược dạ dày GERD & vi khuẩn HP kháng thuốc",
      "Kiểm soát viêm gan virus B, C, xơ gan và gan nhiễm mỡ nhẹ cao",
    ],
    doctors: 15,
    highlight: "Olympus EVIS X1",
    tags: ["bhyt", "evening", "ai"],
    keywords: ["dạ dày", "đau bụng", "trào ngược", "ợ chua", "tiêu hóa", "gan", "đầy hơi"],
  },
  {
    slug: "co-xuong-khop-phcn",
    group: "ngoai",
    badge: "KHỐI NGOẠI - PHCN",
    icon: "bone",
    name: "Khoa Cơ Xương Khớp & Phục Hồi Chức Năng",
    head: { name: "BSCKII Nguyễn Văn Cường", years: 22 },
    techniques: [
      "Tiêm huyết tương giàu tiểu cầu (PRP) tự thân tái tạo khớp gối",
      "Phẫu thuật nội soi khớp vai, dây chằng chéo tr xâm lấn",
      "Phục hồi chức năng vận động công nghệ sóng xung kích Shockwave",
    ],
    doctors: 14,
    highlight: "Liệu pháp Sinh học PRP",
    tags: ["bhyt", "vip"],
    keywords: ["đau lưng", "khớp", "xương", "cổ vai gáy", "thoái hóa", "gối"],
  },
  {
    slug: "tai-mui-hong",
    group: "ngoai",
    badge: "KHỐI NGOẠI KHOA",
    icon: "ear",
    name: "Khoa Tai Mũi Họng & Đầu Mặt Cổ",
    head: { name: "BSCKII Đỗ Đình Minh", years: 24 },
    techniques: [
      "Cắt Amidan & nạo VA bằng dao Plasma không chảy máu, ra viện 24h",
      "Phẫu thuật nội soi xoang mũi chức năng (FESS) công nghệ Karl Storz",
      "Phẫu thuật chỉnh hình vách ngăn & và nhĩ nội soi vi phẫu",
    ],
    doctors: 12,
    highlight: "Dao Plasma lạnh Mỹ",
    tags: ["bhyt", "evening"],
    keywords: ["tai", "mũi", "họng", "xoang", "viêm họng", "ù tai", "amidan"],
  },
  {
    slug: "mat-khuc-xa",
    group: "ngoai",
    badge: "CHUYÊN KHOA GIÁC QUAN",
    icon: "eye",
    name: "Khoa Mắt & Khúc Xạ Chuyên Sâu",
    head: { name: "TS.BS Phạm Quỳnh Nga", years: 19 },
    techniques: [
      "Mổ đục thủy tinh thể Phaco công nghệ lạnh không đau",
      "Phẫu thuật khúc xạ ReLEx SMILE & Femto Lasik điều trị cận viễn loạn",
      "Khám soát tật khúc xạ đường bằng kính áp tròng ban đêm Ortho-K",
    ],
    doctors: 11,
    highlight: "Zeiss VisuMax SMILE",
    tags: ["bhyt", "vip", "ai"],
    keywords: ["mắt", "cận thị", "mờ mắt", "đục thủy tinh thể", "khô mắt"],
  },
  {
    slug: "rang-ham-mat",
    group: "ngoai",
    badge: "KHỐI NGOẠI THẨM MỸ",
    icon: "tooth",
    name: "Khoa Răng Hàm Mặt & Thẩm Mỹ Nụ Cười",
    head: { name: "BSCKII Vũ Đức Thắng", years: 21 },
    techniques: [
      "Cấy ghép Implant tức thì công nghệ máng hướng dẫn phẫu thuật 3D",
      "Chỉnh nha khay trong suốt Invisalign kỹ thuật số mô phỏng trước kết quả",
      "Nhổ răng khôn Piezotome sóng siêu âm không đau, không sưng nề",
    ],
    doctors: 10,
    highlight: "Vô trùng chuẩn Đức",
    tags: ["vip", "evening"],
    keywords: ["răng", "nhổ răng", "niềng", "implant", "sâu răng", "hàm"],
  },
  {
    slug: "than-kinh-so-nao",
    group: "noi",
    badge: "KHỐI NỘI KHOA",
    icon: "brain",
    name: "Khoa Thần Kinh Sọ Não",
    head: { name: "BSCKII Đỗ Viết Minh", years: 18 },
    techniques: [
      "Điều trị đột quỵ não giai đoạn vàng và phục hồi chức năng sớm",
      "Chẩn đoán động kinh, Parkinson bằng điện não đồ video",
      "Can thiệp nội mạch thần kinh chuyên sâu",
    ],
    doctors: 13,
    highlight: "MRI 3.0T Lumina",
    tags: ["bhyt", "ai"],
    keywords: ["đau đầu", "chóng mặt", "tê tay", "mất ngủ", "đột quỵ", "thần kinh"],
  },
  {
    slug: "nhi-tiem-chung",
    group: "nhi-san",
    badge: "KHỐI NHI",
    icon: "child",
    name: "Khoa Nhi & Tiêm Chủng",
    head: { name: "TS.BS Hoàng Thảo Chi", years: 20 },
    techniques: [
      "Không gian khám thân thiện, giảm lo sợ cho trẻ",
      "Vaccine chính hãng lưu trữ dây chuyền lạnh chuẩn GSP",
      "Theo dõi tăng trưởng, dinh dưỡng và tầm soát phát triển",
    ],
    doctors: 16,
    highlight: "Chuẩn GSP",
    tags: ["bhyt", "evening", "ai"],
    keywords: ["trẻ em", "bé", "sốt", "tiêm chủng", "vaccine", "ho"],
  },
  {
    slug: "san-phu-khoa",
    group: "nhi-san",
    badge: "KHỐI SẢN PHỤ KHOA",
    icon: "womb",
    name: "Khoa Sản Phụ Khoa & Hỗ Trợ Sinh Sản",
    head: { name: "PGS.TS Trần Mai Lan", years: 26 },
    techniques: [
      "Theo dõi thai kỳ và sàng lọc dị tật bào thai 4D",
      "Sinh không đau - chuyển dạ an toàn và êm ái",
      "Tầm soát ung thư cổ tử cung, ung thư vú",
    ],
    doctors: 14,
    highlight: "Siêu âm 4D Voluson",
    tags: ["bhyt", "vip"],
    keywords: ["thai", "kinh nguyệt", "phụ khoa", "sinh", "vú", "cổ tử cung"],
  },
];

/** Bỏ dấu + hạ chữ thường để tìm kiếm thân thiện với tiếng Việt */
export const norm = (s: string) =>
  s
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/g, "d")
    .replace(/Đ/g, "D")
    .toLowerCase();

/**
 * Gợi ý chuyên khoa theo từ khóa triệu chứng (chỉ để định hướng, KHÔNG chẩn đoán).
 * TODO: thay bằng AI service (UC09) - tra cứu chuyên khoa phù hợp, không kê đơn.
 */
export function suggestSpecialties(text: string): Specialty[] {
  const t = norm(text);
  if (!t.trim()) return [];
  return SPECIALTIES.filter((s) => s.keywords.some((k) => t.includes(norm(k)))).slice(0, 3);
}