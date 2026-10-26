"use client";

import Link from "next/link";
import { useState } from "react";
import {
  ArrowRight,
  Bot,
  CalendarCheck,
  ChevronDown,
  Clock,
  FileText,
  FlaskConical,
  Headset,
  MapPin,
  Plus,
  Send,
  ShieldCheck,
  Sparkles,
  Stethoscope,
  Users,
  Check,
  Activity,
} from "@/components/layout/icons";
import { suggestSpecialties } from "../data";

/* ---------- Hero ---------- */

export function Hero({ onList, onAi }: { onList: () => void; onAi: () => void }) {
  return (
    <div className="grid items-center gap-8 py-10 lg:grid-cols-[1.15fr_1fr] lg:py-14">
      <div>
        <span className="inline-flex items-center gap-2 rounded-full border border-blue-100 bg-white/80 px-3.5 py-1.5 text-[10px] font-bold uppercase text-[#0A5A84]">
          <span className="h-1.5 w-1.5 rounded-full bg-[#2B6CB0]" />
          Hệ thống y khoa đa chuyên khoa toàn diện
        </span>
        <h1 className="mt-5 text-4xl font-extrabold leading-[1.15] text-slate-900 md:text-5xl">
          Khám Phá Hệ Thống
          <br />
          <span className="text-[#0A5A84]">Chuyên Khoa Y Tế MediConnect</span>
        </h1>
        <p className="mt-5 max-w-xl text-[15px] leading-relaxed text-slate-600">
          Hơn 22 chuyên khoa lâm sàng và cận lâm sàng đạt chuẩn quốc tế, trang bị máy móc hiện đại
          bậc nhất cùng hội đồng cố vấn y khoa, giáo sư, bác sĩ đầu ngành sẵn sàng đồng hành chăm
          sóc sức khỏe cho bạn và gia đình.
        </p>
        <div className="mt-7 flex flex-wrap gap-3">
          <button
            type="button"
            onClick={onList}
            className="inline-flex items-center gap-2 rounded-full bg-[#0A5A84] px-6 py-3.5 text-sm font-bold text-white shadow transition hover:bg-[#08486B]"
          >
            Xem danh sách 22+ Chuyên khoa
            <ChevronDown className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={onAi}
            className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-6 py-3.5 text-sm font-bold text-[#0A5A84] transition hover:bg-blue-50"
          >
            <Sparkles className="h-4 w-4" />
            Gợi ý khoa khám bằng AI
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="rounded-2xl bg-white p-5 shadow-[0_6px_24px_rgba(10,90,132,0.08)]">
          <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-100 text-[#0A5A84]">
            <Plus className="h-5 w-5" />
          </span>
          <p className="mt-3 text-4xl font-extrabold text-[#0A5A84]">22+</p>
          <p className="mt-1 text-sm font-extrabold text-slate-900">Chuyên khoa mũi nhọn</p>
          <p className="mt-1 text-[11px] leading-snug text-slate-500">
            Phủ rộng từ nội khoa, ngoại khoa đến can thiệp chuyên sâu.
          </p>
        </div>
        <div className="rounded-2xl bg-white p-5 shadow-[0_6px_24px_rgba(10,90,132,0.08)]">
          <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-100 text-[#0A5A84]">
            <Users className="h-5 w-5" />
          </span>
          <p className="mt-3 text-4xl font-extrabold text-[#0A5A84]">200+</p>
          <p className="mt-1 text-sm font-extrabold text-slate-900">Chuyên gia &amp; Bác sĩ</p>
          <p className="mt-1 text-[11px] leading-snug text-slate-500">
            Giáo sư, Tiến sĩ, Bác sĩ CKI-CKII từ nghiệp quốc tế.
          </p>
        </div>
        <div className="col-span-2 flex items-center justify-between gap-4 rounded-2xl bg-[#0A5A84] p-5 text-white shadow-[0_6px_24px_rgba(10,90,132,0.2)]">
          <div className="flex items-start gap-3">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-white/15">
              <Activity className="h-5 w-5" />
            </span>
            <div className="leading-tight">
              <p className="text-lg font-extrabold">100% Trang thiết bị đạt chuẩn G7</p>
              <p className="mt-1 text-[11px] text-white/75">
                MRI 3.0T Lumina, CT 512 lát, Phòng mổ Hybrid vô khuẩn áp lực âm.
              </p>
            </div>
          </div>
          <div className="shrink-0 text-right">
            <p className="text-3xl font-extrabold text-sky-200">99.4%</p>
            <p className="text-[9px] font-bold uppercase text-white/75">Hài lòng dịch vụ</p>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ---------- Gợi ý khoa bằng mô tả triệu chứng ---------- */

export function AiSymptomBanner() {
  const [text, setText] = useState("");
  const [result, setResult] = useState<ReturnType<typeof suggestSpecialties> | null>(null);

  return (
    <section
      id="ai"
      className="scroll-mt-32 overflow-hidden rounded-3xl bg-gradient-to-br from-[#0A5A84] via-[#1F6A9C] to-[#2B6CB0] p-6 text-white shadow-lg md:p-10"
    >
      <div className="grid items-center gap-8 lg:grid-cols-[1.4fr_1fr]">
        <div>
          <span className="inline-flex items-center gap-2 rounded-md bg-white/15 px-3 py-1.5 text-[10px] font-bold uppercase">
            <Sparkles className="h-3.5 w-3.5" />
            Trợ lý y tế thông minh MediCare AI
          </span>
          <h2 className="mt-4 text-3xl font-extrabold leading-tight">
            Chưa Biết Nên Khám Chuyên Khoa Nào?
          </h2>
          <p className="mt-3 max-w-xl text-sm leading-relaxed text-white/85">
            Mô tả triệu chứng hiện tại của bạn (VD: tức ngực sau gắng sức, đau âm ỉ mạn sườn phải,
            đau đầu chóng mặt kéo dài...). Trợ lý MediCare AI sẽ tự động phân tích và hướng dẫn bạn
            tới đúng bác sĩ và chuyên khoa phù hợp trong 30 giây.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Link
              href="/tro-ly-ai"
              className="inline-flex items-center gap-2 rounded-full bg-white px-5 py-3 text-xs font-bold text-[#0A5A84] transition hover:bg-blue-50"
            >
              <Bot className="h-4 w-4" />
              Tư vấn cùng MediCare AI ngay
            </Link>
            <a
              href="tel:1900986868"
              className="inline-flex items-center gap-2 rounded-full bg-white/15 px-5 py-3 text-xs font-bold text-white ring-1 ring-white/25 transition hover:bg-white/25"
            >
              <Headset className="h-4 w-4" />
              Tổng đài miễn phí: 1900 986 868
            </a>
          </div>
        </div>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            setResult(suggestSpecialties(text));
          }}
          className="rounded-2xl bg-white p-5 text-slate-800 shadow-xl"
        >
          <p className="flex items-center gap-2 text-sm font-extrabold text-[#0A5A84]">
            <Stethoscope className="h-4 w-4" />
            Thử mô tả nhanh triệu chứng:
          </p>
          <textarea
            rows={3}
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Ví dụ: Tôi bị đau khớp gối khi leo cầu thang kèm sưng nhẹ 2 tuần nay..."
            aria-label="Mô tả triệu chứng"
            className="mt-3 w-full resize-none rounded-lg border border-slate-200 bg-slate-50 px-3 py-2.5 text-xs outline-none transition placeholder:text-slate-400 focus:border-[#2B6CB0] focus:bg-white focus:ring-2 focus:ring-[#2B6CB0]/20"
          />
          <button
            type="submit"
            disabled={!text.trim()}
            className="mt-3 flex w-full items-center justify-center gap-2 rounded-lg bg-[#0A5A84] py-3 text-xs font-bold text-white transition hover:bg-[#08486B] disabled:cursor-not-allowed disabled:bg-slate-300"
          >
            <Send className="h-4 w-4" />
            Gợi ý chuyên khoa ngay
          </button>

          {result && (
            <div className="mt-3 rounded-lg bg-blue-50 p-3 text-xs">
              {result.length === 0 ? (
                <p className="text-slate-600">
                  Chưa tìm được chuyên khoa phù hợp. Bạn thử mô tả rõ hơn hoặc gọi tổng đài để được
                  hướng dẫn.
                </p>
              ) : (
                <>
                  <p className="font-bold text-[#0A5A84]">Bạn có thể tham khảo:</p>
                  <ul className="mt-2 space-y-1.5">
                    {result.map((s) => (
                      <li key={s.slug}>
                        <Link
                          href={`/dat-lich?specialty=${s.slug}`}
                          className="inline-flex items-center gap-1.5 font-bold text-[#0A5A84] hover:underline"
                        >
                          {s.name}
                          <ArrowRight className="h-3 w-3" />
                        </Link>
                      </li>
                    ))}
                  </ul>
                </>
              )}
            </div>
          )}

          <p className="mt-3 flex items-center justify-center gap-1.5 text-[10px] italic text-slate-500">
            <ShieldCheck className="h-3 w-3" />
            Gợi ý chỉ mang tính định hướng, không thay thế chẩn đoán của bác sĩ.
          </p>
        </form>
      </div>
    </section>
  );
}

/* ---------- Hành trình khám chữa bệnh ---------- */

const STEPS = [
  {
    n: "01",
    icon: Check,
    title: "Tiếp Đón & Đăng Ký",
    desc: "Check-in nhanh bằng mã QR đặt lịch trước hoặc căn cước gắn chip tại quầy tiếp đón thông minh. Nhận vòng tay y tế định danh.",
    foot: "Thời gian: ~3-5 phút",
    footIcon: Clock,
  },
  {
    n: "02",
    icon: Stethoscope,
    title: "Thăm Khám Chuyên Gia",
    desc: "Bác sĩ chuyên khoa sâu trực tiếp thăm khám kỹ lưỡng, khai thác tiền sử, lắng nghe triệu chứng và chỉ định xét nghiệm phù hợp.",
    foot: "Phòng khám riêng từ 1-1",
    footIcon: MapPin,
  },
  {
    n: "03",
    icon: FlaskConical,
    title: "Xét Nghiệm & CĐHA",
    desc: "Thực hiện tại Trung tâm xét nghiệm tự động hóa & máy chẩn đoán hình ảnh cao cấp. Kết quả đồng bộ số hóa lên hồ sơ bệnh án.",
    foot: "Hệ thống trả lời tự động",
    footIcon: Activity,
  },
  {
    n: "04",
    icon: FileText,
    title: "Tư Vấn Phác Đồ & Hướng Dẫn",
    desc: "Bác sĩ giải thích tường tận kết quả, đưa ra phác đồ điều trị cá thể hóa, cấp đơn thuốc điện tử và tư vấn lối sống sau khám.",
    foot: "Đồng hành hậu mãi 24/7",
    footIcon: CalendarCheck,
  },
];

export function Journey() {
  return (
    <section className="py-14">
      <div className="mx-auto max-w-2xl text-center">
        <span className="inline-block rounded-full bg-blue-100 px-4 py-1.5 text-[10px] font-bold uppercase text-[#0A5A84]">
          Quy trình chuẩn hóa quốc tế
        </span>
        <h2 className="mt-4 text-3xl font-extrabold text-slate-900">
          Hành Trình Khám Chữa Bệnh Liên Chuyên Khoa Tối Ưu
        </h2>
        <p className="mt-3 text-sm text-slate-600">
          Trải nghiệm dịch vụ y tế khép kín, không chờ đợi, ứng dụng thẻ bệnh án điện tử và điều
          phối liên khoa thông minh.
        </p>
      </div>

      <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {STEPS.map(({ n, icon: Ico, title, desc, foot, footIcon: FIco }) => (
          <div
            key={n}
            className="flex flex-col rounded-2xl bg-white p-5 shadow-[0_6px_24px_rgba(10,90,132,0.07)]"
          >
            <div className="flex items-start justify-between">
              <span className="text-4xl font-extrabold text-[#0A5A84]">{n}</span>
              <Ico className="h-5 w-5 text-[#2B6CB0]" />
            </div>
            <h3 className="mt-3 text-base font-extrabold text-slate-900">{title}</h3>
            <p className="mt-2 text-[11px] leading-relaxed text-slate-500">{desc}</p>
            <p className="mt-auto flex items-center gap-1.5 pt-4 text-[11px] font-bold text-[#0A5A84]">
              <FIco className="h-3.5 w-3.5" />
              {foot}
            </p>
          </div>
        ))}
      </div>
    </section>
  );
}

/* ---------- Thanh hỗ trợ điều phối ---------- */

export function ConciergeBar() {
  return (
    <div className="flex flex-wrap items-center justify-between gap-4 rounded-2xl bg-white p-5 shadow-[0_6px_24px_rgba(10,90,132,0.07)]">
      <div className="flex items-center gap-4">
        <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-sky-100 text-[#0A5A84]">
          <Headset className="h-5 w-5" />
        </span>
        <div className="leading-tight">
          <p className="text-base font-extrabold text-slate-900">
            Bạn cần hỗ trợ điều phối lịch khám đa chuyên khoa cùng ngày?
          </p>
          <p className="mt-1 text-[11px] text-slate-500">
            Đội ngũ điều dưỡng Concierge Care của MediConnect sẽ sắp xếp lộ trình khám khoa học giúp
            bạn tiết kiệm thời gian nhất.
          </p>
        </div>
      </div>
      <div className="flex gap-3">
        <button
          type="button"
          // TODO: gửi yêu cầu điều phối cho lễ tân / quản trị (ngoài phạm vi SRS hiện tại)
          className="rounded-full bg-slate-100 px-5 py-2.5 text-xs font-bold text-[#0A5A84] transition hover:bg-blue-100"
        >
          Gửi yêu cầu điều phối
        </button>
        <Link
          href="/dat-lich"
          className="rounded-full bg-[#0A5A84] px-5 py-2.5 text-xs font-bold text-white transition hover:bg-[#08486B]"
        >
          Đặt hẹn ngay
        </Link>
      </div>
    </div>
  );
}