/**
 * Error envelope shared by every `/api/v1/*` endpoint (docs/plan/02-contracts.md §1).
 *
 * The full per-endpoint catalog (`ERROR_CATALOG`, retryability, i18n keys)
 * lands in C-07; this module only fixes the envelope shape and the one rule
 * both sides already agree on: 5xx is retryable, 4xx is terminal, unless the
 * code says otherwise.
 */

import { z } from 'zod';

export const ErrorEnvelopeSchema = z.object({
  error: z.object({
    code: z.string().regex(/^[A-Z][A-Z0-9_]*$/, 'UPPER_SNAKE code'),
    message: z.string().min(1),
    details: z.unknown().optional(),
  }),
});
export type ErrorEnvelope = z.infer<typeof ErrorEnvelopeSchema>;

/** Codes that are retryable regardless of HTTP status (C-07 extends this). */
export const RETRYABLE_CODES: ReadonlySet<string> = new Set(['INTERNAL', 'RATE_LIMITED']);

/** Codes that are terminal regardless of HTTP status. */
export const TERMINAL_CODES: ReadonlySet<string> = new Set([
  'PROTOCOL_UNSUPPORTED',
  'DEVICE_REVOKED',
  'BUSINESS_MISMATCH',
]);

export function isRetryableError(code: string, httpStatus: number): boolean {
  if (TERMINAL_CODES.has(code)) return false;
  if (RETRYABLE_CODES.has(code)) return true;
  return httpStatus >= 500;
}
