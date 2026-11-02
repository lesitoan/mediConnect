import { BadRequestException } from '@nestjs/common';

const CLINIC_TIME_ZONE = 'Asia/Ho_Chi_Minh';

export function clinicDateString(value: Date = new Date()): string {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: CLINIC_TIME_ZONE,
  }).format(value);
}

export function clinicDate(value?: string): Date {
  const dateValue = value ?? clinicDateString();
  if (!/^\d{4}-\d{2}-\d{2}$/.test(dateValue))
    throw new BadRequestException('Ngày hàng chờ không hợp lệ.');
  const date = new Date(`${dateValue}T00:00:00.000Z`);
  if (!Number.isFinite(date.getTime()) || clinicDateString(date) !== dateValue)
    throw new BadRequestException('Ngày hàng chờ không hợp lệ.');
  return date;
}
