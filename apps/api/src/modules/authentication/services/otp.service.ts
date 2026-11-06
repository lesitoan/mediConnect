import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  UnauthorizedException,
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
import { compare, hash } from 'bcrypt';
import { Prisma } from '../../../generated/prisma/client';
import {
  RoleStatusEnum,
  UserRole,
  UserStatus,
} from '../../../generated/prisma/enums';
import { OtpDeliveryService } from '../../notifications/services/otp-delivery.service';
import { UsersService } from '../../users/services/users.service';
import { ContactDto } from '../dto/requests/contact.dto';
import { PermissionEnum } from '../constants/permissions.constant';
import type { RequestContactChangeDto } from '../dto/requests/request-contact-change.dto';
import { OtpChallengeDto } from '../dto/responses/otp-challenge.dto';
import { VerifyOtpResponseDto } from '../dto/responses/verify-otp-response.dto';
import {
  OtpStoreService,
  type OtpRecord,
  type OtpThrottleOperation,
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
    if (!this.isDevelopmentMode()) {
      this.delivery.assertConfigured(contact.email ? 'EMAIL' : 'PHONE');
    }
  }

  private isDevelopmentMode(): boolean {
    return this.config.get<boolean>('otp.devMode') === true;
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
    subject: string,
    operation: OtpThrottleOperation,
  ): Promise<void> {
    if (!(await this.store.throttle(subject, operation)))
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
      (record.purpose !== 'RESET_PASSWORD' ||
        user.role.name !== UserRole.PATIENT ||
        (record.channel === 'EMAIL'
          ? !!user.emailVerifiedAt
          : !!user.phoneVerifiedAt)) &&
      user.contactVersion === (record.contactVersion ?? 0) &&
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
    purpose: Exclude<OtpPurpose, 'CHANGE_CONTACT'>,
    knownUserId?: string,
    ip = 'UNKNOWN',
  ): Promise<OtpChallengeDto> {
    this.assertConfigured(contact);
    if (!knownUserId) await this.throttle(ip, 'SEND');
    const channel = contact.email ? 'EMAIL' : 'PHONE';
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
      contactVersion: user.contactVersion,
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
    return this.deliver(record, code, response);
  }

  private async deliver(
    record: OtpRecord,
    code: string,
    response: OtpChallengeDto,
  ) {
    try {
      if (!this.isDevelopmentMode()) {
        await this.delivery.send({
          challengeId: record.id,
          destination: record.destination,
          channel: response.channel,
          purpose: record.purpose,
          code,
          expiresInSeconds: response.expiresIn,
        });
      }
      if (!(await this.store.markSent(record)))
        throw new BadRequestException(
          'OTP request was replaced or expired. Request a new OTP',
        );
    } catch (error) {
      await this.store.revoke(record);
      throw error;
    }
    return {
      ...response,
      ...(this.isDevelopmentMode() ? { developmentCode: code } : {}),
    };
  }

  private async assertPatientSession(
    tx: Prisma.TransactionClient,
    userId: string,
    sessionId: string,
  ) {
    const current = await this.users.assertSelfPermission(
      tx,
      userId,
      PermissionEnum.USERS_UPDATE_ME,
    );
    if (current.role !== UserRole.PATIENT) throw new ForbiddenException();
    const session = await tx.authSession.findFirst({
      where: {
        id: sessionId,
        userId,
        revokedAt: null,
        expiresAt: { gt: new Date() },
      },
      select: { id: true },
    });
    if (!session)
      throw new UnauthorizedException('Phiên đăng nhập không còn hiệu lực.');
    return tx.user.findUniqueOrThrow({ where: { id: userId } });
  }

  async requestContactChange(
    input: RequestContactChangeDto,
    userId: string,
    sessionId: string,
    ip: string,
  ) {
    this.assertConfigured(input);
    await this.throttle(ip, 'CONTACT_CHANGE_SEND');
    await this.throttle(userId, 'CONTACT_CHANGE');
    const channel = input.email !== undefined ? 'EMAIL' : 'PHONE';
    const destination = input.email ?? input.phone!;
    const code = randomInt(0, 1_000_000).toString().padStart(6, '0');
    const record = await this.users.withLockedAccount(userId, async (tx) => {
      const user = await this.assertPatientSession(tx, userId, sessionId);
      if (
        !user.passwordHash ||
        !(await compare(input.currentPassword, user.passwordHash))
      )
        throw new BadRequestException('Mật khẩu hiện tại không đúng.');
      const sameVerifiedContact =
        channel === 'EMAIL'
          ? user.email === destination && user.emailVerifiedAt
          : user.phone === destination && user.phoneVerifiedAt;
      if (sameVerifiedContact)
        throw new BadRequestException('Liên hệ này đã được xác minh.');
      const owner = await tx.user.findUnique({
        where:
          channel === 'EMAIL' ? { email: destination } : { phone: destination },
        select: { id: true },
      });
      if (owner && owner.id !== userId)
        throw new ConflictException('Thông tin liên hệ không khả dụng.');
      const record: OtpRecord = {
        id: randomUUID(),
        scope: this.store.scope(userId, 'CHANGE_CONTACT'),
        userId,
        sessionId,
        purpose: 'CHANGE_CONTACT',
        channel,
        destination,
        contactVersion: user.contactVersion,
        credentialVersion: user.passwordChangedAt?.toISOString() ?? null,
        codeDigest: '',
        status: 'PENDING',
      };
      record.codeDigest = this.digest(record, code);
      if (!(await this.store.reserve(record)))
        throw new HttpException(
          'Vui lòng chờ trước khi yêu cầu mã mới.',
          HttpStatus.TOO_MANY_REQUESTS,
        );
      return record;
    });
    const response = await this.deliver(record, code, {
      challengeId: record.id,
      channel,
      expiresIn: this.number('expiresInSeconds'),
      retryAfter: this.number('resendSeconds'),
      message: 'Đã yêu cầu gửi mã xác minh.',
    });
    const maskedDestination =
      channel === 'EMAIL'
        ? `${destination[0]}***${destination.slice(destination.lastIndexOf('@'))}`
        : `${destination.slice(0, 4)}****${destination.slice(-3)}`;
    return { ...response, maskedDestination };
  }

  async confirmContactChange(
    challengeId: string,
    code: string,
    userId: string,
    sessionId: string,
  ) {
    await this.throttle(userId, 'CONTACT_CHANGE_VERIFY');
    const record = await this.store.getChallenge(challengeId);
    if (
      record?.purpose !== 'CHANGE_CONTACT' ||
      record.userId !== userId ||
      record.sessionId !== sessionId
    )
      throw new BadRequestException(INVALID_OTP);
    try {
      await this.users.withLockedAccount(userId, async (tx) => {
        const user = await this.assertPatientSession(tx, userId, sessionId);
        if (
          user.contactVersion !== record.contactVersion ||
          (user.passwordChangedAt?.toISOString() ?? null) !==
            record.credentialVersion ||
          !(await this.store.verify(record, this.isCodeValid(record, code), ''))
        )
          throw new BadRequestException(INVALID_OTP);
        const now = new Date();
        const isEmail = record.channel === 'EMAIL';
        const contact = isEmail
          ? { email: record.destination }
          : { phone: record.destination };
        await tx.user.update({
          where: { id: userId },
          data: {
            ...contact,
            contactVersion: { increment: 1 },
            ...(isEmail ? { emailVerifiedAt: now } : { phoneVerifiedAt: now }),
          },
        });
        await tx.patient.updateMany({ where: { userId }, data: contact });
        const revoked = await tx.authSession.updateMany({
          where: { userId, revokedAt: null },
          data: { revokedAt: now, revocationReason: 'CONTACT_CHANGED' },
        });
        await this.users.recordAccountEvent(
          tx,
          userId,
          'ACCOUNT_CONTACT_CHANGED',
          {
            channel: isEmail ? 'EMAIL' : 'PHONE',
            revokedSessions: revoked.count,
          },
        );
      });
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2002'
      )
        throw new ConflictException('Thông tin liên hệ không khả dụng.');
      throw error;
    }
    return { message: 'Đã cập nhật liên hệ. Vui lòng đăng nhập lại.' };
  }

  private isCodeValid(record: OtpRecord, code: string): boolean {
    const actual = Buffer.from(record.codeDigest, 'hex');
    const expected = Buffer.from(this.digest(record, code), 'hex');
    return (
      actual.length === expected.length && timingSafeEqual(actual, expected)
    );
  }

  async verify(
    challengeId: string,
    code: string,
    ip = 'UNKNOWN',
  ): Promise<VerifyOtpResponseDto> {
    await this.throttle(ip, 'VERIFY');
    const record = await this.store.getChallenge(challengeId);
    if (!record || record.purpose === 'CHANGE_CONTACT')
      throw new BadRequestException(INVALID_OTP);
    const resetToken = randomBytes(32).toString('hex');
    const result = await this.users.withLockedAccount(
      record.userId,
      async (tx) => {
        if (!(await this.isEligible(tx, record))) return null;
        const verified = await this.store.verify(
          record,
          this.isCodeValid(record, code),
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
