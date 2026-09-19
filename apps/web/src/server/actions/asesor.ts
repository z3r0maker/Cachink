'use server';

import { and, eq } from 'drizzle-orm';
import { notices } from '@xangarro/data-pg';
import { transicionAviso, type AccionAviso } from '@xangarro/domain';
import { revalidatePath } from 'next/cache';

import { requireMember } from '../auth';
import { withTenant } from '../db';
import { reportError } from '../observability/report';

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
      if (!row) throw new TypeError('Ese aviso ya no existe.');
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
    if (code === 'AVISO_TRANSICION' || code === 'NOT_PERMITTED' || error instanceof TypeError) {
      return { ok: false, message: (error as Error).message };
    }
    reportError(error, { endpoint: 'cerrarAvisoAsesor' });
    return { ok: false, message: 'No pudimos guardar el cambio. Intenta de nuevo.' };
  }
}
