"use client";

import { useEffect, useMemo, useState, useSyncExternalStore } from "react";
import { getCurrentUser } from "./services/authService";
import {
  AUTH_SESSION_EVENT,
  AUTH_SESSION_KEY,
  clearStoredSession,
  saveStoredSession,
} from "./sessionStore";

export type SessionUser = {
  fullName: string;
  pid?: string;
};

const LOADING = "__loading__";
let hydrationPromise: Promise<void> | null = null;

export function saveSession(user: SessionUser) {
  saveStoredSession(user);
}

export function clearSession() {
  clearStoredSession();
}

function subscribe(cb: () => void) {
  window.addEventListener(AUTH_SESSION_EVENT, cb);
  window.addEventListener("storage", cb);
  return () => {
    window.removeEventListener(AUTH_SESSION_EVENT, cb);
    window.removeEventListener("storage", cb);
  };
}

export function useAuth() {
  const [isHydrated, setIsHydrated] = useState(false);
  const raw = useSyncExternalStore(
    subscribe,
    () => localStorage.getItem(AUTH_SESSION_KEY),
    () => LOADING,
  );

  useEffect(() => {
    if (!hydrationPromise) {
      hydrationPromise = getCurrentUser()
        .then((user) => saveSession({ fullName: user.name }))
        .catch(() => clearSession());
    }

    void hydrationPromise.finally(() => setIsHydrated(true));
  }, []);

  const ready = raw !== LOADING && isHydrated;
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
