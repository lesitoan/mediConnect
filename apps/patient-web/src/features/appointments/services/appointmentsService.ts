export type AvailabilitySlot = {
  id: string;
  startsAt: string;
  endsAt: string;
  doctor: {
    id: string;
    name: string;
    specialty: {
      id: string;
      name: string;
      code: string;
    };
  };
};

type ApiResponse<T> = {
  success: boolean;
  data: T;
};

const API_URL =
  process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, "") ||
  "http://localhost:4000/api/v1";

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  let response: Response;
  try {
    response = await fetch(`${API_URL}${path}`, {
      ...init,
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
        ...init?.headers,
      },
    });
  } catch {
    throw new Error(
      `Không thể kết nối API tại ${API_URL}. Hãy khởi động backend và kiểm tra cấu hình database.`,
    );
  }
  const payload = (await response.json()) as ApiResponse<T> & {
    message?: string | string[];
  };
  if (!response.ok) {
    const message = Array.isArray(payload.message)
      ? payload.message.join(", ")
      : payload.message || "Không thể kết nối đến hệ thống";
    throw new Error(message);
  }
  return payload.data;
}

export function getAppointmentAvailability(date: string) {
  return request<AvailabilitySlot[]>(
    `/appointments/availability?date=${encodeURIComponent(date)}`,
  );
}

export function bookAppointment(input: {
  appointmentSlotId: string;
  reason?: string;
}) {
  return request(`/me/appointments`, {
    method: "POST",
    body: JSON.stringify(input),
  });
}
