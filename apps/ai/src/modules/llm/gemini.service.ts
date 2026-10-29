import {
  Inject,
  Injectable,
  Logger,
  ServiceUnavailableException,
} from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { ApiError, GoogleGenAI } from "@google/genai";

@Injectable()
export class GeminiService {
  private readonly logger = new Logger(GeminiService.name);
  constructor(@Inject(ConfigService) private readonly config: ConfigService) {}

  async json(
    systemInstruction: string,
    input: unknown,
    responseJsonSchema: Record<string, unknown>,
  ): Promise<unknown> {
    const key = this.config.get<string>("GEMINI_API_KEY");
    if (!key)
      throw new ServiceUnavailableException("Gemini chưa được cấu hình.");
    try {
      const client = new GoogleGenAI({ apiKey: key });
      const response = await client.models.generateContent({
        model:
          this.config.get<string>("GEMINI_MODEL") ?? "gemini-3.1-flash-lite",
        contents: JSON.stringify(input),
        config: {
          systemInstruction,
          temperature: 0,
          maxOutputTokens: 2200,
          httpOptions: { timeout: 30000 },
          responseMimeType: "application/json",
          responseJsonSchema,
        },
      });
      return JSON.parse(response.text ?? "null") as unknown;
    } catch (error: unknown) {
      this.logger.warn(
        `Gemini request failed; status=${error instanceof ApiError ? error.status : "UNKNOWN"}`,
      );
      // Provider errors can contain credentials or user input, so do not forward them.
      throw new ServiceUnavailableException(
        "Không thể nhận phản hồi từ Gemini.",
      );
    }
  }
}
