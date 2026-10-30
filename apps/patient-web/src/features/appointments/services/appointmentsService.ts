import type { Appointment } from "../data";

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
    };
  };
};

type AppointmentAvailabilityResponse = {
  items: Array<{
    id: string;
    startsAt: string;
    endsAt: string;
    doctor: {
      id: string;
      fullName: string;
      specialty: {
        id: string;
        name: string;
        roomCode: string;
      };
    };
  }>;
};

type PatientAppointmentResponse = {
  id: string;
  appointmentCode: string;
  status: "CONFIRMED" | "PENDING_RESOLUTION" | "CANCELLED";
  rescheduleCount: number;
  createdAt: string;
  patient: { phone: string | null };
  careSessions: Array<{
    status: string;
    queueNumber: number | null;
    specialty: { name: string };
    appointmentSlot: {
      id: string;
      startsAt: string;
      endsAt: string;
      doctorSchedule: {
        doctor: {
          id: string;
          qualification: string | null;
          user: { fullName: string };
          specialty: { name: string; roomCode: string };
        };
      };
    };
  }>;
  invoices: Array<{ totalAmount: string; status: "OPEN" | "VOID" }>;
};

type ApiResponse<T> = {
  success: boolean;
  data: T;
};

export class ApiRequestError extends Error {
  constructor(
    message: string,
    readonly status: number,
  ) {
    super(message);
  }
}

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
    throw new ApiRequestError(message, response.status);
  }
  return payload.data;
}

export function getAppointmentAvailability(date: string, doctorId?: string) {
  const query = new URLSearchParams({
    dateFrom: date,
    dateTo: date,
    limit: "50",
  });
  if (doctorId) query.set("doctorId", doctorId);

  return request<AppointmentAvailabilityResponse>(
    `/schedules/ai-availability?${query}`,
  ).then(({ items }) =>
    items.map(({ doctor, ...slot }) => ({
      ...slot,
      doctor: {
        id: doctor.id,
        name: doctor.fullName,
        specialty: {
          id: doctor.specialty.id,
          name: doctor.specialty.name,
        },
      },
    })),
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

function getDaysFromNow(date: Date, now: Date): number {
  const appointmentDay = new Date(
    date.getFullYear(),
    date.getMonth(),
    date.getDate(),
  );
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  return Math.round(
    (appointmentDay.getTime() - today.getTime()) / 86_400_000,
  );
}

function getInitials(name: string): string {
  return name
    .trim()
    .split(/\s+/)
    .slice(-2)
    .map((part) => part[0] ?? "")
    .join("")
    .toUpperCase();
}

function formatPhone(phone: string | null): string {
  if (!phone) return "Chưa cập nhật";
  if (phone.length < 7) return phone;
  return `${phone.slice(0, 3)} *** ${phone.slice(-3)}`;
}

function mapPatientAppointment(
  appointment: PatientAppointmentResponse,
  now: Date,
): Appointment {
  const session = appointment.careSessions[0];
  const slot = session?.appointmentSlot;
  const doctor = slot?.doctorSchedule.doctor;
  const startsAt = slot?.startsAt;
  const startsAtDate = startsAt ? new Date(startsAt) : now;
  const isCompleted = appointment.careSessions.some(
    ({ status }) => status === "COMPLETED",
  );
  const isNoShow = appointment.careSessions.some(
    ({ status }) => status === "NO_SHOW",
  );
  const isIncomplete = appointment.careSessions.some(
    ({ status }) => status === "INCOMPLETE",
  );
  const kind =
    appointment.status === "CANCELLED"
      ? "cancelled"
      : isCompleted
        ? "completed"
        : isNoShow
          ? "no-show"
          : isIncomplete
            ? "incomplete"
        : appointment.status === "PENDING_RESOLUTION"
          ? "pending"
          : "confirmed";
  const invoice = appointment.invoices[0];
  const amount = invoice ? Number(invoice.totalAmount) : Number.NaN;

  return {
    id: appointment.id,
    appointmentSlotId: slot?.id,
    doctorId: doctor?.id,
    startsAt,
    code: appointment.appointmentCode,
    kind,
    daysFromNow: getDaysFromNow(startsAtDate, now),
    time: `${String(startsAtDate.getHours()).padStart(2, "0")}:${String(startsAtDate.getMinutes()).padStart(2, "0")}`,
    bookedAt: new Intl.DateTimeFormat("vi-VN").format(
      new Date(appointment.createdAt),
    ),
    doctor: {
      name: doctor?.user.fullName ?? "Chưa phân công bác sĩ",
      title: doctor?.qualification ?? "Bác sĩ",
      initials: doctor ? getInitials(doctor.user.fullName) : "",
      specialty:
        session?.specialty.name ?? doctor?.specialty.name ?? "Chưa cập nhật",
    },
    room: doctor?.specialty.roomCode
      ? `Phòng ${doctor.specialty.roomCode}`
      : "Chưa cập nhật",
    feeLabel: "Chi phí khám:",
    fee:
      Number.isFinite(amount) && amount >= 0
        ? new Intl.NumberFormat("vi-VN").format(amount)
        : "Chưa có",
    feeNote: invoice
      ? invoice.status === "OPEN"
        ? "Hóa đơn đang mở"
        : "Hóa đơn đã hủy"
      : "Chưa có thông tin hóa đơn",
    queue: session?.queueNumber ? `STT #${session.queueNumber}` : undefined,
    phone: formatPhone(appointment.patient.phone),
    rescheduleCount: appointment.rescheduleCount,
  };
}

export async function getMyAppointments(): Promise<Appointment[]> {
  const appointments = await request<PatientAppointmentResponse[]>(
    "/me/appointments",
  );
  const now = new Date();
  return appointments.map((appointment) =>
    mapPatientAppointment(appointment, now),
  );
}

export function cancelAppointment(appointmentId: string) {
  return request(`/me/appointments/${appointmentId}/cancel`, {
    method: "POST",
    body: JSON.stringify({ reason: "Bệnh nhân yêu cầu hủy lịch" }),
  });
}

export function rescheduleAppointment(
  appointmentId: string,
  newAppointmentSlotId: string,
) {
  return request(`/me/appointments/${appointmentId}/reschedule`, {
    method: "POST",
    body: JSON.stringify({ newAppointmentSlotId }),
  });
}
