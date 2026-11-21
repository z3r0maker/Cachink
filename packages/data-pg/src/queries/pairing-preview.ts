/**
 * «¿Es tu negocio?» for a scanned pairing token (`xangarro.preview_pairing_token`,
 * 0062; N-25, SEC-MOB-04): the business a live token would link a phone to,
 * or the refusal redeeming it would get. Reads only; the token stays good.
 *
 * Takes the token's **hash**: the token itself never reaches the database.
 * Needs no tenant claim (the token is the credential), like the redeem.
 */

import { sql } from 'drizzle-orm';

import type { Db } from '../client.js';

type Conn = Db | Parameters<Parameters<Db['transaction']>[0]>[0];

export const PAIRING_PREVIEW_REFUSALS = [
  'CODE_INVALID',
  'CODE_EXPIRED',
  'CODE_USED',
  'BUSINESS_SUSPENDED',
] as const;
export type PairingPreviewRefusal = (typeof PAIRING_PREVIEW_REFUSALS)[number];

export type PairingPreview =
  | {
      readonly ok: true;
      readonly businessName: string;
      readonly ownerFirstName: string | null;
      readonly ownerEmail: string | null;
    }
  | { readonly ok: false; readonly refusal: PairingPreviewRefusal };

type Row = {
  outcome: unknown;
  business_name: unknown;
  owner_first_name: unknown;
  owner_email: unknown;
};

const text = (v: unknown): string | null => (typeof v === 'string' && v !== '' ? v : null);

function isRefusal(v: unknown): v is PairingPreviewRefusal {
  return (PAIRING_PREVIEW_REFUSALS as readonly unknown[]).includes(v);
}

/** Parsed, never asserted (§2.8): an outcome the function never returns reads as unknown. */
export function pairingPreviewOf(row: Row | undefined): PairingPreview {
  const name = text(row?.business_name);
  if (row?.outcome === 'OK' && name !== null) {
    return {
      ok: true,
      businessName: name,
      ownerFirstName: text(row.owner_first_name),
      ownerEmail: text(row.owner_email),
    };
  }
  return { ok: false, refusal: isRefusal(row?.outcome) ? row.outcome : 'CODE_INVALID' };
}

export async function previewPairingToken(tx: Conn, tokenHash: string): Promise<PairingPreview> {
  const rows = await tx.execute<Row>(
    sql`SELECT outcome, business_name, owner_first_name, owner_email
          FROM xangarro.preview_pairing_token(${tokenHash})`,
  );
  return pairingPreviewOf(rows[0]);
}
