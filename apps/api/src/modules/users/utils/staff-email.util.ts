import { BadRequestException } from '@nestjs/common';

export const STAFF_EMAIL_DOMAIN = 'example.invalid';

export function staffEmailName(fullName: string): string {
  const name = fullName
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[đĐ]/g, 'd')
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '');
  if (!name || name.length > 64)
    throw new BadRequestException(
      'Họ tên phải tạo được tên email từ 1 đến 64 ký tự Latin hoặc chữ số.',
    );
  return name;
}
