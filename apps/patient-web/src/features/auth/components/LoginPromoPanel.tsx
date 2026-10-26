import {
  Bot,
  CalendarCheck,
  FileText,
  Lock,
  ShieldCheck,
} from "@/components/layout/icons";

const FEATURES = [
  {
    icon: FileText,
    title: "Hồ sơ bệnh án điện tử (EMR)",
    desc: "Tra cứu nhanh xét nghiệm, hình ảnh MRI/CT và đơn thuốc.",
  },
  {
    icon: CalendarCheck,
    title: "Đặt lịch khám & Tiếp đón ưu tiên",
    desc: "Chủ động hẹn bác sĩ, nhận số thứ tự không cần chờ đợi.",
  },
  {
    icon: Bot,
    title: "Trợ lý sức khỏe MediCare AI",
    desc: "Tư vấn phân luồng triệu chứng và nhắc lịch uống thuốc 24/7.",
  },
];

export default function LoginPromoPanel() {
  return (
    <div className="relative hidden overflow-hidden bg-gradient-to-br from-[#2B6CB0] via-[#1F5AA0] to-[#174A8F] p-8 text-white lg:flex lg:flex-col lg:p-10">
      {/* Họa tiết chữ thập mờ */}
      <span
        aria-hidden="true"
        className="pointer-events-none absolute -right-10 -top-10 h-56 w-56 rotate-12 opacity-10"
      >
        <span className="absolute left-1/2 top-0 h-full w-16 -translate-x-1/2 rounded-xl bg-white" />
        <span className="absolute left-0 top-1/2 h-16 w-full -translate-y-1/2 rounded-xl bg-white" />
      </span>

      <div className="relative flex flex-1 flex-col">
        <span className="inline-flex w-fit items-center gap-2 rounded-full border border-white/30 bg-white/15 px-3 py-1.5 text-[10px] font-bold uppercase tracking-wide">
          <ShieldCheck className="h-3.5 w-3.5" />
          Cổng thông tin y tế MediConnect
        </span>

        <h2 className="mt-6 text-3xl font-extrabold leading-tight">
          Đồng hành chăm sóc sức khỏe toàn diện
        </h2>
        <p className="mt-3 max-w-sm text-sm leading-relaxed text-white/80">
          Hệ sinh thái y tế thông minh, kết nối an toàn với đội ngũ bác sĩ
          chuyên khoa và hồ sơ bệnh án số hóa.
        </p>

        <ul className="mt-8 space-y-4">
          {FEATURES.map(({ icon: Ico, title, desc }) => (
            <li
              key={title}
              className="flex items-start gap-3 rounded-xl border border-white/15 bg-white/10 p-4 backdrop-blur"
            >
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-white/15">
                <Ico className="h-5 w-5" />
              </span>
              <span className="leading-tight">
                <span className="block text-sm font-bold">{title}</span>
                <span className="mt-1 block text-xs text-white/75">{desc}</span>
              </span>
            </li>
          ))}
        </ul>

        <div className="mt-auto flex items-center justify-between pt-8 text-[11px] text-white/80">
          <span className="flex items-center gap-1.5">
            <ShieldCheck className="h-3.5 w-3.5" />
            Chuẩn HIPAA
          </span>
          <span className="flex items-center gap-1.5">
            <Lock className="h-3.5 w-3.5" />
            Mã hóa SSL 256-Bit
          </span>
        </div>
      </div>
    </div>
  );
}