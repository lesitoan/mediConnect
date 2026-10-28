export interface IJwtPayload {
  sub: string;
  sid: string;
  cv: string | null;
  tokenUse: 'ACCESS' | 'REFRESH';
  jti: string;
  iat: number;
  exp: number;
}
