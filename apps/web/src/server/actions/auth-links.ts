'use server';

import { clientIp, hashPassword, MAX_PASSWORD_BYTES, throttleKey } from '@xangarro/auth-core';
import { consumeMagicLink, issueLink, resetPassword, throttleTake } from '@xangarro/data-pg';
import { headers } from 'next/headers';

import { failure } from '../action-errors';
import { db } from '../db';
import { sendMagicLink, sendPasswordReset } from '../email/auth-links';
import { portalUrl } from '../email/sender';
import { NO_BUSINESS, signInUser } from '../sign-in';

/**
 * Emailed links (ADR-080): «¿Olvidaste tu contraseña?» and «Entrar con un
 * enlace». The link is minted and stored hashed by `@xangarro/data-pg`; the
 * email is B-14's. These actions only glue the two and sign the visitor in.
 *
 * **The request answers the same whether or not the address has an account**,
 * so the form cannot be used to find out who uses Xangarro.
 */
export type LinkKind = 'reset' | 'magic';
export type LinkResult = { ok: true } | { ok: false; message: string };

const TTL = { reset: 30, magic: 15 } as const;
const PATH = { reset: '/login/restablecer', magic: '/login/entrar' } as const;
/** Per address and per IP, per 15 minutes: enough to retry, too few to flood an inbox. */
const PER_EMAIL = 3;
const PER_IP = 10;
const WINDOW = 15 * 60;

const MIN_PASSWORD_LENGTH = 8;
const EXPIRED = 'Este enlace ya no sirve: se usó o caducó. Pide uno nuevo.';

async function throttled(address: string, h: Headers): Promise<boolean> {
  const waits = await Promise.all([
    throttleTake(db(), throttleKey('link', 'email', address), PER_EMAIL, WINDOW),
    throttleTake(db(), throttleKey('link', 'ip', clientIp(h)), PER_IP, WINDOW),
  ]);
  return waits.some((w) => w > 0);
}

export async function pedirEnlace(email: string, kind: LinkKind): Promise<LinkResult> {
  const address = email.trim().toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(address)) {
    return { ok: false, message: 'Escribe tu correo.' };
  }
  try {
    const h = await headers();
    if (await throttled(address, h)) {
      return { ok: false, message: 'Ya te mandamos varios enlaces. Espera unos minutos.' };
    }
    const token = await issueLink(db(), address, kind, TTL[kind] * 60);
    if (token !== null) {
      const url = `${portalUrl(h.get('origin') ?? '')}${PATH[kind]}?t=${token}`;
      const send = kind === 'reset' ? sendPasswordReset : sendMagicLink;
      await send(address, url, { expiresInMinutes: TTL[kind] });
    }
    return { ok: true };
  } catch (error) {
    return failure(error, 'pedirEnlace', {
      retry: 'No pudimos mandar el enlace. Intenta de nuevo.',
    });
  }
}

function passwordProblem(password: string): string | null {
  if (password.length < MIN_PASSWORD_LENGTH) return 'Usa mínimo 8 caracteres.';
  if (Buffer.byteLength(password, 'utf8') > MAX_PASSWORD_BYTES)
    return 'Usa una contraseña más corta.';
  return null;
}

export async function restablecerContrasena(token: string, password: string): Promise<LinkResult> {
  const problem = passwordProblem(password);
  if (problem !== null) return { ok: false, message: problem };
  try {
    const userId = await resetPassword(db(), token, await hashPassword(password));
    if (userId === null) return { ok: false, message: EXPIRED };
    return (await signInUser(userId)) ? { ok: true } : { ok: false, message: NO_BUSINESS };
  } catch (error) {
    return failure(error, 'restablecerContrasena', {
      retry: 'No pudimos cambiar tu contraseña. Intenta de nuevo.',
    });
  }
}

export async function entrarConEnlace(token: string): Promise<LinkResult> {
  try {
    const userId = await consumeMagicLink(db(), token);
    if (userId === null) return { ok: false, message: EXPIRED };
    return (await signInUser(userId)) ? { ok: true } : { ok: false, message: NO_BUSINESS };
  } catch (error) {
    return failure(error, 'entrarConEnlace', {
      retry: 'No pudimos abrir tu sesión. Intenta de nuevo.',
    });
  }
}
