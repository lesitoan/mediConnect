import {
  ConflictException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { compare, hash } from 'bcrypt';
import {
  createHash,
  randomBytes,
  randomUUID,
  timingSafeEqual,
} from 'node:crypto';
import { isIP } from 'node:net';
import { AuthSessionClientType } from '../../generated/prisma/enums';
import { UsersService } from '../users/users.service';
import { UserSessionsService } from '../users/user-sessions.service';
import { OtpService } from './otp.service';
import { OtpChallengeDto } from './dto/otp.dto';
import { LoginDto } from './dto/login.dto';
import { LoginResponseDto } from './dto/login-response.dto';
import { RegisterDto } from './dto/register.dto';
import { SESSION_ID_PATTERN } from './constants/token.constant';

export interface AuthenticationTokens extends LoginResponseDto {
  refreshToken: string;
  clientType: AuthSessionClientType;
}

export interface SessionMetadata {
  ip?: string;
  userAgent?: string;
}

@Injectable()
export class AuthenticationService {
  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    private readonly otpService: OtpService,
    private readonly sessions: UserSessionsService,
  ) {}

  async login(
    input: LoginDto,
    metadata: SessionMetadata = {},
  ): Promise<AuthenticationTokens> {
    const user = await this.usersService.findForAuthentication(input);
    if (
      !user?.passwordHash ||
      !this.usersService.isAllowedToAuthenticate(user)
    ) {
      throw new UnauthorizedException('Invalid credentials');
    }
    const isPasswordValid = await compare(input.password, user.passwordHash);
    if (!isPasswordValid)
      throw new UnauthorizedException('Invalid credentials');
    return this.usersService.withLockedAccount(user.id, async (tx) => {
      const current = await tx.user.findUnique({
        where: { id: user.id },
        include: { role: true },
      });
      if (
        !current ||
        !this.usersService.isAllowedToAuthenticate(current) ||
        current.passwordHash !== user.passwordHash ||
        (current.passwordChangedAt?.toISOString() ?? null) !==
          (user.passwordChangedAt?.toISOString() ?? null)
      ) {
        throw new UnauthorizedException('Invalid credentials');
      }
      const id = randomUUID();
      const expiresAt = new Date(
        Date.now() +
          this.configService.getOrThrow<number>('jwt.refreshExpiresInSeconds') *
            1000,
      );
      const tokens = await this.issueTokens(
        current,
        id,
        expiresAt,
        input.clientType,
      );
      await this.sessions.create(tx, {
        id,
        userId: current.id,
        refreshTokenHash: this.tokenHash(tokens.refreshToken),
        clientType: input.clientType,
        deviceName: input.deviceName,
        userAgent: metadata.userAgent?.slice(0, 4096),
        ipAddress: metadata.ip && isIP(metadata.ip) ? metadata.ip : null,
        expiresAt,
      });
      return tokens;
    });
  }

  private tokenHash(token: string): string {
    return createHash('sha256').update(token).digest('hex');
  }

  private async issueTokens(
    user: { id: string; passwordChangedAt: Date | null },
    sessionId: string,
    expiresAt: Date,
    clientType: AuthSessionClientType,
  ): Promise<AuthenticationTokens> {
    const refreshExpiresIn = Math.floor(
      (expiresAt.getTime() - Date.now()) / 1000,
    );
    const expiresIn = Math.min(
      this.configService.getOrThrow<number>('jwt.expiresInSeconds'),
      refreshExpiresIn,
    );
    if (expiresIn < 1)
      throw new UnauthorizedException('Invalid or expired session');
    const claims = {
      sub: user.id,
      sid: sessionId,
      cv: user.passwordChangedAt?.toISOString() ?? null,
    };
    const [accessToken, refreshToken] = await Promise.all([
      this.jwtService.signAsync(
        { ...claims, tokenUse: 'ACCESS', jti: randomUUID() },
        { expiresIn },
      ),
      this.jwtService.signAsync(
        {
          ...claims,
          tokenUse: 'REFRESH',
          jti: randomBytes(32).toString('hex'),
        },
        {
          audience: this.configService.getOrThrow<string>(
            'jwt.refreshAudience',
          ),
          expiresIn: refreshExpiresIn,
        },
      ),
    ]);
    return {
      accessToken,
      refreshToken,
      tokenType: 'Bearer',
      expiresIn,
      refreshExpiresIn,
      sessionId,
      clientType,
    };
  }

  private async verifyRefreshToken(
    token: string,
  ): Promise<{ sub: string; sid: string; cv: unknown }> {
    try {
      const payload = await this.jwtService.verifyAsync<
        Record<string, unknown>
      >(token, {
        audience: this.configService.getOrThrow<string>('jwt.refreshAudience'),
      });
      if (
        payload.tokenUse !== 'REFRESH' ||
        typeof payload.sub !== 'string' ||
        !payload.sub ||
        typeof payload.sid !== 'string' ||
        !SESSION_ID_PATTERN.test(payload.sid) ||
        typeof payload.jti !== 'string' ||
        !/^[a-f0-9]{64}$/.test(payload.jti) ||
        !Number.isInteger(payload.iat) ||
        !Number.isInteger(payload.exp)
      ) {
        throw new Error('Invalid claims');
      }
      return { sub: payload.sub, sid: payload.sid, cv: payload.cv };
    } catch {
      throw new UnauthorizedException('Invalid or expired refresh token');
    }
  }

  async refresh(token: string): Promise<AuthenticationTokens> {
    const payload = await this.verifyRefreshToken(token);
    const actualHash = this.tokenHash(token);
    const result = await this.usersService.withLockedAccount(
      payload.sub,
      async (tx) => {
        const user = await tx.user.findUnique({
          where: { id: payload.sub },
          include: { role: true },
        });
        const session = await this.sessions.findById(tx, payload.sid);
        if (
          !user ||
          !this.usersService.isAllowedToAuthenticate(user) ||
          (user.passwordChangedAt?.toISOString() ?? null) !== payload.cv ||
          !session ||
          session.userId !== user.id ||
          session.revokedAt ||
          session.expiresAt.getTime() <= Date.now()
        )
          return null;
        const stored = Buffer.from(session.refreshTokenHash, 'hex');
        const actual = Buffer.from(actualHash, 'hex');
        if (
          stored.length !== actual.length ||
          !timingSafeEqual(stored, actual)
        ) {
          // Return after the transaction commits so reuse revocation is not rolled back by a 401.
          await this.sessions.revoke(
            tx,
            user.id,
            'REFRESH_TOKEN_REUSE',
            session.id,
          );
          return null;
        }
        const tokens = await this.issueTokens(
          user,
          session.id,
          session.expiresAt,
          session.clientType,
        );
        const updated = await this.sessions.rotate(
          tx,
          session.id,
          actualHash,
          this.tokenHash(tokens.refreshToken),
        );
        if (updated.count !== 1) return null;
        return tokens;
      },
    );
    if (!result)
      throw new UnauthorizedException('Invalid or expired refresh token');
    return result;
  }

  listSessions(userId: string, currentId: string) {
    return this.sessions.listActive(userId, currentId);
  }

  async logout(userId: string, id?: string): Promise<{ message: string }> {
    await this.usersService.withLockedAccount(userId, (tx) =>
      this.sessions.revoke(tx, userId, id ? 'LOGOUT' : 'LOGOUT_ALL', id),
    );
    return { message: id ? 'Signed out' : 'Signed out from all devices' };
  }

  async revokeSession(
    userId: string,
    id: string,
  ): Promise<{ message: string }> {
    await this.usersService.withLockedAccount(userId, async (tx) => {
      const session = await this.sessions.findById(tx, id);
      if (!session || session.userId !== userId)
        throw new NotFoundException('Session not found');
      await this.sessions.revoke(tx, userId, 'USER_REVOKED', id);
    });
    return { message: 'Session revoked' };
  }

  async register(input: RegisterDto, ip = 'UNKNOWN'): Promise<OtpChallengeDto> {
    if (await this.usersService.findForAuthentication(input)) {
      throw new ConflictException('Account already exists');
    }
    await this.otpService.assertCanSend(input, ip);
    const passwordHash = await hash(input.password, 12);
    const user = await this.usersService.createPatient({
      name: input.name,
      email: input.email,
      phone: input.phone,
      passwordHash,
    });
    return this.otpService.send(input, 'REGISTER', user.id, ip);
  }
}
