import {
  Inject,
  Injectable,
  Logger,
  ServiceUnavailableException,
} from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { z } from "zod";

const SPECIALTY_SCHEMA = z.object({
  id: z.string().uuid(),
  name: z.string(),
  roomCode: z.string(),
});
const DOCTOR_SCHEMA = z.object({
  id: z.string().uuid(),
  fullName: z.string(),
  academicTitle: z.string().nullable(),
  qualification: z.string().nullable(),
  bio: z.string().nullable(),
  specialty: SPECIALTY_SCHEMA,
});
const SLOT_SCHEMA = z.object({
  id: z.string().uuid(),
  startsAt: z.string(),
  endsAt: z.string(),
  doctor: z.object({
    id: z.string().uuid(),
    fullName: z.string(),
    specialty: SPECIALTY_SCHEMA,
  }),
});

@Injectable()
export class MediconnectApiService {
  private readonly logger = new Logger(MediconnectApiService.name);
  constructor(@Inject(ConfigService) private readonly config: ConfigService) {}

  private async get<T>(
    path: string,
    params: Record<string, string>,
    schema: z.ZodType<T>,
  ): Promise<T> {
    const base = (
      this.config.get<string>("MEDICONNECT_API_URL") ??
      "http://127.0.0.1:4000/api/v1"
    ).replace(/\/$/, "");
    try {
      const response = await fetch(
        `${base}/${path}?${new URLSearchParams(params)}`,
        { signal: AbortSignal.timeout(10000) },
      );
      if (!response.ok) {
        this.logger.warn(
          `Lookup failed; route=${path}; status=${response.status}`,
        );
        const error = z
          .object({ errorCode: z.string() })
          .safeParse(await response.json().catch(() => null));
        if (
          error.success &&
          error.data.errorCode === "DATABASE_SCHEMA_OUTDATED"
        ) {
          throw new ServiceUnavailableException({
            message:
              "Chưa thể tra cứu vì cấu trúc database chưa đồng bộ với source. Cần cập nhật migration ở API.",
            errorCode: "LOOKUP_DATABASE_SCHEMA_OUTDATED",
          });
        }
        throw new Error("Lookup failed");
      }
      const result = z
        .object({ success: z.literal(true), data: schema })
        .parse(await response.json());
      return result.data;
    } catch (error: unknown) {
      if (error instanceof ServiceUnavailableException) throw error;
      throw new ServiceUnavailableException(
        "Không thể tra cứu dữ liệu hiện tại.",
      );
    }
  }

  specialties(q?: string) {
    return this.get(
      "specialties/ai-search",
      { ...(q ? { q } : {}), limit: "50" },
      z.object({ items: z.array(SPECIALTY_SCHEMA), total: z.number() }),
    );
  }

  doctors(params: Record<string, string>) {
    return this.get(
      "providers/ai-search",
      { ...params, limit: "20" },
      z.object({ items: z.array(DOCTOR_SCHEMA), total: z.number() }),
    );
  }

  slots(params: Record<string, string>) {
    return this.get(
      "schedules/ai-availability",
      { ...params, limit: "20" },
      z.object({
        items: z.array(SLOT_SCHEMA),
        total: z.number(),
        checkedAt: z.string(),
        timeZone: z.string(),
      }),
    );
  }
}
