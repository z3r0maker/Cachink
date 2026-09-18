import type { FailurePolicy } from './throttle.js';

/**
 * Every throttle limit, in one place (B-17; audit SEC-AUTH-02, SEC-DEV-01).
 * Times are seconds. Lifted verbatim from the portal's
 * `server/throttle-policy.ts`; the TOTP limit is the admin console's (N-05).
 *
 * Per-subject limits are the tight ones (5 wrong passwords for one address,
 * 5 wrong tries at one code). Per-IP limits catch spraying many subjects from
 * one place; for sign-in that one is looser, because a shop's staff and its
 * contador can share an office IP.
 */
const FIFTEEN_MINUTES = 15 * 60;

const tight: FailurePolicy = { max: 5, window: FIFTEEN_MINUTES, lockout: FIFTEEN_MINUTES };

export const LOGIN_PER_EMAIL: FailurePolicy = tight;
export const LOGIN_PER_IP: FailurePolicy = {
  max: 20,
  window: FIFTEEN_MINUTES,
  lockout: FIFTEEN_MINUTES,
};
export const ACTIVATE_PER_IP: FailurePolicy = tight;
export const ACTIVATE_PER_CODE: FailurePolicy = tight;
/** Wrong second-factor codes (TOTP or recovery) for one account. */
export const TOTP_PER_ACCOUNT: FailurePolicy = tight;

/** Device API calls per device per minute (B-17). */
export const DEVICE_CALLS_PER_MINUTE = 60;

/**
 * The caller's IP. Behind Vercel the first `x-forwarded-for` entry is the
 * client, written by the platform; anywhere without a trusted proxy in front
 * this header is caller-controlled, so it must not be deployed that way.
 */
export function clientIp(headers: Pick<Headers, 'get'>): string {
  return headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown';
}

/** A wait in seconds as whole minutes for a message, never less than 1. */
export const minutes = (seconds: number): number => Math.max(1, Math.ceil(seconds / 60));
