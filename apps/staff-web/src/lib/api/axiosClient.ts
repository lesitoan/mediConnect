import axios, { type InternalAxiosRequestConfig } from "axios";

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, "") ||
  "http://localhost:4000/api/v1";

export const axiosClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: Number(process.env.NEXT_PUBLIC_API_TIMEOUT) || 10000,
  withCredentials: true,
});

type SessionRequestConfig = InternalAxiosRequestConfig & {
  sessionVersion?: number;
  hasRetriedSession?: boolean;
};

let sessionVersion = 0;
let refreshRequest: Promise<void> | null = null;

axiosClient.interceptors.request.use((config: SessionRequestConfig) => {
  config.sessionVersion = sessionVersion;
  return config;
});

axiosClient.interceptors.response.use(
  (response) => response,
  async (error: unknown) => {
    if (!axios.isAxiosError(error)) throw error;
    const config = error.config as SessionRequestConfig | undefined;
    if (
      error.response?.status !== 401 || !config || config.hasRetriedSession ||
      config.signal?.aborted || config.headers.has("Authorization") ||
      /^\/authentication\/(login|refresh|register|send_otp|forgot_password|verify|reset_password)$/.test(config.url ?? "")
    ) throw error;

    config.hasRetriedSession = true;
    // A late 401 from an older request can reuse cookies that were already refreshed.
    if (config.sessionVersion === sessionVersion) {
      if (!refreshRequest) {
        const refresh = async () => { await axiosClient.post("/authentication/refresh", {}); };
        const task = typeof navigator !== "undefined" && navigator.locks
          ? navigator.locks.request("mediconnect-session-refresh", refresh)
          : refresh();
        refreshRequest = task.then(() => { sessionVersion++; }).finally(() => { refreshRequest = null; });
      }
      await refreshRequest;
    }
    return axiosClient.request(config);
  },
);
