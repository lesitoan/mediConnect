import type { CashPaymentInput } from "../types/invoiceTypes";

const CHANGE_EVENT = "mediconnect-cash-payment-change";
export const STORAGE_UNAVAILABLE = "STORAGE_UNAVAILABLE";

export interface PendingCashPayment {
  version: 1;
  accountId: string;
  invoiceId: string;
  idempotencyKey: string;
  payment: CashPaymentInput;
}

function storageKey(accountId: string, invoiceId: string) {
  return `mediconnect:cash-payment:${accountId}:${invoiceId}`;
}

export function cashPaymentSnapshot(
  accountId: string,
  invoiceId: string,
): string | null {
  try {
    return window.localStorage.getItem(storageKey(accountId, invoiceId));
  } catch {
    return STORAGE_UNAVAILABLE;
  }
}

export function parseCashPayment(
  snapshot: string | null,
  accountId: string,
  invoiceId: string,
): PendingCashPayment | null {
  if (snapshot === null) return null;
  try {
    const value = JSON.parse(snapshot) as Partial<PendingCashPayment>;
    if (
      value?.version !== 1 ||
      value.accountId !== accountId ||
      value.invoiceId !== invoiceId ||
      typeof value.idempotencyKey !== "string" ||
      !/^[a-f\d]{8}-[a-f\d]{4}-4[a-f\d]{3}-[89ab][a-f\d]{3}-[a-f\d]{12}$/i.test(
        value.idempotencyKey,
      ) ||
      value.payment?.method !== "CASH" ||
      typeof value.payment.amount !== "string" ||
      !/^[1-9]\d{0,11}$/.test(value.payment.amount) ||
      (value.payment.note !== undefined &&
        (typeof value.payment.note !== "string" ||
          value.payment.note.length > 500))
    )
      throw new Error();
    return value as PendingCashPayment;
  } catch {
    throw new Error(
      "Không đọc được thông tin khoản thu đang chờ. Vui lòng liên hệ quản trị viên trước khi ghi nhận khoản thu mới.",
    );
  }
}

export function saveCashPayment(value: PendingCashPayment) {
  try {
    window.localStorage.setItem(
      storageKey(value.accountId, value.invoiceId),
      JSON.stringify(value),
    );
    window.dispatchEvent(new Event(CHANGE_EVENT));
  } catch {
    throw new Error(
      "Không lưu được thông tin khoản thu trên trình duyệt. Vui lòng cho phép lưu trữ trước khi tiếp tục.",
    );
  }
}

export function clearCashPayment(accountId: string, invoiceId: string) {
  try {
    window.localStorage.removeItem(storageKey(accountId, invoiceId));
    window.dispatchEvent(new Event(CHANGE_EVENT));
  } catch {
    // Keep the same key available for a safe retry if storage cannot be cleared.
  }
}

export function subscribeCashPayments(listener: () => void) {
  window.addEventListener("storage", listener);
  window.addEventListener(CHANGE_EVENT, listener);
  return () => {
    window.removeEventListener("storage", listener);
    window.removeEventListener(CHANGE_EVENT, listener);
  };
}
