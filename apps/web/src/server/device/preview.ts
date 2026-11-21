import 'server-only';

import { ActivatePreviewResponseSchema, type ActivatePreviewResponse } from '@xangarro/contracts';
import { previewPairingToken, type PairingPreviewRefusal } from '@xangarro/data-pg';

import { hashPairingToken } from '../../lib/pairing-token';
import { rlsBoundDb } from '../db';

/**
 * «¿Es tu negocio?» (N-25, SEC-MOB-04): which business a scanned pairing
 * token would link a phone to, with nothing consumed or extended.
 *
 * Deliberately outside `withTenant`, like the redeem's claim: there is no
 * tenant until the token is redeemed, and the token is the credential. The
 * one SECURITY DEFINER function it calls (0062) reads by the token's hash and
 * returns only the business's name and the owner's first name and email; the
 * response is parsed against the strict contract before it leaves, so a
 * column added there later cannot ride along.
 */
export type PreviewOutcome =
  | { readonly ok: true; readonly preview: ActivatePreviewResponse }
  | { readonly ok: false; readonly refusal: PairingPreviewRefusal };

export async function previewPairing(qrToken: string): Promise<PreviewOutcome> {
  const found = await previewPairingToken(await rlsBoundDb(), hashPairingToken(qrToken));
  if (!found.ok) return found;
  const preview = ActivatePreviewResponseSchema.parse({
    businessName: found.businessName,
    ownerFirstName: found.ownerFirstName,
    ownerEmail: found.ownerEmail,
  });
  return { ok: true, preview };
}
