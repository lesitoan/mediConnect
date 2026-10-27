import { registerAs } from '@nestjs/config';

export const redisConfig = registerAs('redis', () => ({
  url: process.env.REDIS_URL,
  connectTimeoutMs: 3000,
  commandTimeoutMs: 1500,
}));
