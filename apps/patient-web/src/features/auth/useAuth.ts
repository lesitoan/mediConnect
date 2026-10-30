"use client";

import { useMemo, useSyncExternalStore } from "react";

export type SessionUser = {
  fullName: string;
  pid?: string;
};

const KEY = "mc_session_user";
const EVENT = "mc-auth-change";
const LOADING = "__loading__";

export function saveSession(user: SessionUser) {
  localStorage.setItem(KEY, JSON.stringify(user));
  window.dispatchEvent(new Event(EVENT));
}

export function clearSession() {
  localStorage.removeItem(KEY);
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

export function useAuth() {
  const raw = useSyncExternalStore(
    subscribe,
    () => localStorage.getItem(KEY),
    () => LOADING, // server + lần render đầu khi hydrate
  );

  const ready = raw !== LOADING;
  const user = useMemo<SessionUser | null>(() => {
    if (!ready || !raw) return null;
    try {
      return JSON.parse(raw) as SessionUser;
    } catch {
      return null;
    }
  }, [raw, ready]);

  return { user, ready };
}