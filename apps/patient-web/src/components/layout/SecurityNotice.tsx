import Link from "next/link";
import { ShieldCheck } from "./icons";

export default function SecurityNotice() {
  return (
    <div className="flex flex-col gap-4 rounded-2xl bg-blue-50/80 px-6 py-5 ring-1 ring-blue-100 md:flex-row md:items-center md:justify-between">
      <div className="flex items-center gap-4">
        <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-white text-[#0A5A84] shadow-sm">
          <ShieldCheck className="h-6 w-6" />
        </span>
        <div className="leading-tight">
          <h3 className="text-base font-extrabold text-slate-900">
            Bảo Mật Bệnh Án Chuẩn Quốc Tế ISO 27799
          </h3>
          <p className="mt-1 text-xs text-slate-600">
            Mọi dữ liệu xét nghiệm và đơn thuốc được mã hóa đầu cuối. Bạn có toàn quyền chia sẻ
            hoặc thu hồi quyền truy cập hồ sơ y tế.
          </p>
        </div>
      </div>
      <div className="flex shrink-0 items-center gap-3 text-xs font-bold text-[#0A5A84]">
        <Link href="/dieu-khoan-chia-se-ho-so" className="hover:underline">
          Điều khoản chia sẻ hồ sơ
        </Link>
        <span className="h-1 w-1 rounded-full bg-slate-300" />
        <Link href="/ho-tro-ky-thuat" className="hover:underline">
          Trợ giúp kỹ thuật 24/7
        </Link>
      </div>
    </div>
  );
}