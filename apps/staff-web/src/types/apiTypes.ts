export interface ApiResponse<T> {
  success: boolean;
  data: T;
}

export interface ApiError {
  status: number | "FETCH_ERROR" | "TIMEOUT_ERROR" | "CANCELED";
  message: string;
  data: unknown;
}

export interface CatalogQuery {
  page: number;
  limit: number;
  search?: string;
}
export interface CatalogPage<T> extends ApiResponse<T[]> {
  pagination: {
    totalItems: number;
    itemsPerPage: number;
    currentPage: number;
    totalPages: number;
  };
}
