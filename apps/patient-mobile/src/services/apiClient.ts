import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

type ApiEnvelope<T> = {
  success: boolean;
  data: T;
  message?: string | string[];
};

export type PatientSession = {
  accessToken: string;
  refreshToken: string;
};

export class ApiRequestError extends Error {
  constructor(
    message: string,
    readonly status: number,
  ) {
    super(message);
  }
}

const SESSION_KEY = 'mediconnect.patient.session';
const DEFAULT_HOST = Platform.OS === 'android' ? '10.0.2.2' : 'localhost';
const API_BASE_URL = (
  process.env.EXPO_PUBLIC_API_URL ??
  `http://${DEFAULT_HOST}:4000/api/v1`
).replace(/\/+$/, '');

let refreshRequest: Promise<PatientSession> | null = null;

function getErrorMessage(payload: unknown, status: number): string {
  if (typeof payload !== 'object' || payload === null) {
    return `Yêu cầu API thất bại (${status}).`;
  }
  const message = (payload as { message?: unknown }).message;
  if (typeof message === 'string') return message;
  if (
    Array.isArray(message) &&
    message.every((item) => typeof item === 'string')
  ) {
    return message.join(', ');
  }
  return `Yêu cầu API thất bại (${status}).`;
}

async function parseResponse<T>(response: Response): Promise<T> {
  let payload: unknown;
  try {
    payload = await response.json();
  } catch {
    throw new Error('API trả về dữ liệu không hợp lệ.');
  }

  if (!response.ok) {
    throw new ApiRequestError(
      getErrorMessage(payload, response.status),
      response.status,
    );
  }
  if (
    typeof payload !== 'object' ||
    payload === null ||
    !('success' in payload) ||
    payload.success !== true ||
    !('data' in payload)
  ) {
    throw new Error('API không xác nhận yêu cầu thành công.');
  }
  return (payload as ApiEnvelope<T>).data;
}

async function fetchApi(
  path: string,
  init: RequestInit = {},
  accessToken?: string,
): Promise<Response> {
  const headers = new Headers(init.headers);
  if (init.body !== undefined && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json');
  }
  if (accessToken) headers.set('Authorization', `Bearer ${accessToken}`);

  try {
    return await fetch(`${API_BASE_URL}${path}`, {
      ...init,
      headers,
    });
  } catch (error) {
    if (init.signal?.aborted) throw error;
    throw new Error(
      `Không thể kết nối API tại ${API_BASE_URL}. Kiểm tra backend và cấu hình EXPO_PUBLIC_API_URL.`,
    );
  }
}

export async function savePatientSession(session: PatientSession): Promise<void> {
  await SecureStore.setItemAsync(SESSION_KEY, JSON.stringify(session));
}

export async function clearPatientSession(): Promise<void> {
  await SecureStore.deleteItemAsync(SESSION_KEY);
}

export async function getPatientSession(): Promise<PatientSession | null> {
  const value = await SecureStore.getItemAsync(SESSION_KEY);
  if (!value) return null;

  try {
    const session: unknown = JSON.parse(value);
    if (
      typeof session === 'object' &&
      session !== null &&
      'accessToken' in session &&
      typeof session.accessToken === 'string' &&
      'refreshToken' in session &&
      typeof session.refreshToken === 'string'
    ) {
      return {
        accessToken: session.accessToken,
        refreshToken: session.refreshToken,
      };
    }
    await clearPatientSession();
  } catch {
    await clearPatientSession();
  }
  return null;
}

async function refreshPatientSession(): Promise<PatientSession> {
  if (!refreshRequest) {
    refreshRequest = (async () => {
      const current = await getPatientSession();
      if (!current) throw new ApiRequestError('Phiên đăng nhập đã hết hạn.', 401);

      const response = await fetchApi('/authentication/refresh', {
        method: 'POST',
        body: JSON.stringify({ refreshToken: current.refreshToken }),
      });
      const tokens = await parseResponse<{
        accessToken: string;
        refreshToken?: string;
      }>(response);
      if (!tokens.accessToken || !tokens.refreshToken) {
        throw new Error('API không trả về đủ token để làm mới phiên.');
      }

      const next = {
        accessToken: tokens.accessToken,
        refreshToken: tokens.refreshToken,
      };
      await savePatientSession(next);
      return next;
    })().finally(() => {
      refreshRequest = null;
    });
  }
  return refreshRequest;
}

export async function requestApi<T>(
  path: string,
  init: RequestInit = {},
  isAuthenticated = false,
): Promise<T> {
  if (!isAuthenticated) {
    return parseResponse<T>(await fetchApi(path, init));
  }

  const session = await getPatientSession();
  if (!session) throw new ApiRequestError('Vui lòng đăng nhập.', 401);

  const response = await fetchApi(path, init, session.accessToken);
  if (response.status !== 401) return parseResponse<T>(response);

  try {
    const refreshed = await refreshPatientSession();
    const retry = await fetchApi(path, init, refreshed.accessToken);
    if (retry.status === 401) {
      await clearPatientSession();
    }
    return parseResponse<T>(retry);
  } catch (error) {
    if (error instanceof ApiRequestError && error.status === 401) {
      await clearPatientSession();
    }
    throw error;
  }
}

export async function getPublicApiItems<T>(
  path: string,
  signal?: AbortSignal,
): Promise<T[]> {
  const items: T[] = [];
  let totalPages = 1;

  for (let page = 1; page <= totalPages; page += 1) {
    const query = new URLSearchParams({
      page: String(page),
      limit: '100',
    });
    const separator = path.includes('?') ? '&' : '?';
    const response = await requestApi<{
      items: T[];
      pagination: { totalPages: number };
    }>(`${path}${separator}${query}`, { signal });
    if (
      !Array.isArray(response.items) ||
      !Number.isInteger(response.pagination?.totalPages) ||
      response.pagination.totalPages < 0
    ) {
      throw new Error('API trả về danh sách không hợp lệ.');
    }
    items.push(...response.items);
    totalPages = Math.max(page, response.pagination.totalPages);
  }
  return items;
}
