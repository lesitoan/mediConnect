import { applyDecorators, SetMetadata } from '@nestjs/common';
import { ROLES_KEY } from '../constants/authentication.constant';
import { Auth } from './auth.decorator';

export const AuthRole = (...roles: string[]) =>
  applyDecorators(Auth(), SetMetadata(ROLES_KEY, roles));
