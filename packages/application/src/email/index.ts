/**
 * `@xangarro/application/email` — the transactional-email port (B-14) and the
 * use cases that send through it.
 *
 * A subpath of its own, not the root barrel: only the portal and the admin
 * console send email, and the phone bundle never needs it. Templates and the
 * Resend / dev-outbox adapters live in `@xangarro/email`.
 */
export * from './errors.js';
export * from './message.js';
export * from './retry.js';
export * from './in-memory.js';
export * from './trial-selection.js';
export * from './send-trial-reminders.js';
export * from './notify-usage-threshold.js';
