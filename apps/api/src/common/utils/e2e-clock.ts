const LOCAL_DATABASE_HOSTS = new Set([
  'localhost',
  '127.0.0.1',
  '::1',
  '[::1]',
]);
const E2E_NOW_PATTERN =
  /^[0-9]{4}-[0-9]{2}-[0-9]{2}T[0-9]{2}:[0-9]{2}:[0-9]{2}(?:\.[0-9]+)?\+07:00$/;

function getConfiguredE2ENow(): Date | null {
  const value = process.env.E2E_NOW;
  if (!value) return null;
  if (process.env.NODE_ENV === 'production')
    throw new Error('E2E_NOW cannot be used in production.');

  const databaseUrl = process.env.DATABASE_URL;
  if (databaseUrl) {
    const hostname = new URL(databaseUrl).hostname;
    if (!LOCAL_DATABASE_HOSTS.has(hostname))
      throw new Error('E2E_NOW can only be used with a local database.');
  }

  if (!E2E_NOW_PATTERN.test(value))
    throw new Error('E2E_NOW must be an ISO datetime with the +07:00 offset.');
  const timestamp = Date.parse(value);
  if (!Number.isFinite(timestamp))
    throw new Error('E2E_NOW must be a valid ISO datetime.');
  return new Date(timestamp);
}

export function getCurrentTime(): Date {
  return getConfiguredE2ENow() ?? new Date();
}

export function requireE2EClock(): Date {
  const currentTime = getConfiguredE2ENow();
  if (!currentTime)
    throw new Error('E2E_NOW is required to seed deterministic E2E data.');
  return currentTime;
}
