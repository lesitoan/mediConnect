import {
  Injectable,
  Logger,
  ServiceUnavailableException,
  type OnModuleDestroy,
  type OnModuleInit,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createClient } from 'redis';

@Injectable()
export class RedisService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(RedisService.name);
  private readonly client: ReturnType<typeof createClient>;

  constructor(private readonly config: ConfigService) {
    this.client = createClient({
      url: config.getOrThrow<string>('redis.url'),
      disableOfflineQueue: true,
      socket: {
        connectTimeout: config.getOrThrow<number>('redis.connectTimeoutMs'),
        reconnectStrategy: (retries) =>
          retries < 3 ? 100 * (retries + 1) : false,
      },
    });
    this.client.on('error', () =>
      this.logger.warn('Redis connection unavailable'),
    );
  }

  async onModuleInit(): Promise<void> {
    try {
      await this.client.connect();
    } catch {
      throw new ServiceUnavailableException('Redis connection unavailable');
    }
  }

  onModuleDestroy(): void {
    if (this.client.isOpen) this.client.destroy();
  }

  assertReady(): void {
    if (!this.client.isReady)
      throw new ServiceUnavailableException(
        'OTP verification is temporarily unavailable',
      );
  }

  private async execute<T>(
    action: (client: ReturnType<typeof createClient>) => Promise<T>,
  ): Promise<T> {
    this.assertReady();
    try {
      return await action(
        this.client.withAbortSignal(
          AbortSignal.timeout(
            this.config.getOrThrow<number>('redis.commandTimeoutMs'),
          ),
        ),
      );
    } catch {
      throw new ServiceUnavailableException(
        'OTP verification is temporarily unavailable',
      );
    }
  }

  get(key: string): Promise<string | null> {
    return this.execute((client) => client.get(key));
  }

  async set(key: string, value: string, ttlSeconds: number): Promise<void> {
    await this.execute((client) => client.set(key, value, { EX: ttlSeconds }));
  }

  eval(script: string, keys: string[], args: string[]): Promise<unknown> {
    return this.execute((client) =>
      client.eval(script, { keys, arguments: args }),
    );
  }
}
