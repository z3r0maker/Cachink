'use server';

import { clientIp, LOGIN_PER_EMAIL, LOGIN_PER_IP, minutes } from '@xangarro/auth-core';
import { RegistrarCuentaUseCase, SIGNUP_ERROR_CODES } from '@xangarro/application';
import { recordSignupAttribution, throttleKey, throttleTake } from '@xangarro/data-pg';
import { randomUUID } from 'node:crypto';
import { headers } from 'next/headers';

import { aplicarEntrada } from '../acceso/aplicar';
import { trasCredencial } from '../acceso/entrar';
import { accessDeps } from '../acceso/live';
import { failure } from '../action-errors';
import { EMPTY_UTM, type Utm } from '../attribution/utm';
import { db, rlsBoundDb } from '../db';
import { regionFromHeaders } from '../geo/headers';
import { avisoVigente, ipHash } from '../legal/aviso';
import { reportError } from '../observability/report';
import { pgSignupStore } from '../onboarding/signup-store';

/**
 * Signup (P-03, reordered by N-13): account + business + owner membership,
 * then «Revisa tu correo». No plan and no payment here.
 *
 * - **No session yet** (N-83, ADR-142; audit F-09): the account is created
 *   unconfirmed, the confirmation link is mailed and this browser gets the
 *   pending pass. The session, the welcome email and the wizard come when the
 *   link's button is pressed, so nobody can sit on somebody else's address.
 * - **Throttled** per address and per IP with the sign-in limits
 *   (`@xangarro/auth-core` policies), counted on every attempt — a signup that succeeds
 *   is still a request someone could repeat.
 * - **Generic** failures: validation says what to fix; a taken address gets
 *   one neutral line pointing to sign-in; anything else is reported, never
 *   shown.
 * - The transaction is scoped to the business being created by the store
 *   itself (`xangarro.business_id`), so RLS's `WITH CHECK` passes for exactly
 *   that tenant.
 * - **Consent is part of the transaction** (N-34, PRIV-REG-01): the ledger rows
 *   proving the aviso was accepted commit with the account or not at all.
 */
export type SignupResult = { ok: true } | { ok: false; message: string };

export interface SignupFields {
  /** The business's name. */
  readonly nombre: string;
  /** The person's own name (O-24); optional — empty is stored as null. */
  readonly tuNombre?: string;
  readonly email: string;
  readonly password: string;
  /** N-57: the campaign that brought them, off the signup URL. */
  readonly utm?: Utm;
  /** N-34: the aviso act. Missing or `acepto: false` refuses the signup. */
  readonly consentimiento?: { readonly acepto: boolean; readonly novedades: boolean };
}

const TAKEN = 'No pudimos crear la cuenta con ese correo. Si ya tienes una, entra con tu correo.';

async function throttled(address: string): Promise<number> {
  const ip = clientIp(await headers());
  const byEmail = throttleKey('signup', 'email', address);
  const byIp = throttleKey('signup', 'ip', ip);
  return Math.max(
    await throttleTake(db(), byEmail, LOGIN_PER_EMAIL.max, LOGIN_PER_EMAIL.window),
    await throttleTake(db(), byIp, LOGIN_PER_IP.max, LOGIN_PER_IP.window),
  );
}

/**
 * First touch, recorded outside the signup transaction and never allowed to
 * fail it: an account that exists with no campaign label is a reporting gap,
 * while a signup rolled back over one would be a lost customer. The writer is
 * `ON CONFLICT DO NOTHING`, so a retry cannot rewrite the campaign.
 */
async function recordAttribution(businessId: string, utm: Utm | undefined): Promise<void> {
  try {
    const { country, region } = regionFromHeaders(await headers());
    await recordSignupAttribution(db(), businessId, { ...(utm ?? EMPTY_UTM), country, region });
  } catch (error) {
    reportError(error, { endpoint: 'attribution/signup', businessId });
  }
}

export async function registrarse(fields: SignupFields): Promise<SignupResult> {
  const wait = await throttled(fields.email.trim().toLowerCase());
  if (wait > 0) {
    return {
      ok: false,
      message: `Demasiados intentos. Vuelve a intentar en ${minutes(wait)} min.`,
    };
  }
  try {
    const h = await headers();
    const evidence = { ipHash: ipHash(clientIp(h)), userAgent: h.get('user-agent') ?? '' };
    // The signup store sets the new tenant's claim itself, so the pool's role is checked here (F-02).
    const pool = await rlsBoundDb();
    const owner = await pool.transaction((tx) =>
      new RegistrarCuentaUseCase(pgSignupStore(tx, evidence), randomUUID, avisoVigente()).execute(
        fields,
      ),
    );
    await recordAttribution(owner.businessId, fields.utm);
    // A new account is unconfirmed, so this mails the link and sets the pass; it opens nothing.
    const cuenta = { id: owner.userId, email: fields.email.trim().toLowerCase() };
    const destino = await aplicarEntrada(await trasCredencial(accessDeps(), cuenta, 'password'));
    return destino.ok ? { ok: true } : destino;
  } catch (error) {
    return failure(error, 'registrarse', {
      shown: SIGNUP_ERROR_CODES,
      copy: { EMAIL_TAKEN: TAKEN },
    });
  }
}
