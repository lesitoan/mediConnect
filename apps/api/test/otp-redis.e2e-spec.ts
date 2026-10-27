import { ConfigService } from '@nestjs/config';
import { randomUUID } from 'node:crypto';
import { createClient } from 'redis';
import { RedisService } from '../src/modules/redis/services/redis.service';
import {
  OtpStoreService,
  type OtpRecord,
} from '../src/modules/authentication/services/otp-store.service';

// Explicit opt-in; never use the application's Redis URL or flush its database.
const REDIS_TEST_URL = process.env.REDIS_TEST_URL;
const describeRedis = REDIS_TEST_URL ? describe : describe.skip;

describeRedis('OTP store (real Redis; isolated test namespace)', () => {
  const prefix = `mediconnect:otp-test:${randomUUID()}`;
  const config = new ConfigService({
    redis: {
      url: REDIS_TEST_URL,
      connectTimeoutMs: 3000,
      commandTimeoutMs: 1500,
    },
    otp: {
      keyPrefix: prefix,
      secret: 'test-secret',
      expiresInSeconds: 30,
      resetExpiresInSeconds: 30,
      resendSeconds: 1,
      maxAttempts: 5,
      maxSendsPerHour: 5,
      attemptWindowSeconds: 900,
    },
  });
  let redis: RedisService;
  let store: OtpStoreService;
  let inspect: ReturnType<typeof createClient>;
  function record(): OtpRecord {
    const userId = randomUUID();
    return {
      id: randomUUID(),
      scope: store.scope(userId, 'RESET_PASSWORD'),
      userId,
      purpose: 'RESET_PASSWORD',
      channel: 'EMAIL',
      destination: 'test@example.com',
      credentialVersion: null,
      codeDigest: 'a'.repeat(64),
      status: 'PENDING',
    };
  }
  beforeAll(async () => {
    redis = new RedisService(config);
    await redis.onModuleInit();
    store = new OtpStoreService(redis, config);
    inspect = createClient({
      url: REDIS_TEST_URL,
      socket: { connectTimeout: 3000, reconnectStrategy: false },
    });
    inspect.on('error', () => {});
    await inspect.connect();
  }, 15000);
  afterAll(async () => {
    try {
      if (inspect?.isReady) {
        for await (const keys of inspect.scanIterator({
          MATCH: prefix + ':*',
          COUNT: 100,
        }))
          if (keys.length) await inspect.del(keys);
      }
    } finally {
      if (inspect?.isOpen) inspect.destroy();
      redis?.onModuleDestroy();
    }
  });

  it('reserves one challenge per scope and does not allow verification before delivery', async () => {
    const value = record();
    const results = await Promise.all(
      Array.from({ length: 8 }, () =>
        store.reserve({ ...value, id: randomUUID() }),
      ),
    );
    expect(results.filter(Boolean)).toHaveLength(1);
    const pending = record();
    await store.reserve(pending);
    expect(await store.getChallenge(pending.id)).toBeNull();
    await store.markSent(pending);
    expect(await store.getChallenge(pending.id)).toMatchObject({
      id: pending.id,
      status: 'READY',
    });
  });
  it('atomically limits concurrent wrong attempts to five and preserves the budget after resend', async () => {
    const value = record();
    await store.reserve(value);
    await store.markSent(value);
    await Promise.all(
      Array.from({ length: 20 }, () => store.verify(value, false, 'unused')),
    );
    expect(await inspect.get(`${prefix}:{${value.scope}}:attempts`)).toBe('5');
    expect(await store.getChallenge(value.id)).toBeNull();
    await new Promise((resolve) => setTimeout(resolve, 1100));
    expect(await store.reserve({ ...value, id: randomUUID() })).toBe(false);
    expect(await store.verify(value, true, 'b'.repeat(64))).toBeNull();
  });
  it('issues and consumes a reset grant once under concurrent requests', async () => {
    const value = record();
    await store.reserve(value);
    await store.markSent(value);
    const tokenHash = 'c'.repeat(64);
    const results = await Promise.all(
      Array.from({ length: 8 }, () => store.verify(value, true, tokenHash)),
    );
    expect(results.filter(Boolean)).toHaveLength(1);
    const grant = await store.getResetGrant(tokenHash);
    expect(grant).not.toBeNull();
    const consumed = await Promise.all(
      Array.from({ length: 8 }, () => store.consumeReset(grant!, tokenHash)),
    );
    expect(consumed.filter(Boolean)).toHaveLength(1);
    expect(await store.getResetGrant(tokenHash)).toBeNull();
  });
  it('expires challenges and reset grants using Redis TTL', async () => {
    config.set('otp.expiresInSeconds', 1);
    config.set('otp.resetExpiresInSeconds', 1);
    try {
      const value = record();
      await store.reserve(value);
      await store.markSent(value);
      await new Promise((resolve) => setTimeout(resolve, 1100));
      expect(await store.getChallenge(value.id)).toBeNull();
      const next = record();
      await store.reserve(next);
      await store.markSent(next);
      await store.verify(next, true, 'd'.repeat(64));
      await new Promise((resolve) => setTimeout(resolve, 1100));
      expect(await store.getResetGrant('d'.repeat(64))).toBeNull();
    } finally {
      config.set('otp.expiresInSeconds', 30);
      config.set('otp.resetExpiresInSeconds', 30);
    }
  });
  it('resend invalidates previously verified reset grants', async () => {
    const value = record();
    await store.reserve(value);
    await store.markSent(value);
    await store.verify(value, true, 'e'.repeat(64));
    await new Promise((resolve) => setTimeout(resolve, 1100));
    expect(await store.reserve({ ...value, id: randomUUID() })).toBe(true);
    expect(await store.getResetGrant('e'.repeat(64))).toBeNull();
  });
});
