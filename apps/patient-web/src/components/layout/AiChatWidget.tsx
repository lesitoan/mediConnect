"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import { useAuth } from "@/features/auth/useAuth";
import {
  BadgeCheck,
  Bot,
  CalendarCheck,
  CalendarPlus,
  CalendarX,
  Clock,
  MapPin,
  Mic,
  Minus,
  Paperclip,
  RefreshCw,
  Search,
  Send,
  X,
} from "./icons";

/* ---------- Kiểu dữ liệu ---------- */

type Role = "bot" | "user";

type Msg = {
  id: number;
  role: Role;
  time: string;
  text?: string;
  chips?: string[]; // nút gợi ý bấm để gửi nhanh
  appointment?: boolean; // hiển thị thẻ phiếu khám
};

const QUICK_TABS = [
  { label: "Tra cứu BS", icon: Search, prompt: "Tôi muốn tra cứu bác sĩ" },
  { label: "Đặt lịch mới", icon: CalendarPlus, prompt: "Tôi muốn đặt lịch khám mới" },
  { label: "Đổi lịch khám", icon: CalendarCheck, prompt: "Tôi muốn xem thông tin phiếu khám gần nhất và đổi lịch" },
  { label: "Hủy & hoàn phí", icon: CalendarX, prompt: "Tôi muốn hủy lịch khám" },
] as const;

const fmtTime = (d = new Date()) => {
  const h = d.getHours();
  const hh = String(h % 12 === 0 ? 12 : h % 12).padStart(2, "0");
  return `${hh}:${String(d.getMinutes()).padStart(2, "0")} ${h < 12 ? "SA" : "CH"}`;
};

let uid = 0;
const nextId = () => ++uid;

/* ---------- Bot giả lập ---------- */

/**
 * TODO: thay bằng lời gọi tới AI service (Python FastAPI), gửi kèm access token của
 * bệnh nhân đang đăng nhập. Theo SRS (UC09):
 * - AI chỉ gọi API tra cứu/đặt/đổi/hủy lịch, không truy cập EMR hay thanh toán.
 * - Mọi thao tác thay đổi dữ liệu phải được tóm tắt và bệnh nhân xác nhận trước.
 * - Độ tin cậy ý định thấp -> hiện menu làm rõ ý định thay vì tự suy đoán.
 * - Không chẩn đoán, không kê đơn.
 */
function botReply(input: string, loggedIn: boolean): Omit<Msg, "id" | "role" | "time"> {
  const t = input.toLowerCase();

  if (/(đau|sốt|ho |bệnh gì|uống thuốc|kê đơn|chẩn đoán)/.test(t)) {
    return {
      text:
        "Mình không thể chẩn đoán bệnh hay tư vấn thuốc thay cho bác sĩ. Bạn nên đặt lịch khám trực tiếp để được thăm khám chính xác. Mình có thể giúp bạn chọn chuyên khoa và đặt lịch ngay nhé.",
      chips: ["Đặt lịch khám mới", "Tra cứu bác sĩ"],
    };
  }

  const needLogin = /(đổi|dời|hủy|phiếu khám|đặt lịch)/.test(t) && !loggedIn;
  if (needLogin) {
    return {
      text:
        "Để thao tác với lịch hẹn của bạn, vui lòng đăng nhập tài khoản bệnh nhân trước. Bạn vẫn có thể hỏi mình thông tin về bác sĩ và chuyên khoa.",
      chips: ["Tra cứu bác sĩ"],
    };
  }

  if (/(xác nhận đổi|đổi sang thứ sáu)/.test(t)) {
    // TODO: gọi API đổi lịch (UC06). Chính sách: còn ≥ 2 giờ, tối đa 2 lần đổi/lịch.
    return {
      text:
        "Đã ghi nhận yêu cầu đổi lịch sang Thứ Sáu (25/10) lúc 09:30. Bạn sẽ nhận thông báo xác nhận ngay khi hệ thống cập nhật xong.",
    };
  }

  if (/(đổi|dời|phiếu khám)/.test(t)) {
    return {
      text: "Dạ được ạ! Dưới đây là thông tin phiếu khám đã đăng ký của bạn. Bạn được phép dời lịch miễn phí trước 2 giờ.",
      appointment: true,
    };
  }

  if (/(hủy|hoàn phí)/.test(t)) {
    return {
      text:
        "Bạn có thể hủy lịch trước giờ khám tối thiểu 2 giờ. Hủy muộn hơn sẽ không được hoàn phí. Bạn muốn hủy lịch nào? Mình sẽ tóm tắt lại để bạn xác nhận trước khi thực hiện.",
      chips: ["Hủy lịch gần nhất", "Giữ nguyên lịch"],
    };
  }

  if (/(bác sĩ|chuyên khoa|tra cứu)/.test(t)) {
    return {
      text:
        "Bạn muốn tìm bác sĩ theo chuyên khoa hay theo tên? Bạn có thể cho mình biết chuyên khoa (ví dụ Tim mạch, Da liễu, Nhi) hoặc mô tả nhu cầu khám.",
      chips: ["Tim mạch", "Da liễu", "Nhi khoa", "Nội tiêu hóa"],
    };
  }

  if (/(đặt lịch|đặt khám|lịch trống)/.test(t)) {
    return {
      text:
        "Bạn muốn khám chuyên khoa nào và vào ngày nào? Cho mình thông tin, mình sẽ tra các khung giờ còn trống và tóm tắt lại để bạn xác nhận.",
      chips: ["Tim mạch ngày mai", "Da liễu chiều mai"],
    };
  }

  // Làm rõ ý định
  return {
    text:
      "Mình chưa hiểu rõ yêu cầu của bạn. Bạn muốn thực hiện thao tác nào dưới đây?",
    chips: ["Tra cứu bác sĩ", "Đặt lịch khám mới", "Đổi lịch khám", "Hủy lịch"],
  };
}

/* ---------- Thành phần nhỏ ---------- */

function BotAvatar() {
  return (
    <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#2B6CB0] text-white">
      <Bot className="h-4 w-4" />
    </span>
  );
}

function AppointmentCard({ onAction }: { onAction: (t: string) => void }) {
  return (
    <div className="mt-2 rounded-xl border border-blue-100 bg-blue-50/70 p-3">
      <div className="flex items-center justify-between text-[10px] font-bold">
        <span className="flex items-center gap-1 text-[#0A5A84]">
          <span className="h-1.5 w-1.5 rounded-full bg-[#2B6CB0]" />
          MÃ KHÁM: MDC-2025-9921
        </span>
        <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-emerald-600">
          Đã xác nhận
        </span>
      </div>

      <div className="mt-3 flex items-center gap-3">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#2B6CB0] text-[11px] font-bold text-white">
          LH
        </span>
        <span className="leading-tight">
          <span className="block text-sm font-extrabold text-slate-900">
            TS.BS Lê Quang Huy
          </span>
          <span className="mt-0.5 flex items-center gap-1 text-[11px] text-slate-500">
            <MapPin className="h-3 w-3" />
            Khoa Nội Tiêu Hóa • Phòng khám 402, Tầng 4
          </span>
        </span>
      </div>

      <div className="mt-3 flex items-center justify-between border-t border-blue-100 pt-2.5 text-[11px]">
        <span className="flex items-center gap-1 font-bold text-slate-700">
          <Clock className="h-3 w-3 text-[#2B6CB0]" />
          09:30 - Thứ Năm, 24/10
        </span>
        <span className="text-slate-500">
          Viện phí: <b className="text-slate-800">450.000 đ</b>{" "}
          <span className="text-emerald-600">(Đã trả)</span>
        </span>
      </div>

      <div className="mt-3 flex gap-2">
        <button
          type="button"
          onClick={() => onAction("Xác nhận đổi sang thứ Sáu (25/10)")}
          className="flex-1 rounded-lg bg-[#0A5A84] px-3 py-2 text-[11px] font-bold text-white transition hover:bg-[#08486B]"
        >
          Đổi sang thứ Sáu (25/10)
        </button>
        <button
          type="button"
          onClick={() => onAction("Chọn giờ khác")}
          className="rounded-lg bg-slate-200 px-3 py-2 text-[11px] font-bold text-slate-700 transition hover:bg-slate-300"
        >
          Chọn giờ khác
        </button>
      </div>
    </div>
  );
}

/* ---------- Widget ---------- */

export default function AiChatWidget({ onClose }: { onClose: () => void }) {
  const { user } = useAuth();
  const loggedIn = !!user;

  const greeting = (): Msg => ({
    id: nextId(),
    role: "bot",
    time: fmtTime(),
    text: user
      ? `Xin chào ${user.fullName} (${user.pid})! Tôi là MediCare AI. Tôi có thể hỗ trợ bác sĩ chuyên khoa, đặt/đổi hẹn khám, hoặc trả lời thắc mắc viện phí ngay bây giờ.`
      : "Xin chào! Tôi là MediCare AI. Tôi có thể giúp bạn tra cứu bác sĩ, chuyên khoa và lịch trống. Đăng nhập để đặt, đổi hoặc hủy lịch khám.",
  });

  const [messages, setMessages] = useState<Msg[]>(() => [greeting()]);
  const [input, setInput] = useState("");
  const [typing, setTyping] = useState(false);
  const [minimized, setMinimized] = useState(false);
  const [activeTab, setActiveTab] = useState<string | null>(null);
  const endRef = useRef<HTMLDivElement>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [messages, typing, minimized]);

  useEffect(() => () => {
    if (timer.current) clearTimeout(timer.current);
  }, []);

  const send = (raw: string) => {
    const text = raw.trim();
    if (!text || typing) return;

    setMessages((m) => [...m, { id: nextId(), role: "user", time: fmtTime(), text }]);
    setInput("");
    setTyping(true);

    timer.current = setTimeout(() => {
      const r = botReply(text, loggedIn);
      setMessages((m) => [...m, { id: nextId(), role: "bot", time: fmtTime(), ...r }]);
      setTyping(false);
    }, 700);
  };

  const reset = () => {
  if (timer.current) clearTimeout(timer.current);
  setTyping(false);
  setActiveTab(null);
  setMessages([greeting()]);
};
  return (
    <section
      role="dialog"
      aria-label="Trợ lý AI MediCare"
      className="fixed bottom-4 right-4 z-50 flex w-[calc(100vw-2rem)] max-w-[400px] flex-col overflow-hidden rounded-2xl bg-white shadow-[0_20px_60px_rgba(10,60,100,0.3)] ring-1 ring-slate-200"
    >
      {/* Header */}
      <header className="flex items-center gap-3 bg-gradient-to-r from-[#0A5A84] to-[#2B6CB0] px-4 py-3 text-white">
        <span className="relative">
          <span className="flex h-10 w-10 items-center justify-center rounded-full bg-white/20">
            <Bot className="h-5 w-5" />
          </span>
          <span className="absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full bg-emerald-400 ring-2 ring-[#0A5A84]" />
        </span>
        <div className="min-w-0 flex-1 leading-tight">
          <h2 className="flex items-center gap-1.5 text-sm font-extrabold">
            MediCare AI
            <BadgeCheck className="h-3.5 w-3.5 text-white/80" />
          </h2>
          <p className="mt-0.5 flex items-center gap-1.5 text-[10px] text-white/80">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
            Trợ lý Y tế Thông minh 24/7
          </p>
        </div>
        <div className="flex items-center gap-1">
          <button
            type="button"
            aria-label={minimized ? "Mở rộng" : "Thu nhỏ"}
            onClick={() => setMinimized((v) => !v)}
            className="rounded-md p-1.5 transition hover:bg-white/15"
          >
            <Minus className="h-4 w-4" />
          </button>
          <button
            type="button"
            aria-label="Làm mới cuộc trò chuyện"
            onClick={reset}
            className="rounded-md p-1.5 transition hover:bg-white/15"
          >
            <RefreshCw className="h-4 w-4" />
          </button>
          <button
            type="button"
            aria-label="Đóng"
            onClick={onClose}
            className="rounded-md p-1.5 transition hover:bg-white/15"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </header>

      {!minimized && (
        <>
          {/* Tab thao tác nhanh */}
          <div className="grid grid-cols-4 gap-2 border-b border-slate-100 bg-white p-3">
            {QUICK_TABS.map(({ label, icon: Ico, prompt }) => {
                const active = activeTab === label;
                return (
                    <button
                    key={label}
                    type="button"
                    aria-pressed={active}
                    onClick={() => {
                        setActiveTab(label);
                        send(prompt);
                    }}
                    className={`flex flex-col items-center gap-1 rounded-lg px-1 py-2 text-[10px] font-bold transition ${
                        active
                        ? "bg-blue-100 text-[#0A5A84] ring-1 ring-[#2B6CB0]/30"
                        : "bg-slate-50 text-slate-700 hover:bg-blue-50 hover:text-[#0A5A84]"
                    }`}
                    >
                    <Ico className="h-4 w-4" />
                    {label}
                    </button>
                );
                })}
          </div>

          {/* Hội thoại */}
          <div className="h-[340px] space-y-4 overflow-y-auto bg-[#F6FAFE] px-4 py-4">
            {messages.map((m) =>
              m.role === "bot" ? (
                <div key={m.id} className="flex items-start gap-2.5">
                  <BotAvatar />
                  <div className="min-w-0 max-w-[85%]">
                    <div className="rounded-2xl rounded-tl-sm bg-white px-3.5 py-2.5 text-[13px] leading-relaxed text-slate-700 shadow-sm">
                      {m.text}
                      {m.appointment && <AppointmentCard onAction={send} />}
                    </div>
                    {m.chips && (
                      <div className="mt-2 flex flex-wrap gap-1.5">
                        {m.chips.map((c) => (
                          <button
                            key={c}
                            type="button"
                            onClick={() => send(c)}
                            className="rounded-full border border-[#2B6CB0]/40 bg-white px-3 py-1 text-[11px] font-bold text-[#0A5A84] transition hover:bg-blue-50"
                          >
                            {c}
                          </button>
                        ))}
                      </div>
                    )}
                    <p className="mt-1 text-[10px] text-slate-400">
                      {m.time} • MediCare Bot
                    </p>
                  </div>
                </div>
              ) : (
                <div key={m.id} className="flex flex-col items-end">
                  <div className="flex items-end gap-2">
                    <div className="max-w-[260px] rounded-2xl rounded-br-sm bg-[#0A5A84] px-3.5 py-2.5 text-[13px] leading-relaxed text-white">
                      {m.text}
                    </div>
                    <span className="relative h-7 w-7 shrink-0 overflow-hidden rounded-full bg-[#2B6CB0]">
                      {user ? (
                        <span className="flex h-full w-full items-center justify-center text-[10px] font-bold text-white">
                          {user.fullName
                            .split(" ")
                            .slice(-1)[0]?.[0]
                            ?.toUpperCase()}
                        </span>
                      ) : (
                        <Image
                          src="/images/home/bs-tran-nhat-nam.png"
                          alt=""
                          fill
                          sizes="28px"
                          className="hidden"
                        />
                      )}
                    </span>
                  </div>
                  <p className="mt-1 pr-9 text-[10px] text-slate-400">{m.time} • Bạn</p>
                </div>
              ),
            )}

            {typing && (
              <div className="flex items-start gap-2.5">
                <BotAvatar />
                <div className="flex items-center gap-1 rounded-2xl rounded-tl-sm bg-white px-4 py-3 shadow-sm">
                  {[0, 150, 300].map((d) => (
                    <span
                      key={d}
                      className="h-1.5 w-1.5 animate-bounce rounded-full bg-slate-400"
                      style={{ animationDelay: `${d}ms` }}
                    />
                  ))}
                </div>
              </div>
            )}
            <div ref={endRef} />
          </div>

          {/* Ô nhập */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              send(input);
            }}
            className="flex items-center gap-1.5 border-t border-slate-100 bg-white px-3 py-3"
          >
            {/* TODO: đính kèm ảnh/đơn thuốc và nhập giọng nói khi backend hỗ trợ */}
            <button
              type="button"
              aria-label="Đính kèm tệp"
              className="rounded-md p-2 text-slate-400 transition hover:text-[#0A5A84]"
            >
              <Paperclip className="h-4 w-4" />
            </button>
            <button
              type="button"
              aria-label="Nhập bằng giọng nói"
              className="rounded-md p-2 text-slate-400 transition hover:text-[#0A5A84]"
            >
              <Mic className="h-4 w-4" />
            </button>
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Hỏi MediCare AI hoặc yêu cầu hỗ trợ lịch khám..."
              className="min-w-0 flex-1 rounded-full bg-slate-50 px-4 py-2.5 text-xs text-slate-800 outline-none ring-1 ring-slate-200 transition placeholder:text-slate-400 focus:bg-white focus:ring-[#2B6CB0]"
            />
            <button
              type="submit"
              aria-label="Gửi"
              disabled={!input.trim() || typing}
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#0A5A84] text-white transition hover:bg-[#08486B] disabled:cursor-not-allowed disabled:bg-slate-300"
            >
              <Send className="h-4 w-4" />
            </button>
          </form>

          <footer className="flex items-center justify-between border-t border-slate-100 bg-white px-4 py-2 text-[10px] text-slate-400">
            <span className="flex items-center gap-1.5">
              <BadgeCheck className="h-3 w-3 text-[#2B6CB0]" />
              Bảo mật EMR y tế chuẩn HIPAA &amp; SSL 256-bit
            </span>
            <span>v3.4-Clinical</span>
          </footer>
        </>
      )}
    </section>
  );
}