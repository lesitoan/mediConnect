"use client";

import { useMemo, useSyncExternalStore } from "react";

const KEY = "mc_paid_visits";
const EVENT = "mc-paid-change";

// TODO: bỏ file này khi có backend. Trạng thái "Đã thanh toán" phải đến từ hóa đơn
// trên server (cập nhật khi SePay gửi webhook hoặc lễ tân xác nhận thu tiền tại quầy).
// Demo thử lại từ đầu: chạy localStorage.removeItem("mc_paid_visits") rồi tải lại trang.

function read(): string[] {
  try {
    return JSON.parse(localStorage.getItem(KEY) ?? "[]");
  } catch {
    return [];
  }
}

export function markPaid(code: string) {
  const cur = read();
  if (!cur.includes(code)) localStorage.setItem(KEY, JSON.stringify([...cur, code]));
  window.dispatchEvent(new Event(EVENT));
}

function subscribe(cb: () => void) {
  window.addEventListener(EVENT, cb);
  window.addEventListener("storage", cb);
  return () => {
    window.removeEventListener(EVENT, cb);
    window.removeEventListener("storage", cb);
  };
}

export function usePaidVisits() {
  const raw = useSyncExternalStore(
    subscribe,
    () => localStorage.getItem(KEY) ?? "[]",
    () => "[]",
  );
  return useMemo<string[]>(() => {
    try {
      return JSON.parse(raw);
    } catch {
      return [];
    }
  }, [raw]);
}