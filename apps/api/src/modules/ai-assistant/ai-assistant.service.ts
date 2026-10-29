import {
  HttpException,
  Injectable,
  Logger,
  ServiceUnavailableException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createHash, randomUUID } from 'node:crypto';
import { RedisService } from '../redis/services/redis.service';

type ChatTurn = { role: 'user' | 'assistant'; text: string };
type ChatResult = {
  answer: string;
  intent: string;
  sources: { id: string; title: string }[];
};

@Injectable()
export class AiAssistantService {
  private readonly logger = new Logger(AiAssistantService.name);
  constructor(
    private readonly redis: RedisService,
    private readonly config: ConfigService,
  ) {}

  async chat(
    sessionId: string,
    ip: string,
    message: string,
    reset = false,
  ): Promise<ChatResult> {
    if (!message.trim()) throw new HttpException('Vui lòng nhập câu hỏi.', 400);
    const token = this.config.get<string>('AI_INTERNAL_TOKEN');
    if (!token)
      throw new ServiceUnavailableException('Trợ lý AI chưa được cấu hình.');
    const ipKey = createHash('sha256').update(ip).digest('hex');
    const allowed = await this.redis.eval(
      `
      local count = redis.call('INCR', KEYS[1])
      if count == 1 then redis.call('EXPIRE', KEYS[1], 60) end
      return count <= tonumber(ARGV[1]) and 1 or 0
    `,
      [`ai:rate:${ipKey}`],
      ['12'],
    );
    if (allowed !== 1)
      throw new HttpException(
        'Bạn gửi quá nhiều câu hỏi. Vui lòng thử lại sau một phút.',
        429,
      );
    const lockKey = `ai:lock:${sessionId}`;
    const lockId = randomUUID();
    const locked = await this.redis.eval(
      "return redis.call('SET', KEYS[1], ARGV[1], 'NX', 'EX', 100)",
      [lockKey],
      [lockId],
    );
    if (!locked) throw new HttpException('Câu hỏi trước đang được xử lý.', 429);
    try {
      const key = `ai:conversation:${sessionId}`;
      const saved = reset ? null : await this.redis.get(key);
      const history = saved ? (JSON.parse(saved) as ChatTurn[]) : [];
      let result: ChatResult;
      try {
        const base = (
          this.config.get<string>('AI_SERVICE_URL') ?? 'http://127.0.0.1:4100'
        ).replace(/\/$/, '');
        const response = await fetch(`${base}/internal/chats`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-AI-Internal-Token': token,
          },
          body: JSON.stringify({ message: message.trim(), history }),
          signal: AbortSignal.timeout(90000),
        });
        if (!response.ok) {
          this.logger.warn(`AI service returned status=${response.status}`);
          const upstream: unknown = await response.json().catch(() => null);
          if (
            upstream &&
            typeof upstream === 'object' &&
            'errorCode' in upstream &&
            upstream.errorCode === 'LOOKUP_DATABASE_SCHEMA_OUTDATED'
          ) {
            throw new ServiceUnavailableException(
              'Chưa thể tra cứu vì database chưa được cập nhật cấu trúc. Vui lòng cập nhật migration ở API.',
            );
          }
          throw new Error('AI request failed');
        }
        const body: unknown = await response.json();
        if (
          !body ||
          typeof body !== 'object' ||
          !('answer' in body) ||
          typeof body.answer !== 'string' ||
          !('intent' in body) ||
          typeof body.intent !== 'string' ||
          !('sources' in body) ||
          !Array.isArray(body.sources)
        )
          throw new Error('Invalid AI response');
        result = body as ChatResult;
      } catch (error: unknown) {
        if (error instanceof ServiceUnavailableException) throw error;
        this.logger.warn(
          `AI request failed; type=${error instanceof Error ? error.name : 'UNKNOWN'}`,
        );
        throw new ServiceUnavailableException(
          'Trợ lý AI hiện chưa phản hồi. Vui lòng thử lại sau.',
        );
      }
      const turns: ChatTurn[] = [
        ...history,
        { role: 'user', text: message.trim() },
        { role: 'assistant', text: result.answer },
      ];
      await this.redis.set(key, JSON.stringify(turns.slice(-12)), 1800);
      return result;
    } finally {
      await this.redis.eval(
        "if redis.call('GET', KEYS[1]) == ARGV[1] then return redis.call('DEL', KEYS[1]) else return 0 end",
        [lockKey],
        [lockId],
      );
    }
  }
}
