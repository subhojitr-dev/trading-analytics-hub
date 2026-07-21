import { createHmac, timingSafeEqual } from 'crypto';

export const AUTH_COOKIE_NAME = 'ta_auth';
const COOKIE_PAYLOAD = 'ok';

function sign(value: string, secret: string): string {
  return createHmac('sha256', secret).update(value).digest('hex');
}

export function makeAuthCookieValue(secret: string): string {
  return `${COOKIE_PAYLOAD}.${sign(COOKIE_PAYLOAD, secret)}`;
}

export function verifyAuthCookieValue(cookieValue: string | undefined, secret: string): boolean {
  if (!cookieValue) return false;
  const [value, signature] = cookieValue.split('.');
  if (!value || !signature) return false;
  const expected = sign(value, secret);
  const a = Buffer.from(signature);
  const b = Buffer.from(expected);
  if (a.length !== b.length) return false;
  return timingSafeEqual(a, b);
}

export function verifyPassword(candidate: string, expected: string): boolean {
  const a = Buffer.from(candidate);
  const b = Buffer.from(expected);
  if (a.length !== b.length) return false;
  return timingSafeEqual(a, b);
}
