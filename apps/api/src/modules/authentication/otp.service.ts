import {
  BadRequestException,
  HttpException,
  HttpStatus,
  Injectable,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  createHash,
  createHmac,
  randomBytes,
  randomInt,
  randomUUID,
  timingSafeEqual,
} from 'node:crypto';
import { hash } from 'bcrypt';
import type { Prisma } from '../../generated/prisma/client';
import { RoleStatusEnum, UserStatus } from '../../generated/prisma/enums';
import { OtpDeliveryService } from '../notifications/otp-delivery.service';
import { UsersService } from '../users/users.service';
import { ContactDto } from './dto/contact.dto';
import { OtpChallengeDto, VerifyOtpResponseDto } from './dto/otp.dto';
import {
  OtpStoreService,
  type OtpRecord,
  type OtpPurpose,
} from './otp-store.service';

const INVALID_OTP = 'Invalid or expired OTP';
const INVALID_RESET_TOKEN = 'Invalid or expired reset token';

@Injectable()
export class OtpService {
  constructor(
    private readonly store: OtpStoreService,
    private readonly users: UsersService,
    private readonly delivery: OtpDeliveryService,
    private readonly config: ConfigService,
  ) {}

  assertConfigured(contact: ContactDto): void {
    this.store.assertReady();
    this.delivery.assertConfigured(contact.email ? 'EMAIL' : 'ZALO');
  }

  async assertCanSend(contact: ContactDto, ip: string): Promise<void> {
    this.assertConfigured(contact);
    await this.throttle(ip, 'SEND');
  }
  private number(key: string): number {
    return this.config.getOrThrow<number>('otp.' + key);
  }
  private digest(
    record: Pick<
      OtpRecord,
      'id' | 'userId' | 'purpose' | 'channel' | 'destination'
    >,
    code: string,
  ): string {
    return createHmac('sha256', this.config.getOrThrow<string>('otp.secret'))
      .update(
        JSON.stringify([
          record.id,
          record.userId,
          record.purpose,
          record.channel,
          record.destination,
          code,
        ]),
      )
      .digest('hex');
  }
  private tokenHash(token: string): string {
    return createHash('sha256').update(token).digest('hex');
  }
  private async throttle(
    ip: string,
    operation: 'SEND' | 'VERIFY' | 'RESET',
  ): Promise<void> {
    if (!(await this.store.throttle(ip, operation)))
      throw new HttpException(
        'Too many requests. Try again later',
        HttpStatus.TOO_MANY_REQUESTS,
      );
  }
  private async isEligible(
    tx: Prisma.TransactionClient,
    record: OtpRecord,
  ): Promise<boolean> {
    const user = await tx.user.findUnique({
      where: { id: record.userId },
      include: { role: true },
    });
    return (
      !!user &&
      !user.deletedAt &&
      user.role?.status === RoleStatusEnum.ACTIVE &&
      !user.role.deletedAt &&
      !!user.passwordHash &&
      (record.channel === 'EMAIL'
        ? user.email === record.destination
        : user.phone === record.destination) &&
      user.status ===
        (record.purpose === 'REGISTER'
          ? UserStatus.PENDING_VERIFICATION
          : UserStatus.ACTIVE) &&
      (user.passwordChangedAt?.toISOString() ?? null) ===
        record.credentialVersion
    );
  }

  async send(
    contact: ContactDto,
    purpose: OtpPurpose,
    knownUserId?: string,
    ip = 'UNKNOWN',
  ): Promise<OtpChallengeDto> {
    this.assertConfigured(contact);
    if (!knownUserId) await this.throttle(ip, 'SEND');
    const channel = contact.email ? 'EMAIL' : 'ZALO';
    const destination = contact.email ?? contact.phone!;
    const id = randomUUID();
    const response: OtpChallengeDto = {
      challengeId: id,
      channel,
      expiresIn: this.number('expiresInSeconds'),
      retryAfter: this.number('resendSeconds'),
      message: 'If the account is eligible, an OTP will be sent',
    };
    const user = await this.users.findForAuthentication(contact);
    if (!user || (knownUserId && user.id !== knownUserId)) return response;
    const code = randomInt(0, 1_000_000).toString().padStart(6, '0');
    const record: OtpRecord = {
      id,
      scope: this.store.scope(user.id, purpose),
      userId: user.id,
      purpose,
      channel,
      destination,
      credentialVersion: user.passwordChangedAt?.toISOString() ?? null,
      codeDigest: '',
      status: 'PENDING',
    };
    record.codeDigest = this.digest(record, code);
    const isReserved = await this.users.withLockedAccount(
      user.id,
      async (tx) => {
        if (!(await this.isEligible(tx, record))) return false;
        return this.store.reserve(record);
      },
    );
    if (!isReserved) return response;
    try {
      // Provider I/O happens after the PostgreSQL account lock is released.
      await this.delivery.send({
        challengeId: id,
        destination,
        channel,
        purpose,
        code,
        expiresInSeconds: response.expiresIn,
      });
      if (!(await this.store.markSent(record)))
        throw new BadRequestException(
          'OTP request was replaced or expired. Request a new OTP',
        );
    } catch (error) {
      await this.store.revoke(record);
      throw error;
    }
    return response;
  }

  async verify(
    challengeId: string,
    code: string,
    ip = 'UNKNOWN',
  ): Promise<VerifyOtpResponseDto> {
    await this.throttle(ip, 'VERIFY');
    const record = await this.store.getChallenge(challengeId);
    if (!record) throw new BadRequestException(INVALID_OTP);
    const actual = Buffer.from(record.codeDigest, 'hex');
    const expected = Buffer.from(this.digest(record, code), 'hex');
    const isCodeValid =
      actual.length === expected.length && timingSafeEqual(actual, expected);
    const resetToken = randomBytes(32).toString('hex');
    const result = await this.users.withLockedAccount(
      record.userId,
      async (tx) => {
        if (!(await this.isEligible(tx, record))) return null;
        const verified = await this.store.verify(
          record,
          isCodeValid,
          this.tokenHash(resetToken),
        );
        if (!verified) return null;
        if (verified.purpose === 'REGISTER') {
          await this.users.activateAccount(
            tx,
            verified.userId,
            verified.channel,
            new Date(),
          );
          return { purpose: 'REGISTER', activated: true } as const;
        }
        return {
          purpose: 'RESET_PASSWORD',
          resetToken,
          expiresIn: this.number('resetExpiresInSeconds'),
        } as const;
      },
    );
    if (!result) throw new BadRequestException(INVALID_OTP);
    return result;
  }

  async resetPassword(
    resetToken: string,
    password: string,
    ip = 'UNKNOWN',
  ): Promise<{ message: string }> {
    await this.throttle(ip, 'RESET');
    const tokenHash = this.tokenHash(resetToken);
    const record = await this.store.getResetGrant(tokenHash);
    if (!record) throw new BadRequestException(INVALID_RESET_TOKEN);
    const passwordHash = await hash(password, 12);
    const isReset = await this.users.withLockedAccount(
      record.userId,
      async (tx) => {
        if (!(await this.isEligible(tx, record))) return false;
        // Redis consumes the grant before committing the DB change. On DB failure,
        // require a new OTP rather than restoring a possibly already-used grant.
        if (!(await this.store.consumeReset(record, tokenHash))) return false;
        const now = new Date(
          Math.max(
            Date.now(),
            record.credentialVersion
              ? Date.parse(record.credentialVersion) + 1
              : 0,
          ),
        );
        await this.users.resetPassword(tx, record.userId, passwordHash, now);
        return true;
      },
    );
    if (!isReset) throw new BadRequestException(INVALID_RESET_TOKEN);
    return { message: 'Password updated. Please sign in again' };
  }
}
