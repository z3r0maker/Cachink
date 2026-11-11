/**
 * Every lifetime and limit of N-83 (ADR-142), in one place. The wrong-code
 * limits are `@xangarro/auth-core`'s policies; these are the portal's own.
 */

/** The emailed confirmation link (owner decision, 2026-11-10). Shown in the email and on screen. */
export const CONFIRM_TTL_HOURS = 24;
/** The signup browser's pass lasts as long as the link it waits for. */
export const PENDING_TTL_SECONDS = CONFIRM_TTL_HOURS * 60 * 60;
/** Between the password and the second factor. */
export const CHALLENGE_TTL_SECONDS = 10 * 60;
/** The reset link minted when a sign-in link claims an unconfirmed account (ADR-080's 30 minutes). */
export const RESET_TTL_SECONDS = 30 * 60;
/** One code unlocks operators, cajas and billing for this long (owner decision, 2026-11-10). */
export const STEP_UP_SECONDS = 15 * 60;

/** Confirmation emails per address, and corrections per account, in `MAIL_WINDOW_SECONDS`. */
export const MAIL_PER_EMAIL = 3;
export const CORRECTIONS_PER_ACCOUNT = 5;
export const MAIL_WINDOW_SECONDS = 15 * 60;

/** The name an authenticator app lists the portal under. */
export const TOTP_ISSUER = 'Xangarro';
