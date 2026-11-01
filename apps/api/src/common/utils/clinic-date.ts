import { BadRequestException } from '@nestjs/common';

const CLINIC_TIME_ZONE = 'Asia/Ho_Chi_Minh';

export function clinicDateString(value: Date): string {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: CLINIC_TIME_ZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(value);
  const values = Object.fromEntries(
    parts
      .filter(({ type }) => type !== 'literal')
      .map(({ type, value: partValue }) => [type, partValue]),
  );
  return `${values.year}-${values.month}-${values.day}`;
}

export function clinicDate(value?: string): Date {
  const dateValue = value ?? clinicDateString(new Date());
  if (!/^\d{4}-\d{2}-\d{2}$/.test(dateValue))
    throw new BadRequestException('Ngày hàng chờ không hợp lệ.');
  const date = new Date(`${dateValue}T00:00:00+07:00`);
  if (!Number.isFinite(date.getTime()) || clinicDateString(date) !== dateValue)
    throw new BadRequestException('Ngày hàng chờ không hợp lệ.');
  return date;
}
