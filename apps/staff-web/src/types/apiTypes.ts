export interface ApiResponse<T> {
  success: boolean;
  data: T;
}

export interface ApiError {
  status: number | "FETCH_ERROR" | "TIMEOUT_ERROR" | "CANCELED";
  message: string;
  data: unknown;
}
