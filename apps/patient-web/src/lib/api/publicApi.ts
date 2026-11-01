const API_URL =
  process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, "") ||
  "http://localhost:4000/api/v1";
const PAGE_LIMIT = 100;

type ApiPage<T> = {
  success: boolean;
  data: T[];
  pagination: { totalPages: number };
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function getApiErrorMessage(payload: unknown, status: number): string {
  if (isRecord(payload) && typeof payload.message === "string") {
    return payload.message;
  }
  if (
    isRecord(payload) &&
    Array.isArray(payload.message) &&
    payload.message.every((item) => typeof item === "string")
  ) {
    return payload.message.join(", ");
  }
  return `API request failed with status ${status}.`;
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
      limit: String(PAGE_LIMIT),
    });

    let response: Response;
    try {
      response = await fetch(`${API_URL}${path}?${query}`, {
        credentials: "include",
        signal,
      });
    } catch (error) {
      if (signal?.aborted) throw error;
      throw new Error(
        `Không thể kết nối API tại ${API_URL}. Hãy khởi động backend và kiểm tra cấu hình.`,
      );
    }

    const payload: unknown = await response.json();
    if (!response.ok) {
      throw new Error(getApiErrorMessage(payload, response.status));
    }

    if (
      !isRecord(payload) ||
      payload.success !== true ||
      !Array.isArray(payload.data) ||
      !isRecord(payload.pagination) ||
      typeof payload.pagination.totalPages !== "number" ||
      !Number.isInteger(payload.pagination.totalPages) ||
      payload.pagination.totalPages < 0
    ) {
      throw new Error("API trả về dữ liệu danh sách không hợp lệ.");
    }

    const apiPage = payload as ApiPage<T>;
    items.push(...apiPage.data);
    totalPages = Math.max(page, apiPage.pagination.totalPages);
  }

  return items;
}
