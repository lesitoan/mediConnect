export type StoredSessionUser = {
  fullName: string;
  pid?: string;
};

export const AUTH_SESSION_KEY = "mc_session_user";
export const AUTH_SESSION_EVENT = "mc-auth-change";

export function notifyAuthChange() {
  if (typeof window !== "undefined") {
    window.dispatchEvent(new Event(AUTH_SESSION_EVENT));
  }
}

export function saveStoredSession(user: StoredSessionUser) {
  localStorage.setItem(AUTH_SESSION_KEY, JSON.stringify(user));
  notifyAuthChange();
}

export function clearStoredSession() {
  localStorage.removeItem(AUTH_SESSION_KEY);
  notifyAuthChange();
}
