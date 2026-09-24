'use server';

import { and, eq } from 'drizzle-orm';
import { rangoDelMes } from '@xangarro/domain';
import { getBusiness, notices } from '@xangarro/data-pg';
import { transicionAviso, type AccionAviso } from '@xangarro/domain';
import { revalidatePath } from 'next/cache';

import { requireMember } from '../auth';
import { hoy } from '../clock';
import { loadEstadosModel } from '../estados';
import { reportError } from '../observability/report';
import { readSession } from '../session';
import { withTenant } from '../db';
/**
 * The Asesor's own dismiss/resolve (P-26) — the mirror of
 * `cambiarEstadoAviso`, which excludes `source='asesor'` on purpose (the bell
 * and the Asesor carry separate unread notions, ADR-060). Same lifecycle
 * rules, opposite filter: only Asesor rows, and the feed's own buttons.
 */
export type ResultadoAviso = { ok: true } | { ok: false; message: string };

export async function cerrarAvisoAsesor(id: string, accion: AccionAviso): Promise<ResultadoAviso> {
  try {
    const session = await requireMember('admin');
    await withTenant(session.business_id, async (tx) => {
      const [row] = await tx
        .select({ state: notices.state })
        .from(notices)
        .where(and(eq(notices.id, id), eq(notices.source, 'asesor')));
      if (!row) {
        throw Object.assign(new Error('Ese aviso ya no existe.'), { code: 'AVISO_NO_EXISTE' });
      }
      const state = transicionAviso(row.state, accion);
      const now = new Date().toISOString();
      const cerrado = state === 'listo' || state === 'descartado';
      await tx
        .update(notices)
        .set({ state, updatedAt: now, ...(cerrado ? { resolvedAt: now } : {}) })
        .where(eq(notices.id, id));
    });
    revalidatePath('/asesor');
    return { ok: true };
  } catch (error) {
    const code = (error as { code?: string } | null)?.code;
    // Coded refusals only. This once passed every TypeError through, which
    // showed real bugs to the owner in their own words and never reported them.
    if (code === 'AVISO_TRANSICION' || code === 'AVISO_NO_EXISTE' || code === 'NOT_PERMITTED') {
      return { ok: false, message: (error as Error).message };
    }
    reportError(error, { endpoint: 'cerrarAvisoAsesor' });
    return { ok: false, message: 'No pudimos guardar el cambio. Intenta de nuevo.' };
  }
}

/**
 * P-32's diagnóstico share: the month's real figures for the message — the
 * same `loadEstadosModel` the statements run, scoped to the current month.
 */
export type ResumenCompartirResult =
  | { ok: true; negocio: string; mes: string; ventas: bigint; utilidad: bigint }
  | { ok: false; message: string };

export async function resumenParaCompartir(): Promise<ResumenCompartirResult> {
  try {
    const session = await readSession();
    if (session === null) return { ok: false, message: 'Inicia sesión para continuar.' };
    const today = hoy();
    const mes = rangoDelMes(today);
    const model = await loadEstadosModel(session.business_id, mes.desde, mes.hasta);
    const negocio = await withTenant(session.business_id, (tx) => getBusiness(tx));
    return {
      ok: true,
      negocio: negocio?.nombre ?? 'tu negocio',
      mes: today.slice(0, 7),
      ventas: model.resultados.ingresos,
      utilidad: model.resultados.utilidadOperativa,
    };
  } catch (error) {
    reportError(error, { endpoint: 'resumenParaCompartir' });
    return { ok: false, message: 'No pudimos armar el mensaje. Intenta de nuevo.' };
  }
}
