import { Camera, Download, QrCode, Search, Activity, IdCard, ShieldCheck, Users } from "@/components/layout/icons";
import { ageOf, dobVN, PROFILE } from "../data";

export const NAV = [
  { id: "identity", label: "1. Định danh & Liên hệ", icon: IdCard },
  { id: "medical", label: "2. Chỉ số & Tiền sử bệnh", icon: Activity },
  { id: "contacts", label: "3. Liên hệ khẩn cấp & Người thân", icon: Users },
  { id: "security", label: "4. Tài khoản & Bảo mật", icon: ShieldCheck },
] as const;

type Props = {
  name: string;
  pid: string;
  dob: string;
  gender: string;
  active: string;
  onNav: (id: string) => void;
};

const card = "rounded-2xl bg-white p-5 shadow-[0_6px_24px_rgba(10,90,132,0.08)]";

export default function ProfileSidebar({ name, pid, dob, gender, active, onNav }: Props) {
  const initials = name.trim().split(/\s+/).slice(-2).map((w) => w[0]).join("").toUpperCase();

  return (
    <div className="space-y-5">
      {/* Thẻ cá nhân */}
      <div className={`${card} text-center`}>
        <div className="relative mx-auto h-24 w-24">
          <span className="flex h-24 w-24 items-center justify-center rounded-full bg-gradient-to-br from-[#2B6CB0] to-[#0A5A84] text-3xl font-extrabold text-white ring-4 ring-blue-100">
            {initials}
          </span>
          <button
            type="button"
            aria-label="Đổi ảnh đại diện"
            // TODO: tải ảnh đại diện lên server
            className="absolute -bottom-1 -right-1 flex h-8 w-8 items-center justify-center rounded-full bg-[#0A5A84] text-white shadow ring-2 ring-white"
          >
            <Camera className="h-4 w-4" />
          </button>
        </div>
        <h2 className="mt-4 text-xl font-extrabold text-slate-900">{name}</h2>
        <p className="mt-0.5 text-xs text-slate-500">
          {gender} • {ageOf(dob)} tuổi ({dobVN(dob)})
        </p>
        <div className="mt-3 flex justify-center gap-2 text-[10px] font-bold">
          <span className="rounded-full bg-blue-100 px-2.5 py-1 text-[#0A5A84]">PID: {pid}</span>
          <span className="rounded-full bg-sky-100 px-2.5 py-1 text-[#0A5A84]">Platinum VIP</span>
        </div>

        <div className="mt-4 rounded-xl bg-blue-50/70 p-4">
          <p className="text-[10px] font-bold uppercase text-[#0A5A84]">Mã QR định danh kiosk</p>
          {/* TODO: thay bằng mã QR thật do backend tạo cho bệnh nhân */}
          <span className="mx-auto mt-3 flex h-28 w-28 items-center justify-center rounded-lg bg-white text-slate-800 ring-1 ring-slate-200">
            <QrCode className="h-20 w-20" />
          </span>
          <p className="mt-2 text-[10px] text-slate-500">
            Quét để tự động tiếp đón &amp; check-in không xếp hàng
          </p>
          <div className="mt-2 flex justify-center gap-4 text-[10px] font-bold text-[#0A5A84]">
            <button type="button" className="inline-flex items-center gap-1 hover:underline">
              <Search className="h-3 w-3" />
              Phóng to
            </button>
            <button type="button" className="inline-flex items-center gap-1 hover:underline">
              <Download className="h-3 w-3" />
              Tải về máy
            </button>
          </div>
        </div>
      </div>

      {/* Mục lục */}
      <div className={card}>
        <p className="text-[10px] font-bold uppercase text-slate-500">Mục hồ sơ</p>
        <ul className="mt-3 space-y-1.5">
          {NAV.map(({ id, label, icon: Ico }) => {
            const on = active === id;
            return (
              <li key={id}>
                <button
                  type="button"
                  onClick={() => onNav(id)}
                  aria-current={on ? "true" : undefined}
                  className={`flex w-full items-center gap-2.5 rounded-lg px-3 py-2.5 text-left text-xs font-bold transition ${
                    on ? "bg-[#0A5A84] text-white" : "text-slate-700 hover:bg-blue-50"
                  }`}
                >
                  <Ico className="h-4 w-4" />
                  {label}
                </button>
              </li>
            );
          })}
        </ul>
      </div>

      {/* Thống kê */}
      <div className={card}>
        <p className="flex items-center justify-between text-xs font-extrabold text-slate-800">
          Thống kê y tế tại viện
          <Activity className="h-4 w-4 text-[#2B6CB0]" />
        </p>
        <div className="mt-3 grid grid-cols-2 gap-2.5">
          {PROFILE.stats.map((s) => (
            <div key={s.label} className="rounded-xl bg-blue-50/70 p-3">
              <p className="text-xl font-extrabold text-[#0A5A84]">{s.value}</p>
              <p className="mt-0.5 text-[10px] text-slate-500">{s.label}</p>
            </div>
          ))}
        </div>
        <p className="mt-3 rounded-lg bg-slate-50 px-3 py-2 text-[11px] text-slate-600">
          Bác sĩ gia đình: <b className="text-[#0A5A84]">{PROFILE.familyDoctor}</b>
        </p>
      </div>
    </div>
  );
}