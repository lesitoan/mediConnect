import axios from "axios";
import type { ChatResponse } from "../types/chatTypes";

type ChatApiResponse = {
  success?: boolean;
  data?: ChatResponse;
  message?: string | string[];
};

export async function sendChat(
  message: string,
  reset: boolean,
  signal: AbortSignal,
): Promise<ChatResponse> {
  const base = (
    process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000/api/v1"
  ).replace(/\/$/, "");
  const apiUrl = base.endsWith("/api/v1") ? base : `${base}/api/v1`;
  try {
    const response = await axios.post<ChatApiResponse>(
      `${apiUrl}/ai-assistant/chat`,
      { message, reset },
      {
        withCredentials: true,
        headers: { "Content-Type": "application/json" },
        signal,
      },
    );
    const body = response.data;
    if (
      !body.success ||
      !body.data ||
      typeof body.data.answer !== "string"
    ) {
      const message = Array.isArray(body.message)
        ? body.message.join(" ")
        : body.message;
      throw new Error(
        message || "Không thể kết nối trợ lý AI. Vui lòng thử lại sau.",
      );
    }
    return body.data;
  } catch (error) {
    if (signal.aborted && signal.reason instanceof Error) {
      throw signal.reason;
    }
    if (error instanceof Error && !axios.isAxiosError(error)) {
      throw error;
    }

    const body = axios.isAxiosError<ChatApiResponse>(error)
      ? error.response?.data
      : undefined;
    const message = Array.isArray(body?.message)
      ? body.message.join(" ")
      : body?.message;
    throw new Error(
      message || "Không thể kết nối trợ lý AI. Vui lòng thử lại sau.",
    );
  }
}
