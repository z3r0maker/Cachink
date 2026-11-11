'use server';

import { groupSecret, minutes } from '@xangarro/auth-core';
import { revalidatePath } from 'next/cache';

import { accessDeps } from '../acceso/live';
import { STEP_UP_MESSAGE } from '../acceso/reconfirmar';
import {
  activar,
  desactivar,
  descartarInvitacion as descartar,
  nuevosCodigos,
  prepararActivacion as preparar,
} from '../acceso/seguridad';
import { failure, type Failure } from '../action-errors';
import { requireMember } from '../auth';
import { qrSvgDataUri } from '../qr';

/**
 * «Seguridad» (N-83, ADR-142; boards SgSeguridad and SgActivar): the second
 * factor is each person's own, so every action acts on the session's account
 * and never takes one from the caller. Owner and admin only.
 */
type Refused = Failure & { readonly campo?: 'password' | 'codigo'; readonly bloqueado?: true };

export type PrepararResult =
  | { readonly ok: true; readonly qr: string; readonly clave: string }
  | Refused;
export type CodigosResult = { readonly ok: true; readonly codigos: readonly string[] } | Refused;
export type SeguridadResult = { readonly ok: true } | Refused;

const RETRY =
  'No pudimos preparar la verificación en dos pasos. No se cambió nada. Intenta otra vez.';
const YA_ACTIVA = 'Tu cuenta ya tiene verificación en dos pasos.';
const INACTIVA = 'Tu cuenta no tiene verificación en dos pasos.';
const RECONFIRMAR: Refused = { ok: false, message: STEP_UP_MESSAGE, reconfirmar: true };

const bloqueo = (wait: number): Refused => ({
  ok: false,
  message: `Demasiados intentos. Vuelve a intentar en ${minutes(wait)} min. Tu cuenta sigue igual.`,
  bloqueado: true,
});

/** Step 1: the password. Answers with the seed to scan, as a QR and as a key to type. */
export async function prepararActivacion(password: string): Promise<PrepararResult> {
  try {
    const session = await requireMember('admin');
    const cuenta = { id: session.sub, email: session.email };
    const view = await preparar(accessDeps(), cuenta, password);
    if (view.kind === 'locked') return bloqueo(view.wait);
    if (view.kind === 'password') {
      const message = 'Esa contraseña no es correcta. Intenta otra vez.';
      return { ok: false, message, campo: 'password' };
    }
    if (view.kind === 'ya-activa') return { ok: false, message: YA_ACTIVA };
    return { ok: true, qr: await qrSvgDataUri(view.uri), clave: groupSecret(view.secret) };
  } catch (error) {
    return failure(error, 'prepararActivacion', { retry: RETRY });
  }
}

/** Step 2: the first code turns it on. The ten recovery codes are in the answer, once. */
export async function activarVerificacion(codigo: string): Promise<CodigosResult> {
  try {
    const session = await requireMember('admin');
    const result = await activar(accessDeps(), session.sub, codigo.trim());
    if (result.kind === 'locked') return bloqueo(result.wait);
    if (result.kind === 'failed') {
      const message = 'Ese código no coincide. Escribe el que tu app muestra ahora.';
      return { ok: false, message, campo: 'codigo' };
    }
    revalidatePath('/', 'layout');
    return { ok: true, codigos: result.codigos };
  } catch (error) {
    return failure(error, 'activarVerificacion', { retry: RETRY });
  }
}

/** «Generar códigos nuevos»: needs a code typed in the last 15 minutes. */
export async function generarCodigosNuevos(): Promise<CodigosResult> {
  try {
    const session = await requireMember('admin');
    const result = await nuevosCodigos(accessDeps(), session.sub);
    if (result.kind !== 'ok') {
      return result.kind === 'reconfirmar' ? RECONFIRMAR : { ok: false, message: INACTIVA };
    }
    revalidatePath('/seguridad');
    return { ok: true, codigos: result.codigos };
  } catch (error) {
    return failure(error, 'generarCodigosNuevos', {
      retry: 'No pudimos generar tus códigos. Los anteriores siguen sirviendo. Intenta otra vez.',
    });
  }
}

/** «Desactivar»: needs a code typed in the last 15 minutes. */
export async function desactivarVerificacion(): Promise<SeguridadResult> {
  try {
    const session = await requireMember('admin');
    const result = await desactivar(accessDeps(), session.sub);
    if (result === 'reconfirmar') return RECONFIRMAR;
    if (result === 'inactiva') return { ok: false, message: INACTIVA };
    revalidatePath('/', 'layout');
    return { ok: true };
  } catch (error) {
    return failure(error, 'desactivarVerificacion', {
      retry: 'No pudimos desactivarla y no se cambió nada. Intenta otra vez.',
    });
  }
}

/** «Ahora no» on the invitation: it does not come back. */
export async function descartarInvitacion(): Promise<SeguridadResult> {
  try {
    const session = await requireMember('admin');
    await descartar(accessDeps(), session.sub);
    revalidatePath('/', 'layout');
    return { ok: true };
  } catch (error) {
    return failure(error, 'descartarInvitacion');
  }
}
