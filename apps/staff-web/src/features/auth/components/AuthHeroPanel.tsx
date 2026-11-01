import {
  Activity,
  CalendarCheck,
  ShieldCheck,
  Stethoscope,
  UserCheck,
} from "lucide-react";

const HIGHLIGHTS = [
  {
    icon: Stethoscope,
    title: "Bác sĩ chuyên khoa & Lâm sàng",
    description:
      "Thực hiện phiên khám, xem tiền sử, kê đơn thuốc và quản lý hàng chờ chuyên môn.",
  },
  {
    icon: UserCheck,
    title: "Tiếp đón & Phân luồng tiếp nhận",
    description:
      "Check-in bệnh nhân hẹn trước/vãng lai, cấp số thứ tự và điều phối viện phí.",
  },
  {
    icon: CalendarCheck,
    title: "Điều hành & Quản trị hệ thống",
    description:
      "Quản lý nhân sự, phê duyệt tăng ca/nghỉ phép, xử lý ngoại lệ và tra soát nhật ký.",
  },
];

export function AuthHeroPanel() {
  return (
    <div className="relative hidden flex-col justify-between overflow-hidden bg-primary p-6 text-primary-foreground lg:flex lg:p-8">
      {/* Decorative background shapes */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -right-20 -top-20 size-80 rounded-full bg-brand-secondary/20 blur-3xl"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -bottom-20 -left-20 size-80 rounded-full bg-brand-secondary-light/30 blur-3xl"
      />

      {/* Brand Header */}
      <div className="relative z-10">
        <div className="inline-flex items-center gap-2 rounded-app-md border border-primary-foreground/20 bg-primary-foreground/10 px-3 py-1 backdrop-blur-xs">
          <ShieldCheck className="size-3.5 text-brand-tertiary" />
          <span className="text-label font-bold tracking-wider uppercase">
            Hệ thống Bệnh viện & Phòng khám
          </span>
        </div>

        <div className="mt-5">
          <div className="flex items-center gap-2.5">
            <div className="flex size-9.5 items-center justify-center rounded-app-xl bg-surface text-primary shadow-xs">
              <Activity className="size-5" />
            </div>
            <h1 className="text-heading font-extrabold tracking-tight sm:text-title">
              MediConnect Portal
            </h1>
          </div>
          <p className="mt-2.5 max-w-md text-caption leading-relaxed text-primary-foreground/85">
            Cổng điều hành và quản lý lâm sàng tập trung, hỗ trợ phối hợp nhịp
            nhàng giữa Bác sĩ, Lễ tân và Quản trị viên y tế.
          </p>
        </div>
      </div>

      {/* Feature Highlights */}
      <div className="relative z-10 my-auto space-y-2.5 py-4">
        {HIGHLIGHTS.map((item) => {
          const Icon = item.icon;
          return (
            <div
              key={item.title}
              className="flex items-start gap-3 rounded-app-xl border border-primary-foreground/15 bg-primary-foreground/5 p-3 backdrop-blur-xs transition hover:bg-primary-foreground/10"
            >
              <div className="flex size-8 shrink-0 items-center justify-center rounded-app-lg bg-primary-foreground/15 text-primary-foreground">
                <Icon className="size-4" />
              </div>
              <div className="space-y-0.5">
                <p className="text-caption font-bold text-primary-foreground">
                  {item.title}
                </p>
                <p className="text-label text-primary-foreground/80 leading-normal">
                  {item.description}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
