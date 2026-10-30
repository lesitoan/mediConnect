export function normalizePhone(value: unknown): unknown {
  if (typeof value !== 'string') return value;
  const phone = value.trim().replace(/[ -]/g, '');
  if (phone.startsWith('0')) return '+84' + phone.slice(1);
  return phone.startsWith('84') ? '+' + phone : phone;
}
