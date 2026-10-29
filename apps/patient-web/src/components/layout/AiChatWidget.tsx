"use client";

import { useEffect, useRef, useState } from "react";
import { sendChat } from "@/features/ai-assistant/services/chatsService";
import type { ChatMessage } from "@/features/ai-assistant/types/chatTypes";

const GREETING: ChatMessage = {
  id: "greeting",
  role: "assistant",
  time: "",
  text: "Xin chào! Tôi có thể giúp bạn tra cứu bác sĩ, chuyên khoa và hướng dẫn đi khám. Bạn có thể tra cứu mà không cần đăng nhập.",
};
const SUGGESTIONS = [
  { label: "Bác sĩ", prompt: "Danh sách bác sĩ của phòng khám?" },
  { label: "Chuyên khoa", prompt: "Có những chuyên khoa nào?" },
  { label: "Hướng dẫn", prompt: "Đi khám cần chuẩn bị những gì?" },
];
const formatTime = () =>
  new Intl.DateTimeFormat("vi-VN", {
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "Asia/Ho_Chi_Minh",
  }).format(new Date());

export default function AiChatWidget({ onClose }: { onClose: () => void }) {
  const [messages, setMessages] = useState<ChatMessage[]>([GREETING]);
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const endRef = useRef<HTMLDivElement>(null);
  const pendingRef = useRef<AbortController | null>(null);
  const shouldResetRef = useRef(true);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [messages, isTyping, isMinimized]);
  useEffect(
    () => () => {
      pendingRef.current?.abort();
    },
    [],
  );

  async function send(raw: string) {
    const text = raw.trim();
    if (!text || pendingRef.current) return;
    const controller = new AbortController();
    pendingRef.current = controller;
    setMessages((current) => [
      ...current,
      { id: crypto.randomUUID(), role: "user", text, time: formatTime() },
    ]);
    setInput("");
    setIsTyping(true);
    const timeout = setTimeout(
      () =>
        controller.abort(
          new Error("Trợ lý phản hồi quá lâu. Vui lòng thử lại."),
        ),
      95000,
    );
    try {
      const result = await sendChat(
        text,
        shouldResetRef.current,
        controller.signal,
      );
      if (pendingRef.current !== controller) return;
      shouldResetRef.current = false;
      setMessages((current) => [
        ...current,
        {
          id: crypto.randomUUID(),
          role: "assistant",
          text: result.answer,
          sources: result.sources,
          time: formatTime(),
        },
      ]);
    } catch (error) {
      if (pendingRef.current !== controller) return;
      setMessages((current) => [
        ...current,
        {
          id: crypto.randomUUID(),
          role: "assistant",
          time: formatTime(),
          isError: true,
          text:
            error instanceof Error
              ? error.message
              : "Không thể kết nối trợ lý AI. Vui lòng thử lại.",
        },
      ]);
    } finally {
      clearTimeout(timeout);
      if (pendingRef.current === controller) {
        pendingRef.current = null;
        setIsTyping(false);
      }
    }
  }

  function reset() {
    pendingRef.current?.abort();
    pendingRef.current = null;
    shouldResetRef.current = true;
    setIsTyping(false);
    setInput("");
    setMessages([GREETING]);
  }

  return (
    <section
      role="dialog"
      aria-label="Trợ lý AI MediConnect"
      className="fixed bottom-4 right-4 z-50 flex w-[calc(100vw-2rem)] max-w-[420px] flex-col overflow-hidden rounded-2xl bg-white shadow-[0_20px_60px_rgba(10,60,100,0.3)] ring-1 ring-slate-200"
    >
      <header className="flex items-center justify-between gap-2 bg-gradient-to-r from-[#0A5A84] to-[#2B6CB0] px-4 py-3 text-white">
        <div>
          <h2 className="text-sm font-bold">Trợ lý MediConnect</h2>
          <p className="mt-1 text-xs text-white/80">
            Tra cứu bác sĩ và chuyên khoa
          </p>
        </div>
        <div className="flex gap-2 text-xs">
          <button
            type="button"
            onClick={() => setIsMinimized((value) => !value)}
            className="rounded px-1 py-2 hover:bg-white/15"
          >
            {isMinimized ? "Mở rộng" : "Thu nhỏ"}
          </button>
          <button
            type="button"
            onClick={reset}
            className="rounded px-1 py-2 hover:bg-white/15"
          >
            Làm mới
          </button>
          <button
            type="button"
            onClick={onClose}
            className="rounded px-1 py-2 hover:bg-white/15"
          >
            Đóng
          </button>
        </div>
      </header>
      {!isMinimized && (
        <>
          <div className="grid grid-cols-4 gap-2 border-b border-slate-100 p-3">
            {SUGGESTIONS.map((item) => (
              <button
                key={item.label}
                type="button"
                disabled={isTyping}
                onClick={() => void send(item.prompt)}
                className="rounded-lg bg-blue-50 px-1 py-2 text-xs font-semibold text-[#0A5A84] hover:bg-blue-100 disabled:opacity-50"
              >
                {item.label}
              </button>
            ))}
          </div>
          <div
            role="log"
            aria-label="Nội dung trò chuyện"
            aria-live="polite"
            className="max-h-[55vh] min-h-[260px] space-y-4 overflow-y-auto bg-[#F6FAFE] px-4 py-4"
          >
            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex flex-col ${message.role === "user" ? "items-end" : "items-start"}`}
              >
                <div
                  className={`max-w-[95%] whitespace-pre-line break-words rounded-2xl px-3.5 py-2.5 text-[13px] leading-relaxed ${message.role === "user" ? "bg-[#0A5A84] text-white" : message.isError ? "bg-red-50 text-red-800" : "bg-white text-slate-700 shadow-sm"}`}
                >
                  {message.text}
                </div>
                {!!message.sources?.length && (
                  <p className="mt-1 max-w-[95%] text-[10px] text-slate-500">
                    Nguồn:{" "}
                    {message.sources.map((source) => source.title).join("; ")}
                  </p>
                )}
                {message.time && (
                  <p className="mt-1 text-[10px] text-slate-400">
                    {message.time} ·{" "}
                    {message.role === "user" ? "Bạn" : "MediConnect"}
                  </p>
                )}
              </div>
            ))}
            {isTyping && (
              <p role="status" className="text-xs text-slate-500">
                Đang xử lý câu hỏi…
              </p>
            )}
            <div ref={endRef} />
          </div>
          <form
            onSubmit={(event) => {
              event.preventDefault();
              void send(input);
            }}
            className="flex gap-2 border-t border-slate-100 px-3 py-3"
          >
            <input
              aria-label="Câu hỏi cho trợ lý"
              value={input}
              onChange={(event) => setInput(event.target.value)}
              maxLength={2000}
              placeholder="Nhập câu hỏi của bạn…"
              className="min-w-0 flex-1 rounded-xl bg-slate-50 px-3 py-2.5 text-sm text-slate-800 outline-none ring-1 ring-slate-200 focus:ring-[#2B6CB0]"
            />
            <button
              type="submit"
              disabled={!input.trim() || isTyping}
              className="rounded-xl bg-[#0A5A84] px-4 py-2 text-sm font-semibold text-white hover:bg-[#08486B] disabled:opacity-50"
            >
              Gửi
            </button>
          </form>
          <footer className="border-t border-slate-100 px-4 py-2 text-[10px] text-slate-500">
            Hỗ trợ tra cứu. Đặt, đổi và hủy lịch qua chatbot sẽ có trong V2.
          </footer>
        </>
      )}
    </section>
  );
}
