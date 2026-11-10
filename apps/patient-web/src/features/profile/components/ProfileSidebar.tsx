import {
  BadgeCheck,
  HeartPulse,
  LogOut,
  ShieldCheck,
  User,
} from "@/components/layout/icons";
import { ageOf, dobVN } from "../data";
import type { PatientProfile } from "../services/patientProfileService";

export const NAV = [
  { id: "identity", label: "Thông tin cá nhân", icon: User },
  { id: "allergies", label: "Tiền sử dị ứng", icon: HeartPulse },
  { id: "security", label: "Bảo mật tài khoản", icon: ShieldCheck },
] as const;

type Props = {
  profile: PatientProfile;
  dateOfBirth: string;
  gender: PatientProfile["gender"] | "";
  active: string;
  onNav: (id: string) => void;
  onLogout: () => void;
};

const card =
  "overflow-hidden rounded-2xl border border-white/80 bg-white shadow-[0_8px_28px_rgba(10,90,132,0.09)]";

export default function ProfileSidebar({
  profile,
  dateOfBirth,
  gender,
  active,
  onNav,
  onLogout,
}: Props) {
  const name = profile.fullName;
  const initials = name
    .trim()
    .split(/\s+/)
    .slice(-2)
    .map((w) => w[0])
    .join("")
    .toUpperCase();
  const age = ageOf(dateOfBirth || null);
  const genderLabel =
    gender === "MALE"
      ? "Nam"
      : gender === "FEMALE"
        ? "Nữ"
        : gender === "OTHER"
          ? "Khác"
          : "Chưa cập nhật";
  return (
    <div className={card}>
      <div className="p-5 text-center">
        <div className="relative mx-auto h-24 w-24">
          <span className="flex h-24 w-24 items-center justify-center rounded-full bg-gradient-to-br from-[#2B6CB0] to-[#0A5A84] text-3xl font-extrabold text-white ring-4 ring-blue-100">
            {initials}
          </span>
        </div>
        <h2 className="mt-4 text-xl font-extrabold text-slate-900">{name}</h2>
        <p className="mt-0.5 text-xs text-slate-500">
          {genderLabel}
          {age !== null && ` • ${age} tuổi (${dobVN(dateOfBirth)})`}
        </p>
        <div className="mt-3 flex justify-center gap-2 text-[10px] font-bold">
          <span className="rounded-full bg-blue-100 px-2.5 py-1 text-[#0A5A84]">
            PID: {profile.patientCode}
          </span>
        </div>
        <span className="mt-2 inline-flex items-center gap-1 rounded-full bg-blue-100 px-2.5 py-1 text-[10px] font-bold text-[#0A5A84]">
          <BadgeCheck className="h-3 w-3" />
          Đã xác thực
        </span>
      </div>

      <div className="border-t border-slate-100 px-3 py-5">
        <p className="px-2 text-[10px] font-bold uppercase tracking-wide text-slate-500">
          Quản lý hồ sơ
        </p>
        <ul className="mt-3 space-y-1.5">
          {NAV.map(({ id, label, icon: Ico }) => {
            const isActive = active === id;
            return (
              <li key={id}>
                <button
                  type="button"
                  onClick={() => onNav(id)}
                  aria-current={isActive ? "true" : undefined}
                  className={`flex w-full items-center gap-2.5 rounded-lg px-3 py-2.5 text-left text-xs font-bold transition ${
                    isActive
                      ? "bg-[#0A5A84] text-white"
                      : "text-slate-700 hover:bg-blue-50"
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

      <div className="border-t border-slate-100 p-4">
        <button
          type="button"
          onClick={onLogout}
          className="flex w-full items-center justify-center gap-2 rounded-xl border border-slate-200 px-4 py-3 text-xs font-bold text-red-600 transition hover:border-red-200 hover:bg-red-50"
        >
          <LogOut className="h-4 w-4" />
          Đăng xuất
        </button>
      </div>
    </div>
  );
}
