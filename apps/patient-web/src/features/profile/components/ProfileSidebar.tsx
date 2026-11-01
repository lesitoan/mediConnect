import {
  Activity,
  IdCard,
  ShieldCheck,
  Users,
} from "@/components/layout/icons";
import { ageOf, dobVN } from "../data";
import type {
  PatientMedicalRecord,
  PatientProfile,
} from "../services/patientProfileService";

export const NAV = [
  { id: "identity", label: "1. Định danh & Liên hệ", icon: IdCard },
  { id: "medical", label: "2. Tiền sử bệnh & Dị ứng", icon: Activity },
  { id: "contacts", label: "3. Liên hệ khẩn cấp", icon: Users },
  { id: "security", label: "4. Quyền riêng tư", icon: ShieldCheck },
] as const;

type Props = {
  profile: PatientProfile;
  records: PatientMedicalRecord[];
  dateOfBirth: string;
  gender: PatientProfile["gender"] | "";
  active: string;
  onNav: (id: string) => void;
};

const card =
  "rounded-2xl bg-white p-5 shadow-[0_6px_24px_rgba(10,90,132,0.08)]";

export default function ProfileSidebar({
  profile,
  records,
  dateOfBirth,
  gender,
  active,
  onNav,
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
  const allergyCount = records.filter(
    (record) => record.recordType === "ALLERGY",
  ).length;
  const historyCount = records.filter(
    (record) => record.recordType === "MEDICAL_HISTORY",
  ).length;
  const confirmedCount = records.filter(
    (record) => record.status === "CONFIRMED",
  ).length;
  const stats = [
    { value: records.length, label: "Bản ghi y tế" },
    { value: allergyCount, label: "Dị ứng" },
    { value: historyCount, label: "Tiền sử bệnh" },
    { value: confirmedCount, label: "Đã xác nhận" },
  ];

  return (
    <div className="space-y-5">
      {/* Thẻ cá nhân */}
      <div className={`${card} text-center`}>
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
      </div>

      {/* Mục lục */}
      <div className={card}>
        <p className="text-[10px] font-bold uppercase text-slate-500">
          Mục hồ sơ
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

      {/* Thống kê */}
      <div className={card}>
        <p className="flex items-center justify-between text-xs font-extrabold text-slate-800">
          Tóm tắt hồ sơ y tế
          <Activity className="h-4 w-4 text-[#2B6CB0]" />
        </p>
        <div className="mt-3 grid grid-cols-2 gap-2.5">
          {stats.map((s) => (
            <div key={s.label} className="rounded-xl bg-blue-50/70 p-3">
              <p className="text-xl font-extrabold text-[#0A5A84]">{s.value}</p>
              <p className="mt-0.5 text-[10px] text-slate-500">{s.label}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
