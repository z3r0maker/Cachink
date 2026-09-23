/**
 * Consent records for the aviso de privacidad (N-34, audit PRIV-REG-01).
 *
 * One row per purpose per act: append-only, never updated. The record ties the
 * titular's act to the exact text they saw — a version label and the SHA-256 of
 * that text — because a hash of a text nobody archived proves nothing and a
 * version without a hash can be quietly re-edited.
 *
 * The legal shape (LFPDPPP 2025, art. 7): consent is **tácito** by default —
 * aviso shown, no objection — but datos financieros o patrimoniales require
 * **expreso**, an act of the titular. The core purpose (`necesarias`) therefore
 * needs an explicit method; `novedades` may be tacit (a pre-ticked box).
 */

import { z } from 'zod';

export const CONSENT_SURFACES = ['registro', 'reconsentimiento', 'configuracion'] as const;
export type ConsentSurface = (typeof CONSENT_SURFACES)[number];

export const CONSENT_PURPOSES = ['necesarias', 'novedades'] as const;
export type ConsentPurpose = (typeof CONSENT_PURPOSES)[number];

/** How the will was manifested. `tacito` is only valid for secondary purposes. */
export const CONSENT_METHODS = ['casilla', 'boton', 'tacito'] as const;
export type ConsentMethod = (typeof CONSENT_METHODS)[number];

const SHA256_HEX = /^[0-9a-f]{64}$/;

/** The aviso the titular is being asked about: its label and the hash of its text. */
export const AvisoVigenteSchema = z.object({
  version: z.string().trim().min(1).max(40),
  sha256: z.string().regex(SHA256_HEX, 'sha256 hex esperado'),
});
export type AvisoVigente = z.infer<typeof AvisoVigenteSchema>;

export const ConsentGrantSchema = z
  .object({
    avisoVersion: AvisoVigenteSchema.shape.version,
    avisoSha256: AvisoVigenteSchema.shape.sha256,
    surface: z.enum(CONSENT_SURFACES),
    purpose: z.enum(CONSENT_PURPOSES),
    granted: z.boolean(),
    method: z.enum(CONSENT_METHODS),
  })
  .refine((g) => !(g.purpose === 'necesarias' && g.granted && g.method === 'tacito'), {
    message: 'las finalidades necesarias requieren consentimiento expreso (art. 7)',
    path: ['method'],
  });
export type ConsentGrant = z.infer<typeof ConsentGrantSchema>;

/** What the signup form hands over: the express act, and the pre-ticked toggle. */
export const RegistroConsentimientoSchema = z.object({
  /** The affirmative act on the aviso + términos. Anything but `true` refuses signup. */
  acepto: z.boolean(),
  /** Novedades toggle, ticked by default (tacit consent, art. 7 párrafo tercero). */
  novedades: z.boolean(),
});
export type RegistroConsentimiento = z.infer<typeof RegistroConsentimientoSchema>;

/**
 * The two grants a signup produces. The core one is express by construction;
 * the novedades one records tacit consent when left ticked and an explicit
 * refusal when unticked — both are facts worth keeping.
 */
export function consentimientosDeRegistro(
  aviso: AvisoVigente,
  input: RegistroConsentimiento,
): readonly ConsentGrant[] {
  const base = {
    avisoVersion: aviso.version,
    avisoSha256: aviso.sha256,
    surface: 'registro',
  } as const;
  return [
    { ...base, purpose: 'necesarias', granted: true, method: 'casilla' },
    {
      ...base,
      purpose: 'novedades',
      granted: input.novedades,
      method: input.novedades ? 'tacito' : 'casilla',
    },
  ];
}
