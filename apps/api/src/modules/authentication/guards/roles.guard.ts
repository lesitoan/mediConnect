import {
  ForbiddenException,
  Injectable,
  UnauthorizedException,
  type CanActivate,
  type ExecutionContext,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import type { AuthenticatedRequest } from '../../../common/interfaces/authenticated-request.interface';
import {
  PUBLIC_ROUTE_KEY,
  ROLES_KEY,
} from '../constants/authentication.constant';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const targets = [context.getHandler(), context.getClass()];
    if (this.reflector.getAllAndOverride<boolean>(PUBLIC_ROUTE_KEY, targets))
      return true;
    const roles = this.reflector.getAllAndOverride<string[]>(
      ROLES_KEY,
      targets,
    );
    if (roles === undefined) return true;
    const user = context.switchToHttp().getRequest<AuthenticatedRequest>().user;
    if (!user) throw new UnauthorizedException();
    if (!roles.includes(user.role))
      throw new ForbiddenException('Role is not allowed');
    return true;
  }
}
