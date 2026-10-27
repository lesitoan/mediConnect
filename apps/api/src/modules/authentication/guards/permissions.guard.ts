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
  PERMISSIONS_KEY,
  PUBLIC_ROUTE_KEY,
} from '../constants/authentication.constant';

@Injectable()
export class PermissionsGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const targets = [context.getHandler(), context.getClass()];
    if (this.reflector.getAllAndOverride<boolean>(PUBLIC_ROUTE_KEY, targets))
      return true;
    const permissions = this.reflector.getAllAndOverride<string[]>(
      PERMISSIONS_KEY,
      targets,
    );
    if (permissions === undefined) return true;
    const user = context.switchToHttp().getRequest<AuthenticatedRequest>().user;
    if (!user) throw new UnauthorizedException();
    if (
      permissions.length === 0 ||
      !permissions.every((permission) => user.permissions.includes(permission))
    ) {
      throw new ForbiddenException('Permission is not granted');
    }
    return true;
  }
}
