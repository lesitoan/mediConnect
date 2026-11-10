type ApiResponse<T> = {
  success: boolean;
  data: T;
};

export type ReviewDetails = {
  id: string;
  consultationId: string;
  doctorRating: number;
  serviceRating: number;
  criteriaRatings: {
    doctor: number;
    waiting: number;
    facility: number;
    guidance: number;
  } | null;
  comment: string | null;
  createdAt: string;
  editCount: number;
  canEdit: boolean;
};

export type ReviewInput = {
  doctorRating: number;
  serviceRating: number;
  criteriaRatings: {
    doctor: number;
    waiting: number;
    facility: number;
    guidance: number;
  };
  comment?: string;
};

const API_URL =
  process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, "") ||
  "http://localhost:4000/api/v1";

export class ReviewApiError extends Error {
  constructor(
    message: string,
    readonly status: number,
  ) {
    super(message);
  }
}

export async function createReview(
  consultationId: string,
  input: ReviewInput,
) {
  const response = await fetch(
    `${API_URL}/me/consultations/${consultationId}/review`,
    {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(input),
    },
  );
  const payload = (await response.json()) as ApiResponse<unknown> & {
    message?: string | string[];
  };
  if (!response.ok) {
    const message = Array.isArray(payload.message)
      ? payload.message.join(", ")
      : payload.message || "Không thể gửi đánh giá.";
    throw new ReviewApiError(message, response.status);
  }
  return payload.data;
}

export async function getReview(consultationId: string) {
  const response = await fetch(
    `${API_URL}/me/consultations/${consultationId}/review`,
    { credentials: "include" },
  );
  const payload = (await response.json()) as ApiResponse<ReviewDetails | null> & {
    message?: string | string[];
  };
  if (!response.ok) {
    const message = Array.isArray(payload.message)
      ? payload.message.join(", ")
      : payload.message || "Không thể tải đánh giá.";
    throw new ReviewApiError(message, response.status);
  }
  return payload.data;
}

export async function updateReview(
  consultationId: string,
  input: ReviewInput,
) {
  const response = await fetch(
    `${API_URL}/me/consultations/${consultationId}/review`,
    {
      method: "PATCH",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(input),
    },
  );
  const payload = (await response.json()) as ApiResponse<ReviewDetails> & {
    message?: string | string[];
  };
  if (!response.ok) {
    const message = Array.isArray(payload.message)
      ? payload.message.join(", ")
      : payload.message || "Không thể cập nhật đánh giá.";
    throw new ReviewApiError(message, response.status);
  }
  return payload.data;
}
