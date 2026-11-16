import axios from "axios";
import { axiosClient } from "./axiosClient";

export async function downloadFile(
  path: string,
  data: unknown,
  filename: string,
): Promise<void> {
  let file: Blob;
  try {
    const response = await axiosClient.post<Blob>(path, data, {
      responseType: "blob",
    });
    file = response.data;
  } catch (error) {
    if (
      axios.isAxiosError<Blob>(error) &&
      error.response?.data instanceof Blob
    ) {
      const payload = await error.response.data
        .text()
        .then<unknown>(JSON.parse)
        .catch(() => null);
      if (payload && typeof payload === "object" && "message" in payload) {
        if (typeof payload.message === "string")
          throw new Error(payload.message);
        if (
          Array.isArray(payload.message) &&
          payload.message.every((value) => typeof value === "string")
        )
          throw new Error(payload.message.join(", "));
      }
    }
    throw error;
  }
  const url = URL.createObjectURL(file);
  try {
    const link = document.createElement("a");
    link.href = url;
    link.download = filename;
    link.click();
  } finally {
    window.setTimeout(() => URL.revokeObjectURL(url), 1000);
  }
}
