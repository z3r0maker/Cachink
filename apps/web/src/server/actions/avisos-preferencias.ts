'use server';

import { CambiarCanalAvisoUseCase } from '@xangarro/application';
import { guardarPreferencias, preferenciasDe } from '@xangarro/data-pg';
import type { Canal, FilaPreferencia, TipoAviso } from '@xangarro/domain';

import { failure } from '../action-errors';
import { withTenant } from '../db';
import { readSession } from '../session';

/**
 * «Cómo quieres enterarte» (P-32): one switch in the signed-in member's own
 * matrix. Personal, so any member — the contador included — may set theirs;
 * the domain refuses switching off a critical aviso.
 */
export type CanalResult = { ok: true; filas: FilaPreferencia[] } | { ok: false; message: string };

export async function cambiarCanalAviso(
  tipo: TipoAviso,
  canal: Canal,
  on: boolean,
): Promise<CanalResult> {
  try {
    const session = await readSession();
    if (session === null) return { ok: false, message: 'Inicia sesión para continuar.' };
    const { business_id: biz, sub } = session;
    const filas = await withTenant(biz, (tx) =>
      new CambiarCanalAvisoUseCase({
        leer: () => preferenciasDe(tx, sub),
        guardar: (p) => guardarPreferencias(tx, biz, sub, p),
      }).execute({ tipo, canal, on }),
    );
    return { ok: true, filas };
  } catch (error) {
    return failure(error, 'cambiarCanalAviso', {
      shown: ['AVISO_OBLIGATORIO'],
      retry: 'No pudimos guardar el cambio. Intenta de nuevo.',
    });
  }
}
