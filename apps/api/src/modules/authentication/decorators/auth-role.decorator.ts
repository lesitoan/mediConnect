import { Auth } from './auth.decorator';

export const AuthRole = (...roles: string[]) => Auth({ roles });
