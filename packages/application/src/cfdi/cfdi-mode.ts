/**
 * The rollout switch of ADR-070: `CFDI_MODE = off | test | live`.
 *
 *   off   (default, production at launch) — every payment is recorded and
 *         filed as a "pago sin CFDI" inbox item; staff issue the CFDI in the
 *         SAT portal. No PAC call is ever made.
 *   test  (staging) — Facturapi with an `sk_test_` key; never reaches the SAT.
 *   live  — Facturapi with an `sk_live_` key; real CFDIs.
 *
 * A key that does not match the mode is refused: a test deployment must not
 * stamp real CFDIs because someone pasted the wrong secret, and `live` must
 * not silently stamp sandbox ones.
 */

import { configError, envValue, type EnvSource } from './issuer-config.js';

export const CFDI_MODES = ['off', 'test', 'live'] as const;
export type CfdiMode = (typeof CFDI_MODES)[number];

export function readCfdiMode(env: EnvSource): CfdiMode {
  const raw = envValue(env, 'CFDI_MODE') ?? 'off';
  const mode = CFDI_MODES.find((m) => m === raw);
  if (!mode) throw configError(`CFDI_MODE debe ser off, test o live (no "${raw}")`);
  return mode;
}

/** Throws unless a `livemode` key goes with `live` and a test key with `test`. */
export function assertKeyMatchesMode(mode: CfdiMode, livemode: boolean): void {
  if (mode === 'test' && livemode) {
    throw configError('CFDI_MODE=test necesita una llave sk_test_ de Facturapi');
  }
  if (mode === 'live' && !livemode) {
    throw configError('CFDI_MODE=live necesita una llave sk_live_ de Facturapi');
  }
}
