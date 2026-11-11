'use server';

import { looksLikeRecoveryCode, minutes } from '@xangarro/auth-core';

import { borrarPaseYReto, leerReto } from '../acceso/cookies';
import { accessDeps } from '../acceso/live';
import {
  confirmarIdentidad as confirmar,
  verificarSegundoPaso as verificar,
  type Rechazado,
} from '../acceso/segundo-paso';
import { failure } from '../action-errors';
import { requireMember } from '../auth';
import { NO_BUSINESS } from '../sign-in';

/**
 * The second factor at the door and in the re-ask dialog (N-83, ADR-142;
 * boards SgDesafio and SgReconfirmar).
 *
 * `verificarSegundoPaso` has no session to check, on purpose: with the second
 * factor on, the password opens none. What stands in for one is the challenge
 * in an `httpOnly` cookie, set only after the right password, and the wrong
 * codes are counted per account (5 in 15 minutes).
 */
export type CodigoRechazado = {
  readonly ok: false;
  readonly message: string;
  /** Too many wrong codes: the field is closed until the wait is over. */
  readonly bloqueado?: true;
  /** The challenge is gone: back to the password. */
  readonly sinReto?: true;
};
/** `restantes`: recovery codes left, when one was used to get in. */
export type SegundoPasoResult =
  | { readonly ok: true; readonly restantes: number | null }
  | CodigoRechazado;
export type IdentidadResult = { readonly ok: true } | CodigoRechazado;

const CADUCO = 'Tu inicio de sesión caducó. Entra otra vez con tu contraseña.';
const NO_COINCIDE = 'Ese código no coincide. Escribe el que tu app muestra ahora.';
const RECUPERACION_MALA = 'Ese código no es válido o ya se usó.';
const RETRY = 'No pudimos revisar tu código. Intenta otra vez.';

function rechazo(result: Rechazado, input: string): CodigoRechazado {
  if (result.kind === 'locked') {
    const message = `Demasiados intentos. Vuelve a intentar en ${minutes(result.wait)} min.`;
    return { ok: false, message, bloqueado: true };
  }
  return { ok: false, message: looksLikeRecoveryCode(input) ? RECUPERACION_MALA : NO_COINCIDE };
}

/** Step 2 of 2: an app code or a recovery code opens the session. */
export async function verificarSegundoPaso(codigo: string): Promise<SegundoPasoResult> {
  try {
    const result = await verificar(accessDeps(), await leerReto(), codigo.trim());
    if (result.kind === 'sin-reto') return { ok: false, message: CADUCO, sinReto: true };
    if (result.kind === 'sin-negocio') return { ok: false, message: NO_BUSINESS };
    if (result.kind !== 'ok') return rechazo(result, codigo);
    await borrarPaseYReto();
    const { usado } = result;
    return { ok: true, restantes: usado.method === 'recovery' ? usado.left : null };
  } catch (error) {
    return failure(error, 'verificarSegundoPaso', { retry: RETRY });
  }
}

/** The re-ask dialog: a code renews this session's proof for 15 minutes. */
export async function confirmarIdentidad(codigo: string): Promise<IdentidadResult> {
  try {
    const session = await requireMember('viewer');
    const result = await confirmar(accessDeps(), session.sub, codigo.trim());
    return result.kind === 'ok' ? { ok: true } : rechazo(result, codigo);
  } catch (error) {
    return failure(error, 'confirmarIdentidad', { retry: RETRY });
  }
}
