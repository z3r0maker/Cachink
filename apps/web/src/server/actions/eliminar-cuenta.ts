'use server';

import { guardAttempt, LOGIN_PER_EMAIL, minutes, throttleKey } from '@xangarro/auth-core';
import { CuentaError } from '@xangarro/application/cuenta';
import { throttleStore } from '@xangarro/data-pg';

import { failure } from '../action-errors';
import { requireMember } from '../auth';
import { portalOrigin } from '../billing/origin';
import { guardarProgramada } from '../cuenta/flash';
import { liveEliminarCuenta } from '../cuenta/live';
import { db } from '../db';
import { endSession } from '../session';

/**
 * «Eliminar mi cuenta» (ADR-136), owner only. The password is throttled like a
 * sign-in, per account: a stolen session must not become a password oracle.
 * On success the session ends here too and the page that follows reads the
 * folio from a short-lived cookie.
 */
export type EliminarCuentaResult =
  | { ok: true }
  | { ok: false; message: string; campo?: 'password' };

const NO_CAMBIO =
  'No pudimos eliminar tu cuenta y no se cambió nada. Revisa tu conexión e intenta otra vez; si sigue, escríbenos a hola@xangarro.mx.';

async function intentar(userId: string, email: string, password: string) {
  try {
    return await liveEliminarCuenta(await portalOrigin()).execute({ userId, email, password });
  } catch (error) {
    if (error instanceof CuentaError && error.code === 'WRONG_PASSWORD') return null;
    throw error;
  }
}

export async function eliminarCuenta(password: string): Promise<EliminarCuentaResult> {
  try {
    const session = await requireMember('owner');
    if (password.length === 0) {
      return { ok: false, campo: 'password', message: 'Escribe tu contraseña.' };
    }
    const guarded = await guardAttempt(
      throttleStore(db()),
      [
        {
          key: throttleKey('eliminar', 'user', session.sub),
          policy: LOGIN_PER_EMAIL,
          clearOnSuccess: true,
        },
      ],
      () => intentar(session.sub, session.email, password),
    );
    if (guarded.kind === 'locked') {
      return {
        ok: false,
        message: `Demasiados intentos. Vuelve a intentar en ${minutes(guarded.wait)} min.`,
      };
    }
    if (guarded.kind === 'failed') {
      return { ok: false, campo: 'password', message: new CuentaError('WRONG_PASSWORD').message };
    }
    await endSession();
    await guardarProgramada(guarded.value);
    return { ok: true };
  } catch (error) {
    return failure(error, 'eliminarCuenta', { shown: ['NO_BUSINESS'], retry: NO_CAMBIO });
  }
}
