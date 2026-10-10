import { createHmac } from 'node:crypto';
import type { OtpRecord } from '../../src/modules/authentication/otp-store.service';

export interface StoredOtp extends OtpRecord {
  createdAt: Date;
  expiresAt: Date;
  sentAt: Date | null;
  verifiedAt: Date | null;
  consumedAt: Date | null;
  revokedAt: Date | null;
  attemptCount: number;
  continuationTokenHash: string | null;
  continuationExpiresAt: Date | null;
}

// Test boundary for the HTTP workflow. Real Redis integration is a separate suite.
export class InMemoryOtpStore {
  readonly records = new Map<string, StoredOtp>();
  private readonly attempts = new Map<string, number>();
  private readonly current = new Map<string, string>();
  assertReady = jest.fn();
  throttle = jest.fn(() => Promise.resolve(true));

  clear(): void {
    this.records.clear();
    this.attempts.clear();
    this.current.clear();
  }
  scope(userId: string, purpose: string): string {
    return createHmac('sha256', 'test')
      .update(userId + purpose)
      .digest('hex');
  }

  reserve(record: OtpRecord): Promise<boolean> {
    const now = Date.now();
    const recent = [...this.records.values()]
      .filter(
        (row) =>
          row.scope === record.scope &&
          row.createdAt.getTime() > now - 3_600_000,
      )
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
    if (
      recent.length >= 5 ||
      (recent[0] && now - recent[0].createdAt.getTime() < 60_000) ||
      (this.attempts.get(record.scope) ?? 0) >= 5
    )
      return Promise.resolve(false);
    for (const row of this.records.values())
      if (row.scope === record.scope) row.revokedAt = new Date();
    this.records.set(record.id, {
      ...record,
      createdAt: new Date(now),
      expiresAt: new Date(now + 300_000),
      sentAt: null,
      verifiedAt: null,
      consumedAt: null,
      revokedAt: null,
      attemptCount: this.attempts.get(record.scope) ?? 0,
      continuationTokenHash: null,
      continuationExpiresAt: null,
    });
    this.current.set(record.scope, record.id);
    return Promise.resolve(true);
  }
  markSent(record: OtpRecord): Promise<boolean> {
    const row = this.records.get(record.id);
    if (
      !row ||
      row.revokedAt ||
      row.expiresAt.getTime() <= Date.now() ||
      this.current.get(record.scope) !== record.id
    )
      return Promise.resolve(false);
    row.sentAt = new Date();
    row.status = 'READY';
    return Promise.resolve(true);
  }
  revoke(record: OtpRecord): Promise<void> {
    const row = this.records.get(record.id);
    if (row) row.revokedAt = new Date();
    if (this.current.get(record.scope) === record.id)
      this.current.delete(record.scope);
    return Promise.resolve();
  }
  getChallenge(id: string): Promise<StoredOtp | null> {
    const row = this.records.get(id);
    return Promise.resolve(
      row &&
        row.sentAt &&
        !row.revokedAt &&
        !row.verifiedAt &&
        !row.consumedAt &&
        row.expiresAt.getTime() > Date.now() &&
        this.current.get(row.scope) === id
        ? { ...row }
        : null,
    );
  }
  verify(
    record: OtpRecord,
    isCodeValid: boolean,
    tokenHash: string,
  ): Promise<OtpRecord | null> {
    const row = this.records.get(record.id);
    if (
      !row ||
      row.status !== 'READY' ||
      row.revokedAt ||
      row.expiresAt.getTime() <= Date.now() ||
      this.current.get(row.scope) !== row.id ||
      (this.attempts.get(row.scope) ?? 0) >= 5
    )
      return Promise.resolve(null);
    if (!isCodeValid) {
      const count = (this.attempts.get(row.scope) ?? 0) + 1;
      this.attempts.set(row.scope, count);
      row.attemptCount = count;
      if (count >= 5) {
        row.status = 'LOCKED';
        row.revokedAt = new Date();
      }
      return Promise.resolve(null);
    }
    row.verifiedAt = new Date();
    if (record.purpose === 'REGISTER') {
      row.consumedAt = new Date();
      this.current.delete(record.scope);
    } else {
      row.status = 'VERIFIED';
      row.resetTokenHash = tokenHash;
      row.continuationTokenHash = tokenHash;
      row.continuationExpiresAt = new Date(Date.now() + 600_000);
    }
    return Promise.resolve({ ...row });
  }
  getResetGrant(hash: string): Promise<StoredOtp | null> {
    const row = [...this.records.values()].find(
      (row) => row.continuationTokenHash === hash,
    );
    return Promise.resolve(
      row &&
        row.status === 'VERIFIED' &&
        row.purpose === 'RESET_PASSWORD' &&
        !row.revokedAt &&
        !row.consumedAt &&
        row.continuationExpiresAt &&
        row.continuationExpiresAt.getTime() > Date.now() &&
        this.current.get(row.scope) === row.id
        ? { ...row }
        : null,
    );
  }
  async consumeReset(record: OtpRecord, hash: string): Promise<boolean> {
    const row = await this.getResetGrant(hash);
    if (!row || row.id !== record.id) return false;
    const stored = this.records.get(row.id)!;
    if (stored.consumedAt) return false;
    stored.consumedAt = new Date();
    this.current.delete(row.scope);
    return true;
  }
}
