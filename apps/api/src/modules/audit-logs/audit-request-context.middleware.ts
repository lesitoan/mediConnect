import { AsyncLocalStorage } from 'node:async_hooks';
import { randomUUID } from 'node:crypto';
import { isIP } from 'node:net';
import { isUUID } from 'class-validator';
import type { NextFunction, Response } from 'express';
import type { AuthenticatedRequest } from '../../common/interfaces/authenticated-request.interface';

export const auditRequestContext =
  new AsyncLocalStorage<AuthenticatedRequest>();

export function auditRequestContextMiddleware(
  request: AuthenticatedRequest,
  _response: Response,
  next: NextFunction,
): void {
  request.id ||= randomUUID();
  auditRequestContext.run(request, next);
}

function text(value: string | undefined, maxLength: number): string | null {
  return (
    Array.from(value ?? '')
      .filter((character) => {
        const code = character.charCodeAt(0);
        return code >= 32 && code !== 127;
      })
      .join('')
      .slice(0, maxLength) || null
  );
}

export function getAuditRequestInfo() {
  const request = auditRequestContext.getStore();
  if (!request) return {};
  const route = request.route as { path?: unknown } | undefined;
  return {
    ipAddress: request.ip && isIP(request.ip) ? request.ip : null,
    userAgent: text(request.get('user-agent'), 1000),
    requestId: text(
      typeof request.id === 'string' || typeof request.id === 'number'
        ? String(request.id)
        : undefined,
      100,
    ),
    sessionId:
      request.sessionId && isUUID(request.sessionId, '4')
        ? request.sessionId
        : null,
    method: text(request.method, 10),
    path:
      typeof route?.path === 'string'
        ? text(request.baseUrl + route.path, 500)
        : null,
  };
}
