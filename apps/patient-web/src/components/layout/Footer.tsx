import Link from "next/link";
import {
  BadgeCheck,
  BarChart,
  ChevronRight,
  Eye,
  Mail,
  MapPin,
  PhoneCall,
  Shield,
} from "./icons";

const MEDICAL_LINKS = [
  { label: "Khám sức khỏe tổng quát", href: "/chuyen-khoa/kham-suc-khoe-tong-quat" },
  { label: "Chẩn đoán hình ảnh cao cấp", href: "/dich-vu/chan-doan-hinh-anh" },
  { label: "Phẫu thuật nội soi ít xâm lấn", href: "/dich-vu/phau-thuat-noi-soi" },
  { label: "Thai sản và Sinh con trọn gói", href: "/dich-vu/thai-san" },
  { label: "Điều trị nội trú VIP", href: "/dich-vu/noi-tru-vip" },
  { label: "Vận chuyển cấp cứu đường dài", href: "/dich-vu/van-chuyen-cap-cuu" },
];

const SUPPORT_LINKS = [
  { label: "Tra cứu kết quả xét nghiệm", href: "/tra-cuu" },
  { label: "Bảng giá viện phí công khai", href: "/bang-gia" },
  { label: "Chính sách Bảo hiểm Y tế & Bảo lãnh", href: "/bao-hiem" },
  { label: "Hướng dẫn quy trình đón tiếp", href: "/huong-dan" },
  { label: "Lịch trực bác sĩ chuyên gia", href: "/lich-truc" },
  { label: "Câu hỏi thường gặp (FAQ)", href: "/faq" },
];

const LEGAL_LINKS = [
  { label: "Chính sách bảo mật", href: "/chinh-sach-bao-mat" },
  { label: "Điều khoản sử dụng", href: "/dieu-khoan" },
  { label: "Sơ đồ website", href: "/so-do-website" },
];

// Cùng lề với header
const wrap = "w-full px-4 sm:px-6 lg:px-10 2xl:px-16";

function LinkList({ items }: { items: { label: string; href: string }[] }) {
  return (
    <ul className="mt-5 space-y-3">
      {items.map((i) => (
        <li key={i.href}>
          <Link
            href={i.href}
            className="group flex items-center gap-1.5 text-sm text-slate-600 transition hover:text-[#174A8F]"
          >
            <ChevronRight className="h-3.5 w-3.5 text-slate-400 transition group-hover:translate-x-0.5 group-hover:text-[#174A8F]" />
            {i.label}
          </Link>
        </li>
      ))}
    </ul>
  );
}

export default function Footer() {
  return (
    <footer className="border-t border-slate-200 bg-[#F6F9FE]">
      <div className={`${wrap} pb-6 pt-14`}>
        <div className="grid gap-10 md:grid-cols-2 lg:grid-cols-[1.3fr_1fr_1fr_1.1fr] lg:gap-12 2xl:gap-20">
          {/* Cột 1: thông tin */}
          <div>
            <Link href="/" className="flex items-center gap-3">
              <span className="flex h-11 w-11 items-center justify-center rounded-lg bg-[#174A8F] text-white shadow">
                <span className="flex h-6 w-6 items-center justify-center rounded-[5px] border-2 border-white text-base font-bold leading-none">
                  +
                </span>
              </span>
              <span className="text-xl font-extrabold tracking-wide text-[#174A8F]">
                MEDICONNECT
              </span>
            </Link>

            <p className="mt-5 max-w-sm text-xs leading-relaxed text-slate-600">
              Hệ thống Bệnh viện Đa khoa Quốc tế tiên phong về chất lượng khám
              chữa bệnh chuyên sâu, ứng dụng công nghệ cao đạt chuẩn quốc tế
              JCI.
            </p>

            <ul className="mt-5 space-y-3 text-xs text-slate-600">
              <li className="flex items-start gap-2.5">
                <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-[#174A8F]" />
                Số 126 Đường Hoàng Hoa Thám, Ba Đình, Hà Nội
              </li>
              <li className="flex items-center gap-2.5">
                <PhoneCall className="h-4 w-4 shrink-0 text-[#174A8F]" />
                Tổng đài: 1900 986 868
              </li>
              <li className="flex items-center gap-2.5">
                <Mail className="h-4 w-4 shrink-0 text-[#174A8F]" />
                <a href="mailto:contact@mediconnect.vn">contact@mediconnect.vn</a>
              </li>
            </ul>
          </div>

          {/* Cột 2 */}
          <div>
            <h3 className="text-lg font-bold text-slate-900">Dịch Vụ Y Tế</h3>
            <LinkList items={MEDICAL_LINKS} />
          </div>

          {/* Cột 3 */}
          <div>
            <h3 className="text-lg font-bold text-slate-900">
              Hỗ Trợ &amp; Tra Cứu
            </h3>
            <LinkList items={SUPPORT_LINKS} />
          </div>

          {/* Cột 4 */}
          <div>
            <h3 className="text-lg font-bold text-slate-900">
              Kênh Thông Tin &amp; Thống Kê
            </h3>
            <p className="mt-5 max-w-xs text-xs leading-relaxed text-slate-600">
              Theo dõi các tin tức y khoa và lời khuyên chăm sóc sức khỏe chủ
              động từ bác sĩ.
            </p>

            {/* Giá trị đặt cạnh nhãn (không đẩy ra mép phải) để không bị cụm nút nổi che */}
            <ul className="mt-4 space-y-2.5 text-xs text-slate-600">
              <li className="flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-emerald-500" />
                <span className="w-32">Đang trực tuyến:</span>
                <b className="text-slate-900">128</b>
              </li>
              <li className="flex items-center gap-2">
                <Eye className="h-3.5 w-3.5 text-slate-400" />
                <span className="w-32">Hôm nay:</span>
                <b className="text-slate-900">2.416</b>
              </li>
              <li className="flex items-center gap-2">
                <BarChart className="h-3.5 w-3.5 text-slate-400" />
                <span className="w-32">Tổng lượt truy cập:</span>
                <b className="text-slate-900">9.482.350</b>
              </li>
            </ul>

            <div className="mt-4 flex flex-wrap gap-3">
              <span className="flex items-center gap-1.5 rounded-md border border-slate-200 bg-white px-3 py-2 text-[10px] font-bold uppercase leading-tight text-slate-700">
                <BadgeCheck className="h-4 w-4 text-[#2B6CB0]" />
                ISO
                <br />
                9001:2015
              </span>
              <span className="flex items-center gap-1.5 rounded-md border border-slate-200 bg-white px-3 py-2 text-[10px] font-bold uppercase leading-tight text-slate-700">
                <Shield className="h-4 w-4 text-[#2B6CB0]" />
                DMCA
                <br />
                Protected
              </span>
            </div>
          </div>
        </div>

        {/* Dòng bản quyền */}
        <div className="mt-12 flex flex-col gap-3 border-t border-slate-200 pt-6 text-xs text-slate-500 md:flex-row md:items-center md:justify-between">
          <p>
            © {new Date().getFullYear()} MediConnect International General
            Hospital. Bản quyền đã được bảo hộ.
          </p>
          <ul className="flex flex-wrap gap-x-6 gap-y-2 md:mr-0 lg:mr-24">
            {LEGAL_LINKS.map((l) => (
              <li key={l.href}>
                <Link href={l.href} className="transition hover:text-[#174A8F]">
                  {l.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </footer>
  );
}