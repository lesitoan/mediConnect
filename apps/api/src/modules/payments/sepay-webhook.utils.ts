import { BadRequestException, UnauthorizedException } from '@nestjs/common';
import { createHmac, timingSafeEqual } from 'node:crypto';
import { Prisma } from '../../generated/prisma/client';

export function verifySepaySignature(
  raw: Buffer | undefined,
  signature: string | undefined,
  timestamp: string | undefined,
  secret: string,
) {
  if (
    !raw ||
    !signature ||
    !timestamp ||
    !/^\d{10}$/.test(timestamp) ||
    !/^sha256=[a-fA-F0-9]{64}$/.test(signature) ||
    Math.abs(Date.now() / 1000 - Number(timestamp)) > 300
  )
    throw new UnauthorizedException('Invalid or expired SePay signature');
  const expected = createHmac('sha256', secret)
    .update(timestamp + '.')
    .update(raw)
    .digest();
  if (!timingSafeEqual(expected, Buffer.from(signature.slice(7), 'hex')))
    throw new UnauthorizedException('Invalid SePay signature');
}

export function parseSepayPayload(raw: Buffer) {
  let data: unknown;
  try {
    data = JSON.parse(raw.toString('utf8')) as unknown;
  } catch {
    throw new BadRequestException('Invalid webhook JSON');
  }
  if (!data || typeof data !== 'object' || Array.isArray(data))
    throw new BadRequestException('Invalid webhook payload');
  const p = data as Record<string, unknown>;
  const string = (name: string, max: number) => {
    const value = p[name];
    if (typeof value !== 'string' || !value.length || value.length > max)
      throw new BadRequestException(`Invalid webhook ${name}`);
    return value;
  };
  if (
    !Number.isSafeInteger(p.id) ||
    Number(p.id) <= 0 ||
    !Number.isSafeInteger(p.transferAmount) ||
    Number(p.transferAmount) <= 0 ||
    Number(p.transferAmount) > 999999999999
  )
    throw new BadRequestException('Invalid webhook id or amount');
  const transferType = string('transferType', 3);
  if (!['in', 'out'].includes(transferType))
    throw new BadRequestException('Invalid transferType');
  const date = string('transactionDate', 19);
  const occurredAt = new Date(date.replace(' ', 'T') + '+07:00');
  if (
    !/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/.test(date) ||
    Number.isNaN(occurredAt.getTime()) ||
    new Date(occurredAt.getTime() + 7 * 3600000)
      .toISOString()
      .slice(0, 19)
      .replace('T', ' ') !== date
  )
    throw new BadRequestException('Invalid webhook transactionDate');
  if (
    p.code !== undefined &&
    p.code !== null &&
    (typeof p.code !== 'string' || p.code.length > 100)
  )
    throw new BadRequestException('Invalid webhook code');
  return {
    id: String(p.id),
    gateway: string('gateway', 100),
    accountNumber: string('accountNumber', 60),
    content: string('content', 10000),
    code: typeof p.code === 'string' ? p.code : null,
    transferType,
    amount: new Prisma.Decimal(Number(p.transferAmount)),
    occurredAt,
    payload: p as Prisma.InputJsonObject,
  };
}

export function extractInvoiceCode(
  code: string | null,
  content: string,
): string | null {
  const matches = new Set(
    content.toUpperCase().match(/(?<![A-Z0-9])MDC[A-F0-9]{24}(?![A-Z0-9])/g) ??
      [],
  );
  if (code) {
    const normalized = code.trim().toUpperCase();
    if (!/^MDC[A-F0-9]{24}$/.test(normalized)) return null;
    matches.add(normalized);
  }
  return matches.size === 1 ? [...matches][0] : null;
}
