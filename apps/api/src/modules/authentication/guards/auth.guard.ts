import {
  Injectable,
  UnauthorizedException,
  type CanActivate,
  type ExecutionContext,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Reflector } from '@nestjs/core';
import { JwtService } from '@nestjs/jwt';
import type { AuthenticatedRequest } from '../../../common/interfaces/authenticated-request.interface';
import { UsersService } from '../../users/users.service';
import { UserSessionsService } from '../../users/user-sessions.service';
import { SESSION_ID_PATTERN } from '../constants/token.constant';
import { PUBLIC_ROUTE_KEY } from '../constants/authentication.constant';
import { AuthenticationTransportService } from '../authentication-transport.service';

@Injectable()
export class AuthGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly jwtService: JwtService,
    private readonly usersService: UsersService,
    private readonly configService: ConfigService,
    private readonly transportService: AuthenticationTransportService,
    private readonly sessions: UserSessionsService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const isPublic = this.reflector.getAllAndOverride<boolean>(
      PUBLIC_ROUTE_KEY,
      [context.getHandler(), context.getClass()],
    );
    if (isPublic) return true;

    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();
    const authorization = request.get('authorization');
    let token: string;
    if (authorization !== undefined) {
      const match = /^Bearer ([^\s]+)$/i.exec(authorization);
      if (!match)
        throw new UnauthorizedException('Invalid authorization header');
      token = match[1];
    } else {
      const cookies: unknown = request.cookies;
      const cookieName = this.configService.getOrThrow<string>(
        'authentication.cookieName',
      );
      const cookie =
        cookies && typeof cookies === 'object'
          ? (cookies as Record<string, unknown>)[cookieName]
          : undefined;
      if (typeof cookie !== 'string' || !cookie)
        throw new UnauthorizedException('Authentication required');
      token = cookie;
      if (!['GET', 'HEAD', 'OPTIONS'].includes(request.method)) {
        this.transportService.assertAllowedOrigin(request, true);
      }
    }

    let payload: Record<string, unknown>;
    try {
      payload =
        await this.jwtService.verifyAsync<Record<string, unknown>>(token);
    } catch {
      throw new UnauthorizedException('Invalid or expired access token');
    }
    if (
      payload.tokenUse !== 'ACCESS' ||
      typeof payload.sid !== 'string' ||
      !SESSION_ID_PATTERN.test(payload.sid) ||
      typeof payload.sub !== 'string' ||
      !payload.sub ||
      typeof payload.iat !== 'number' ||
      !Number.isInteger(payload.iat) ||
      typeof payload.exp !== 'number' ||
      !Number.isInteger(payload.exp)
    ) {
      throw new UnauthorizedException('Invalid access token payload');
    }
    request.user = await this.usersService.getAuthenticatedUser(
      payload.sub,
      payload.iat,
      payload.cv,
    );
    await this.sessions.assertActive(payload.sid, payload.sub);
    request.sessionId = payload.sid;
    return true;
  }
}
