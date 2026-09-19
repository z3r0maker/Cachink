'use server';

import { clientIp, LOGIN_PER_EMAIL, LOGIN_PER_IP, minutes } from '@xangarro/auth-core';
import { RegistrarCuentaUseCase, SignupError } from '@xangarro/application';
import { throttleKey, throttleTake } from '@xangarro/data-pg';
import { randomUUID } from 'node:crypto';
import { headers } from 'next/headers';

import { db } from '../db';
import { failure } from '../onboarding/errors';
import { pgSignupStore } from '../onboarding/signup-store';
import { startSession } from '../session';

/**
 * Signup (P-03, reordered by N-13): account + business + owner membership,
 * then a session, then the wizard. No plan and no payment here.
 *
 * - **Throttled** per address and per IP with the sign-in limits
 *   (`@xangarro/auth-core` policies), counted on every attempt — a signup that succeeds
 *   is still a request someone could repeat.
 * - **Generic** failures: validation says what to fix; a taken address gets
 *   one neutral line pointing to sign-in; anything else is reported, never
 *   shown.
 * - The transaction is scoped to the business being created by the store
 *   itself (`xangarro.business_id`), so RLS's `WITH CHECK` passes for exactly
 *   that tenant.
 */
export type SignupResult = { ok: true } | { ok: false; message: string };

export interface SignupFields {
  /** The business's name. */
  readonly nombre: string;
  /** The person's own name (O-24); optional — empty is stored as null. */
  readonly tuNombre?: string;
  readonly email: string;
  readonly password: string;
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

export async function registrarse(fields: SignupFields): Promise<SignupResult> {
  const wait = await throttled(fields.email.trim().toLowerCase());
  if (wait > 0) {
    return {
      ok: false,
      message: `Demasiados intentos. Vuelve a intentar en ${minutes(wait)} min.`,
    };
  }
  try {
    const owner = await db().transaction((tx) =>
      new RegistrarCuentaUseCase(pgSignupStore(tx), randomUUID).execute(fields),
    );
    await startSession(owner.userId, owner.businessId);
    return { ok: true };
  } catch (error) {
    if (error instanceof SignupError) {
      return { ok: false, message: error.code === 'EMAIL_TAKEN' ? TAKEN : error.message };
    }
    return failure(error, 'registrarse');
  }
}
