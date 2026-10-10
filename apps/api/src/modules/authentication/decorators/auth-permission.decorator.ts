import { applyDecorators, SetMetadata } from '@nestjs/common';
import { PERMISSIONS_KEY } from '../constants/authentication.constant';
import { Auth } from './auth.decorator';

export const AuthPermission = (...permissions: string[]) =>
  applyDecorators(Auth(), SetMetadata(PERMISSIONS_KEY, permissions));
