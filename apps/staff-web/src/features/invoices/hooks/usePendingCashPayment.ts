"use client";

import { useSyncExternalStore } from "react";
import {
  cashPaymentSnapshot,
  parseCashPayment,
  STORAGE_UNAVAILABLE,
  subscribeCashPayments,
} from "../services/cashPaymentStorage";

export function usePendingCashPayment(accountId: string, invoiceId: string) {
  const snapshot = useSyncExternalStore(
    subscribeCashPayments,
    () => cashPaymentSnapshot(accountId, invoiceId),
    () => null,
  );
  if (snapshot === STORAGE_UNAVAILABLE)
    return {
      pending: null,
      hasStoredPayment: false,
      storageError:
        "Trình duyệt đang chặn lưu trữ khoản thu. Vui lòng cho phép lưu trữ để tiếp tục.",
    };
  try {
    return {
      pending: parseCashPayment(snapshot, accountId, invoiceId),
      hasStoredPayment: snapshot !== null,
      storageError: null,
    };
  } catch (error) {
    return {
      pending: null,
      hasStoredPayment: true,
      storageError:
        error instanceof Error
          ? error.message
          : "Không đọc được thông tin khoản thu.",
    };
  }
}
