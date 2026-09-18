import 'server-only';

import type { FailurePolicy } from '@xangarro/data-pg';

/**
 * Every throttle the portal applies, in one place (B-17; audit SEC-AUTH-02,
 * SEC-DEV-01). Times are seconds.
 *
 * Per-subject limits are the tight ones (5 wrong passwords for one address,
 * 5 wrong tries at one code). Per-IP limits catch spraying many subjects from
 * one place; for sign-in that one is looser, because a shop's staff and its
 * contador can share an office IP.
 */
const FIFTEEN_MINUTES = 15 * 60;

export const LOGIN_PER_EMAIL: FailurePolicy = {
  max: 5,
  window: FIFTEEN_MINUTES,
  lockout: FIFTEEN_MINUTES,
};
export const LOGIN_PER_IP: FailurePolicy = {
  max: 20,
  window: FIFTEEN_MINUTES,
  lockout: FIFTEEN_MINUTES,
};
export const ACTIVATE_PER_IP: FailurePolicy = {
  max: 5,
  window: FIFTEEN_MINUTES,
  lockout: FIFTEEN_MINUTES,
};
export const ACTIVATE_PER_CODE: FailurePolicy = {
  max: 5,
  window: FIFTEEN_MINUTES,
  lockout: FIFTEEN_MINUTES,
};

/** Device API calls per device per minute (B-17). */
export const DEVICE_CALLS_PER_MINUTE = 60;

/**
 * The caller's IP. Behind Vercel the first `x-forwarded-for` entry is the
 * client, written by the platform; anywhere without a trusted proxy in front
 * this header is caller-controlled, so it must not be deployed that way.
 */
export function clientIp(headers: Headers): string {
  return headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown';
}

export const minutes = (seconds: number): number => Math.max(1, Math.ceil(seconds / 60));
