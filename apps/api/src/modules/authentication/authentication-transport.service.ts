import {
  ForbiddenException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { CookieOptions, Request, Response } from 'express';
import { AuthSessionClientType } from '../../generated/prisma/enums';
import type { AuthenticationTokens } from './authentication.service';
import type { LoginResponseDto } from './dto/login-response.dto';
import type { RefreshTokenDto } from './dto/refresh-token.dto';

@Injectable()
export class AuthenticationTransportService {
  constructor(private readonly configService: ConfigService) {}

  assertAllowedOrigin(request: Request, isRequired = false): void {
    const origin = request.get('origin');
    const origins = this.configService.getOrThrow<string[]>(
      'authentication.corsOrigins',
    );
    if ((!origin && isRequired) || (origin && !origins.includes(origin))) {
      throw new ForbiddenException('Origin is not allowed');
    }
  }

  private cookieOptions(path: string): CookieOptions {
    return {
      httpOnly: true,
      secure: this.configService.getOrThrow<boolean>(
        'authentication.isCookieSecure',
      ),
      sameSite: this.configService.getOrThrow<'lax' | 'strict' | 'none'>(
        'authentication.cookieSameSite',
      ),
      path,
    };
  }

  setTokens(
    response: Response,
    tokens: AuthenticationTokens,
  ): LoginResponseDto {
    if (tokens.clientType === AuthSessionClientType.WEB) {
      response.cookie(
        this.configService.getOrThrow<string>('authentication.cookieName'),
        tokens.accessToken,
        {
          ...this.cookieOptions('/api/v1'),
          maxAge: tokens.expiresIn * 1000,
        },
      );
      response.cookie(
        this.configService.getOrThrow<string>(
          'authentication.refreshCookieName',
        ),
        tokens.refreshToken,
        {
          ...this.cookieOptions('/api/v1/authentication'),
          maxAge: tokens.refreshExpiresIn * 1000,
        },
      );
    }
    return {
      accessToken: tokens.accessToken,
      tokenType: tokens.tokenType,
      expiresIn: tokens.expiresIn,
      sessionId: tokens.sessionId,
      refreshExpiresIn: tokens.refreshExpiresIn,
      ...(tokens.clientType === AuthSessionClientType.MOBILE
        ? { refreshToken: tokens.refreshToken }
        : {}),
    };
  }

  readRefreshToken(request: Request, input: RefreshTokenDto): string {
    if (typeof input.refreshToken === 'string') {
      this.assertAllowedOrigin(request);
      return input.refreshToken;
    }
    const cookies: unknown = request.cookies;
    const name = this.configService.getOrThrow<string>(
      'authentication.refreshCookieName',
    );
    const token =
      cookies && typeof cookies === 'object'
        ? (cookies as Record<string, unknown>)[name]
        : undefined;
    if (typeof token !== 'string' || !token)
      throw new UnauthorizedException('Refresh token required');
    this.assertAllowedOrigin(request, true);
    return token;
  }

  clearTokens(response: Response): void {
    response.clearCookie(
      this.configService.getOrThrow<string>('authentication.cookieName'),
      this.cookieOptions('/api/v1'),
    );
    response.clearCookie(
      this.configService.getOrThrow<string>('authentication.refreshCookieName'),
      this.cookieOptions('/api/v1/authentication'),
    );
  }
}
