/**
 * `POST /activate/preview` (N-25, SEC-MOB-04): «¿Es tu negocio?» before a
 * scanned phone links.
 *
 * The phone sends the pairing token it read and gets back only what lets the
 * person holding it recognise the business: its name and the owner's first
 * name and email. Nothing is consumed or extended: the same token still
 * redeems with `POST /activate` afterwards, inside its own 15 minutes.
 *
 * POST, not GET with the token in the query: the token stays out of URLs and
 * logs, as its fragment-only link intends (C-14). The refusals are the scan
 * path's own (`PREVIEW_ERROR_CODES`), so the phone shows the same sentence it
 * would have shown on redeeming.
 */

import { z } from 'zod';
import { PairingTokenSchema } from './activate.js';

export const ActivatePreviewRequestSchema = z.object({ qrToken: PairingTokenSchema });
export type ActivatePreviewRequest = z.infer<typeof ActivatePreviewRequestSchema>;

/**
 * Strict on purpose: an extra field is a leak, so a server (or the mock) that
 * starts sending one fails the phone's parse and the conformance suite.
 */
export const ActivatePreviewResponseSchema = z.strictObject({
  businessName: z.string().min(1).max(200),
  /** The owner's first name; null when the account never set one. */
  ownerFirstName: z.string().min(1).max(80).nullable(),
  /** The owner's email; null only for a business with no owner account. */
  ownerEmail: z.email().nullable(),
});
export type ActivatePreviewResponse = z.infer<typeof ActivatePreviewResponseSchema>;

/** What the preview may answer besides 200: the scan path's refusals, and nothing else. */
export const PREVIEW_ERROR_CODES = [
  'CODE_INVALID',
  'CODE_EXPIRED',
  'CODE_USED',
  'BUSINESS_SUSPENDED',
] as const;
export type PreviewErrorCode = (typeof PREVIEW_ERROR_CODES)[number];
