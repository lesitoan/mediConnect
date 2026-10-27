import { Auth } from './auth.decorator';

export const AuthPermission = (...permissions: string[]) =>
  Auth({ permissions });
