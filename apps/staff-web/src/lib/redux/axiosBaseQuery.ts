import type { BaseQueryFn } from "@reduxjs/toolkit/query";
import axios, { type AxiosRequestConfig } from "axios";
import { axiosClient } from "@/lib/api/axiosClient";
import type { ApiError } from "@/types/apiTypes";

type AxiosBaseQueryArgs = Pick<
  AxiosRequestConfig<unknown>,
  "method" | "data" | "params" | "headers"
> & { url: string };

function getErrorMessage(data: unknown, fallback: string): string {
  if (typeof data !== "object" || data === null || !("message" in data)) {
    return fallback;
  }

  if (typeof data.message === "string") return data.message;

  if (
    Array.isArray(data.message) &&
    data.message.every((message) => typeof message === "string")
  ) {
    return data.message.join("; ");
  }

  return fallback;
}

export const axiosBaseQuery: BaseQueryFn<
  AxiosBaseQueryArgs,
  unknown,
  ApiError
> = async (args, { signal }) => {
  try {
    const response = await axiosClient.request<unknown>({ ...args, signal });
    return { data: response.data };
  } catch (error) {
    if (axios.isAxiosError<unknown>(error)) {
      const data = error.response?.data ?? null;
      const status: ApiError["status"] = axios.isCancel(error)
        ? "CANCELED"
        : error.response?.status ??
          (error.code === "ECONNABORTED" || error.code === "ETIMEDOUT"
            ? "TIMEOUT_ERROR"
            : "FETCH_ERROR");

      return {
        error: {
          status,
          message: getErrorMessage(data, error.message),
          data,
        },
      };
    }

    return {
      error: {
        status: "FETCH_ERROR",
        message: error instanceof Error ? error.message : "Request failed",
        data: null,
      },
    };
  }
};
