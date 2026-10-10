import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createHmac } from 'node:crypto';
import { RedisService } from '../../common/redis/redis.service';

export type OtpPurpose = 'REGISTER' | 'RESET_PASSWORD';
export type OtpChannel = 'EMAIL' | 'ZALO';
export interface OtpRecord {
  id: string;
  scope: string;
  userId: string;
  purpose: OtpPurpose;
  channel: OtpChannel;
  destination: string;
  credentialVersion: string | null;
  codeDigest: string;
  status: 'PENDING' | 'READY' | 'LOCKED' | 'VERIFIED';
  resetTokenHash?: string;
}

// Limits live separately from the challenge so resend cannot reset the guessing budget.
const RESERVE_SCRIPT = `
  if redis.call('EXISTS', KEYS[2]) == 1 or tonumber(redis.call('GET', KEYS[3]) or '0') >= tonumber(ARGV[4]) or tonumber(redis.call('GET', KEYS[4]) or '0') >= tonumber(ARGV[5]) then return 0 end
  redis.call('SET', KEYS[1], ARGV[1], 'EX', ARGV[2])
  redis.call('SET', KEYS[2], '1', 'EX', ARGV[3])
  local sends = redis.call('INCR', KEYS[3])
  if sends == 1 then redis.call('EXPIRE', KEYS[3], 3600) end
  return 1
`;
const MARK_SENT_SCRIPT = `
  local raw = redis.call('GET', KEYS[1])
  if not raw then return 0 end
  local record = cjson.decode(raw)
  if record.id ~= ARGV[1] or record.status ~= 'PENDING' then return 0 end
  record.status = 'READY'
  redis.call('SET', KEYS[1], cjson.encode(record), 'KEEPTTL')
  return 1
`;
const REVOKE_SCRIPT = `
  local raw = redis.call('GET', KEYS[1])
  if raw and cjson.decode(raw).id == ARGV[1] then redis.call('DEL', KEYS[1]) end
  return 1
`;
const VERIFY_SCRIPT = `
  local raw = redis.call('GET', KEYS[1])
  if not raw then return false end
  local record = cjson.decode(raw)
  if record.id ~= ARGV[1] or record.status ~= 'READY' or record.codeDigest ~= ARGV[2] then return false end
  if tonumber(redis.call('GET', KEYS[2]) or '0') >= tonumber(ARGV[4]) then return false end
  if ARGV[3] ~= '1' then
    local attempts = redis.call('INCR', KEYS[2])
    if attempts == 1 then redis.call('EXPIRE', KEYS[2], ARGV[5]) end
    if attempts >= tonumber(ARGV[4]) then
      record.status = 'LOCKED'
      redis.call('SET', KEYS[1], cjson.encode(record), 'KEEPTTL')
    end
    return false
  end
  if record.purpose == 'REGISTER' then
    redis.call('DEL', KEYS[1])
  else
    record.status = 'VERIFIED'
    record.codeDigest = ''
    record.resetTokenHash = ARGV[6]
    redis.call('SET', KEYS[1], cjson.encode(record), 'EX', ARGV[7])
  end
  return cjson.encode(record)
`;
const CONSUME_RESET_SCRIPT = `
  local raw = redis.call('GET', KEYS[1])
  if not raw then return false end
  local record = cjson.decode(raw)
  if record.status ~= 'VERIFIED' or record.purpose ~= 'RESET_PASSWORD' or record.resetTokenHash ~= ARGV[1] then return false end
  redis.call('DEL', KEYS[1])
  return raw
`;
const THROTTLE_SCRIPT = `
  local count = redis.call('INCR', KEYS[1])
  if count == 1 then redis.call('EXPIRE', KEYS[1], ARGV[2]) end
  return count <= tonumber(ARGV[1]) and 1 or 0
`;

@Injectable()
export class OtpStoreService {
  constructor(
    private readonly redis: RedisService,
    private readonly config: ConfigService,
  ) {}

  assertReady(): void {
    this.redis.assertReady();
  }

  private number(name: string): number {
    return this.config.getOrThrow<number>('otp.' + name);
  }
  private key(suffix: string): string {
    return `${this.config.getOrThrow<string>('otp.keyPrefix')}:${suffix}`;
  }
  private stateKey(scope: string): string {
    return this.key(`{${scope}}:state`);
  }
  private digest(value: string): string {
    return createHmac('sha256', this.config.getOrThrow<string>('otp.secret'))
      .update(value)
      .digest('hex');
  }
  scope(userId: string, purpose: OtpPurpose): string {
    return this.digest(`scope:${userId}:${purpose}`);
  }

  async throttle(
    ip: string,
    operation: 'SEND' | 'VERIFY' | 'RESET',
  ): Promise<boolean> {
    const [limit, ttl] =
      operation === 'SEND'
        ? [30, 3600]
        : operation === 'VERIFY'
          ? [60, 60]
          : [20, 60];
    return (
      (await this.redis.eval(
        THROTTLE_SCRIPT,
        [this.key(`ip:${this.digest(ip)}:${operation}`)],
        [String(limit), String(ttl)],
      )) === 1
    );
  }

  async reserve(record: OtpRecord): Promise<boolean> {
    const ttl = this.number('expiresInSeconds');
    // An orphaned lookup is harmless: the state must also match this exact challenge ID.
    await this.redis.set(this.key(`challenge:${record.id}`), record.scope, ttl);
    return (
      (await this.redis.eval(
        RESERVE_SCRIPT,
        [
          this.stateKey(record.scope),
          this.key(`{${record.scope}}:cooldown`),
          this.key(`{${record.scope}}:sends`),
          this.key(`{${record.scope}}:attempts`),
        ],
        [
          JSON.stringify(record),
          String(ttl),
          String(this.number('resendSeconds')),
          String(this.number('maxSendsPerHour')),
          String(this.number('maxAttempts')),
        ],
      )) === 1
    );
  }

  async markSent(record: OtpRecord): Promise<boolean> {
    return (
      (await this.redis.eval(
        MARK_SENT_SCRIPT,
        [this.stateKey(record.scope)],
        [record.id],
      )) === 1
    );
  }
  async revoke(record: OtpRecord): Promise<void> {
    await this.redis.eval(
      REVOKE_SCRIPT,
      [this.stateKey(record.scope)],
      [record.id],
    );
  }

  private parse(raw: unknown): OtpRecord | null {
    if (typeof raw !== 'string') return null;
    try {
      const record = JSON.parse(raw) as OtpRecord;
      if (
        !record ||
        typeof record.userId !== 'string' ||
        typeof record.id !== 'string' ||
        typeof record.scope !== 'string' ||
        !/^[a-f0-9]{64}$/.test(record.scope) ||
        !['REGISTER', 'RESET_PASSWORD'].includes(record.purpose) ||
        !['EMAIL', 'ZALO'].includes(record.channel) ||
        typeof record.destination !== 'string' ||
        typeof record.codeDigest !== 'string' ||
        !(
          record.credentialVersion === null ||
          typeof record.credentialVersion === 'string'
        )
      )
        return null;
      return record;
    } catch {
      return null;
    }
  }

  private async readIndex(
    kind: 'challenge' | 'reset',
    id: string,
  ): Promise<OtpRecord | null> {
    const scope = await this.redis.get(this.key(`${kind}:${id}`));
    if (!scope || !/^[a-f0-9]{64}$/.test(scope)) return null;
    return this.parse(await this.redis.get(this.stateKey(scope)));
  }
  async getChallenge(id: string): Promise<OtpRecord | null> {
    const record = await this.readIndex('challenge', id);
    return record?.id === id && record.status === 'READY' ? record : null;
  }
  async verify(
    record: OtpRecord,
    isCodeValid: boolean,
    resetTokenHash: string,
  ): Promise<OtpRecord | null> {
    if (isCodeValid && record.purpose === 'RESET_PASSWORD') {
      await this.redis.set(
        this.key(`reset:${resetTokenHash}`),
        record.scope,
        this.number('resetExpiresInSeconds'),
      );
    }
    return this.parse(
      await this.redis.eval(
        VERIFY_SCRIPT,
        [this.stateKey(record.scope), this.key(`{${record.scope}}:attempts`)],
        [
          record.id,
          record.codeDigest,
          isCodeValid ? '1' : '0',
          String(this.number('maxAttempts')),
          String(this.number('attemptWindowSeconds')),
          resetTokenHash,
          String(this.number('resetExpiresInSeconds')),
        ],
      ),
    );
  }
  async getResetGrant(tokenHash: string): Promise<OtpRecord | null> {
    const record = await this.readIndex('reset', tokenHash);
    return record?.status === 'VERIFIED' && record.resetTokenHash === tokenHash
      ? record
      : null;
  }
  async consumeReset(record: OtpRecord, tokenHash: string): Promise<boolean> {
    return (
      this.parse(
        await this.redis.eval(
          CONSUME_RESET_SCRIPT,
          [this.stateKey(record.scope)],
          [tokenHash],
        ),
      ) !== null
    );
  }
}
