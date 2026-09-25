'use server';

import { activationCodes, liveActivationCode } from '@xangarro/data-pg';
import { eq } from 'drizzle-orm';
import QRCode from 'qrcode';

import {
  hashPairingToken,
  mintPairingToken,
  pairingExpiry,
  pairingLink,
} from '../../lib/pairing-token';
import { failure } from '../action-errors';
import { requireMember } from '../auth';
import { portalOrigin } from '../billing/origin';
import { withTenant } from '../db';

/**
 * «Mostrar QR» — a scannable pairing link for the live code (C-14, P-06).
 *
 * Mints a fresh 128-bit token on the business's live code and stores only its
 * hash, replacing any earlier one, so the QR on screen is the only one that
 * works. It lives 15 minutes (never past the code) and dies with the code when
 * «Generar otro» expires it. Admins only, like «Generar código».
 *
 * The token is in the link's fragment (`/activar#c=…`); the image is an SVG
 * data URI rendered here, so no third-party QR service ever sees the link.
 */
export type QrResult =
  | { ok: true; link: string; svgDataUri: string; expiresAt: string }
  | { ok: false; message: string };

const SIN_CODIGO = 'Primero genera un código de vinculación.';

export async function generarQr(): Promise<QrResult> {
  try {
    const session = await requireMember('admin');
    const now = new Date();
    const token = mintPairingToken();
    const minted = await withTenant(session.business_id, async (tx) => {
      const live = await liveActivationCode(tx);
      if (live === null) return null;
      const expiresAt = pairingExpiry(now, live.expiresAt);
      await tx
        .update(activationCodes)
        .set({
          qrTokenHash: hashPairingToken(token),
          qrExpiresAt: expiresAt,
          updatedAt: now.toISOString(),
        })
        .where(eq(activationCodes.code, live.code));
      return { expiresAt };
    });
    if (minted === null) return { ok: false, message: SIN_CODIGO };
    const link = pairingLink(await portalOrigin(), token);
    const svg = await QRCode.toString(link, { type: 'svg', margin: 1, errorCorrectionLevel: 'M' });
    const svgDataUri = `data:image/svg+xml;base64,${Buffer.from(svg).toString('base64')}`;
    return { ok: true, link, svgDataUri, expiresAt: minted.expiresAt };
  } catch (error) {
    return failure(error, 'generarQr', { retry: 'No pudimos generar el QR. Intenta de nuevo.' });
  }
}
