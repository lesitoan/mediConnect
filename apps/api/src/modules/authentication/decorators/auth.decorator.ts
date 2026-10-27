import { applyDecorators, SetMetadata } from '@nestjs/common';
import { ApiBearerAuth, ApiCookieAuth } from '@nestjs/swagger';
import {
  PERMISSIONS_KEY,
  PUBLIC_ROUTE_KEY,
  ROLES_KEY,
} from '../constants/authentication.constant';

export interface AuthOptions {
  roles?: readonly string[];
  permissions?: readonly string[];
}

export const Auth = ({ roles, permissions }: AuthOptions = {}) =>
  applyDecorators(
    SetMetadata(PUBLIC_ROUTE_KEY, false),
    ...(roles === undefined ? [] : [SetMetadata(ROLES_KEY, [...roles])]),
    ...(permissions === undefined
      ? []
      : [SetMetadata(PERMISSIONS_KEY, [...permissions])]),
    ApiBearerAuth(),
    ApiCookieAuth('accessToken'),
  );
