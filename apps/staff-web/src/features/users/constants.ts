import { DEFAULT_PAGE_SIZE } from "@/constants/constants";
import { getInitials } from "@/lib/utils";
import type {
  User,
  UserRole,
  UserStatus,
  UserRoleFilter,
  UserStatusFilter,
} from "./types/userTypes";

export interface UserTableFilterValues {
  role: UserRoleFilter;
  status: UserStatusFilter;
  department: string;
  search: string;
  page: number;
  pageSize: number;
}

export const PAGE_SIZE_OPTIONS = [7, 10, 20, 50] as const;

export const DEFAULT_FILTERS: UserTableFilterValues = {
  role: "ALL",
  status: "ALL",
  department: "",
  search: "",
  page: 1,
  pageSize: DEFAULT_PAGE_SIZE,
};

export const DEPARTMENTS = [
  "Ban Giám đốc · Quản trị hệ thống",
  "Trưởng khoa Tim Mạch Can Thiệp",
  "Bác sĩ Nhi & Sơ sinh",
  "Khoa Chấn thương chỉnh hình",
  "Khoa Mắt & Tai Mũi Họng",
  "Khoa Nội Tiết & Đái Tháo Đường",
  "Trưởng nhóm Tiếp đón Quầy 1",
  "Tiếp đón & Hướng dẫn Quầy 2",
  "Nhân viên Thu ngân (Đã bàn giao)",
  "Bộ phận Chăm sóc khách hàng",
  "Hồ sơ BN",
] as const;

export const SEED_USERS: User[] = [
  {
    id: "usr-001",
    code: "ADM01",
    name: "BS. Nguyễn Tuấn Kiệt",
    isCurrentUser: true,
    department: "Ban Giám đốc · Quản trị hệ thống",
    email: "tuankiet.nguyen@mediconnect.vn",
    phone: "+84 912 345 678",
    role: "SUPER_ADMIN",
    status: "ACTIVE",
    createdAt: "12/01/2023",
    avatarColor: "#2D74A8",
    initials: "TK",
    twoFactorEnabled: true,
    lastLogin: "Hôm nay, 10:30 AM",
  },
  {
    id: "usr-002",
    code: "DOC102",
    name: "ThS.BS. Trần Minh Hoàng",
    department: "Trưởng khoa Tim Mạch Can Thiệp",
    email: "hoang.tran@mediconnect.vn",
    phone: "+84 908 112 233",
    role: "DOCTOR",
    status: "ACTIVE",
    createdAt: "18/03/2023",
    avatarColor: "#245f8a",
    initials: "TH",
    twoFactorEnabled: true,
    lastLogin: "Hôm qua, 16:45 PM",
  },
  {
    id: "usr-003",
    code: "DOC115",
    name: "BS.CKI. Phan Mỹ Linh",
    department: "Bác sĩ Nhi & Sơ sinh",
    email: "mylinh.phan@mediconnect.vn",
    phone: "+84 933 456 789",
    role: "DOCTOR",
    status: "PENDING_OTP",
    createdAt: "22/10/2024",
    avatarColor: "#245f8a",
    initials: "PL",
    twoFactorEnabled: false,
    lastLogin: "Chưa đăng nhập lần đầu",
  },
  {
    id: "usr-004",
    code: "REC04",
    name: "Lê Hoàng Nhật Vy",
    department: "Trưởng nhóm Tiếp đón Quầy 1",
    email: "nhatvy.le@mediconnect.vn",
    phone: "+84 945 889 900",
    role: "RECEPTIONIST",
    status: "ACTIVE",
    createdAt: "05/06/2023",
    avatarColor: "#55B3D9",
    initials: "HN",
    twoFactorEnabled: true,
    lastLogin: "Hôm nay, 08:12 AM",
  },
  {
    id: "usr-005",
    code: "REC12",
    name: "Đặng Quốc Anh",
    department: "Nhân viên Thu ngân (Đã bàn giao)",
    email: "quocanh.dang@mediconnect.vn",
    phone: "+84 978 221 345",
    role: "RECEPTIONIST",
    status: "LOCKED",
    createdAt: "14/02/2024",
    avatarColor: "#cad8e6",
    initials: "DQ",
    twoFactorEnabled: false,
    lastLogin: "14/02/2024",
  },
  {
    id: "usr-006",
    code: "PAT892",
    name: "Ngô Văn Phúc",
    department: "Hồ sơ BN: BN-2024-9981",
    email: "phuc.ngo.vn@gmail.com",
    phone: "+84 961 778 899",
    role: "PATIENT",
    status: "ACTIVE",
    createdAt: "11/08/2024",
    avatarColor: "#deeaf3",
    avatarTextColor: "#141E26",
    initials: "NV",
    twoFactorEnabled: true,
    lastLogin: "15/10/2026",
  },
  {
    id: "usr-007",
    code: "PAT904",
    name: "Vũ Thị Mai Hoa",
    department: "Hồ sơ BN: BN-2024-9042",
    email: "maihoa.vu89@outlook.com",
    phone: "+84 982 334 556",
    role: "PATIENT",
    status: "LOCKED",
    createdAt: "01/09/2024",
    avatarColor: "#deeaf3",
    avatarTextColor: "#141E26",
    initials: "VT",
    twoFactorEnabled: false,
    lastLogin: "01/09/2024",
  },
];

function generateRemainingUsers(): User[] {
  const users: User[] = [];

  const extraAdmins = [
    { name: "Trịnh Quang Hưng", dept: "Phòng CNTT & Bảo mật" },
    { name: "Phạm Hải Đăng", dept: "Ban Thanh tra & Pháp chế" },
    { name: "Hoàng Minh Trí", dept: "Quản trị Cơ sở dữ liệu" },
    { name: "Đỗ Kim Ngân", dept: "Ban Quản lý Chất lượng" },
    { name: "Võ Văn Tài", dept: "Ban Giám đốc Bệnh viện" },
  ];
  extraAdmins.forEach((adm, idx) => {
    users.push({
      id: `usr-adm-${idx + 8}`,
      code: `ADM0${idx + 2}`,
      name: adm.name,
      department: adm.dept,
      email: `admin.${idx + 2}@mediconnect.vn`,
      phone: `+84 912 888 00${idx + 2}`,
      role: "ADMIN",
      status: "ACTIVE",
      createdAt: "10/02/2023",
      avatarColor: "#2D74A8",
      initials: getInitials(adm.name),
      twoFactorEnabled: true,
      lastLogin: "Hôm nay, 09:15 AM",
    });
  });

  const doctorNames = [
    "BS.CKII. Hoàng Văn Thắng",
    "ThS.BS. Lê Thị Bích",
    "BS. Đặng Ngọc Sơn",
    "BS.CKI. Nguyễn Thu Trang",
    "ThS.BS. Bùi Quang Huy",
    "BS. Mai Thị Hồng",
    "BS.CKII. Trương Tấn Phát",
    "BS. Đoàn Gia Bảo",
    "BS.CKI. Phan Thanh Tùng",
    "ThS.BS. Vũ Đình Trọng",
    "BS. Lương Khánh Vy",
    "BS.CKII. Đỗ Hoàng Long",
    "BS. Dương Hải Yến",
    "ThS.BS. Ngô Minh Hiếu",
    "BS. Lâm Quốc Cường",
    "BS.CKI. Tạ Phương Thảo",
    "BS. Chu Đình Dũng",
    "BS. Thân Văn Nam",
    "ThS.BS. Huỳnh Đức Thịnh",
    "BS.CKII. Trịnh Mai Phương",
    "BS. Nguyễn Đăng Khoa",
    "BS.CKI. Hà Văn Hùng",
    "BS. Lý Gia Hân",
    "ThS.BS. Tiêu Bửu Long",
    "BS. Quách Tuấn Kiệt",
    "BS. Phùng Nhật Linh",
    "BS.CKI. Tôn Thất Bách",
    "BS. Nhan Thế Vinh",
    "ThS.BS. Cung Đình Quân",
    "BS.CKII. Châu Mỹ Phượng",
    "BS. Bạch Quốc Toàn",
    "BS. Văn Tiến Dũng",
  ];
  const specialtiesList = [
    "Khoa Tim Mạch Can Thiệp",
    "Khoa Nhi & Sơ sinh",
    "Khoa Chấn thương chỉnh hình",
    "Khoa Mắt & Tai Mũi Họng",
    "Khoa Nội Tiết & Đái Tháo Đường",
    "Khoa Da Liễu Thẩm Mỹ",
  ];
  doctorNames.forEach((dName, idx) => {
    const docCode = `DOC${120 + idx}`;
    const status: UserStatus = idx % 9 === 0 ? "PENDING_OTP" : "ACTIVE";
    users.push({
      id: `usr-doc-${idx + 10}`,
      code: docCode,
      name: dName,
      department: specialtiesList[idx % specialtiesList.length],
      email: `doctor.${120 + idx}@mediconnect.vn`,
      phone: `+84 903 ${String(100 + idx).padStart(3, "0")} ${String(200 + idx).padStart(3, "0")}`,
      role: "DOCTOR",
      status,
      createdAt: "15/04/2023",
      avatarColor: "#245f8a",
      initials: getInitials(dName.replace(/^(BS\.CKII\.|ThS\.BS\.|BS\.CKI\.|BS\.)\s*/, "")),
      twoFactorEnabled: true,
      lastLogin: "16/10/2026",
    });
  });

  const receptionistNames = [
    "Nguyễn Thị Hương Giang",
    "Trần Bảo Ngọc",
    "Phạm Thu Hà",
    "Đỗ Hải Đăng",
    "Lê Minh Quân",
    "Bùi Thùy Dung",
    "Hoàng Yến Nhi",
    "Vũ Quốc Đạt",
    "Mai Khánh Huyền",
    "Phan Tấn Lộc",
    "Lý Kim Chi",
    "Đặng Thị Cẩm Tú",
    "Trương Quốc Hưng",
    "Hồ Diệu My",
    "Cao Văn Thắng",
    "Đoàn Mai Chi",
  ];
  receptionistNames.forEach((rName, idx) => {
    const recCode = `REC${String(15 + idx).padStart(2, "0")}`;
    const status: UserStatus = idx % 5 === 0 ? "LOCKED" : "ACTIVE";
    users.push({
      id: `usr-rec-${idx + 20}`,
      code: recCode,
      name: rName,
      department: idx % 2 === 0 ? "Tiếp đón Quầy 1" : "Tiếp đón & Hướng dẫn Quầy 2",
      email: `reception.${15 + idx}@mediconnect.vn`,
      phone: `+84 944 ${String(300 + idx).padStart(3, "0")} ${String(400 + idx).padStart(3, "0")}`,
      role: "RECEPTIONIST",
      status,
      createdAt: "20/06/2023",
      avatarColor: status === "LOCKED" ? "#cad8e6" : "#55B3D9",
      initials: getInitials(rName),
      twoFactorEnabled: status !== "LOCKED",
      lastLogin: "16/10/2026",
    });
  });

  const patientNames = [
    "Trần Quang Khải", "Phạm Thị Thảo", "Hoàng Văn Tuấn", "Lê Thị Thu",
    "Đặng Minh Tâm", "Bùi Thanh Phong", "Nguyễn Hồng Hạnh", "Vũ Đình Nam",
    "Mai Thị Quyên", "Đỗ Hữu Phước", "Phan Cẩm Vân", "Lý Thanh Tùng",
    "Hồ Bích Ngọc", "Trương Gia Huy", "Cao Thùy Trang", "Đoàn Văn Dũng",
    "Nguyễn Thị Lan", "Trần Đình Trọng", "Phạm Hồng Quân", "Lê Bảo Châu",
    "Hoàng Hải Nam", "Đỗ Mỹ Linh", "Bùi Thế Anh", "Vũ Thị Ngân",
    "Mai Văn Khánh", "Đặng Thị Hoa", "Phan Hùng Dũng", "Lý Thị Thắm",
    "Trương Minh Trí", "Hồ Thị Nga", "Cao Đăng Khoa", "Đoàn Thị Tuyết",
    "Nguyễn Văn Bình", "Trần Thị Mai", "Phạm Quốc Tuấn", "Lê Hoàng Oanh",
    "Hoàng Thế Bảo", "Đỗ Kim Phượng", "Bùi Quang Trung", "Vũ Thị Bích",
    "Mai Đức Anh", "Đặng Văn Hùng", "Phan Thị Hằng", "Lý Minh Triết",
    "Trương Kiều Oanh", "Hồ Văn Long", "Cao Mỹ Duyên", "Đoàn Tấn Tài",
    "Nguyễn Thị Ánh", "Trần Hữu Thắng", "Phạm Thị Diệu", "Lê Văn Đạt",
    "Hoàng Thị Nhàn", "Đỗ Duy Mạnh", "Bùi Thị Tuyết", "Vũ Quốc Cường",
    "Mai Thị Sen", "Đặng Đình Luật", "Phan Thị Ngọc", "Lý Văn Hiếu",
    "Trương Cẩm Hường", "Hồ Thanh Bình", "Cao Văn Hậu", "Đoàn Minh Thu",
    "Nguyễn Quốc Bảo", "Trần Thị Xuân", "Phạm Văn Tân", "Lê Thị Hồng"
  ];
  patientNames.forEach((pName, idx) => {
    const patCode = `PAT${910 + idx}`;
    const status: UserStatus = idx % 7 === 0 ? "LOCKED" : "ACTIVE";
    users.push({
      id: `usr-pat-${idx + 30}`,
      code: patCode,
      name: pName,
      department: `Hồ sơ BN: BN-2024-${9100 + idx}`,
      email: `patient.${910 + idx}@gmail.com`,
      phone: `+84 968 ${String(500 + idx).padStart(3, "0")} ${String(600 + idx).padStart(3, "0")}`,
      role: "PATIENT",
      status,
      createdAt: "10/09/2024",
      avatarColor: "#deeaf3",
      avatarTextColor: "#141E26",
      initials: getInitials(pName),
      twoFactorEnabled: status !== "LOCKED",
      lastLogin: "12/10/2026",
    });
  });

  return users;
}

export const INITIAL_USERS: User[] = [
  ...SEED_USERS,
  ...generateRemainingUsers(),
];
