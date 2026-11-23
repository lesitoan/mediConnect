import { clearStoredSession } from "../sessionStore";

const API_URL =
  process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, "") ||
  "http://localhost:4000/api/v1";

async function refreshSession() {
  const response = await fetch(`${API_URL}/authentication/refresh`, {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({}),
  });

  return response.ok;
}

export async function authenticatedFetch(
  path: string,
  init?: RequestInit,
): Promise<Response> {
  const request = () =>
    fetch(`${API_URL}${path}`, {
      ...init,
      credentials: "include",
    });

  let response = await request();
  if (response.status !== 401 || path.startsWith("/authentication/")) {
    return response;
  }

  try {
    if (!(await refreshSession())) {
      clearStoredSession();
      return response;
    }
  } catch {
    clearStoredSession();
    return response;
  }

  response = await request();
  if (response.status === 401) {
    clearStoredSession();
  }
  return response;
}
