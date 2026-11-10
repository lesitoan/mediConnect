export function csvCell(value: string | Date | null): string {
  let text = value instanceof Date ? value.toISOString() : (value ?? '');
  text = Array.from(text)
    .filter((char) => char.charCodeAt(0) >= 32 || /\s/.test(char))
    .join('');
  if (/^\s*[=+\-@]/.test(text)) text = `'${text}`;
  return `"${text.replace(/"/g, '""')}"`;
}
