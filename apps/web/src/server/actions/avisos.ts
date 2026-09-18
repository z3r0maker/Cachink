'use server';

import { and, eq, isNull, ne } from 'drizzle-orm';
import { listNotices, notices } from '@xangarro/data-pg';
import { transicionAviso, type AccionAviso } from '@xangarro/domain';
import { revalidatePath } from 'next/cache';

import { requireMember } from '../auth';
import { withTenant } from '../db';
import { reportError } from '../observability/report';
import { readSession } from '../session';

/**
 * Mark every unread notice as read.
 *
 * No `sync_log` append, and that is the interesting part: `notices` exists only
 * in the cloud. No device has the table, so logging a change would enqueue work
 * for a puller that can do nothing with it. Compare `editar-producto.ts`, where
 * the append is mandatory because a phone is waiting for it.
 *
 * The Asesor is excluded for the same reason the bell excludes it: the badge
 * and the Asesor nav item carry separate unread notions (ADR-060). Marking
 * "all" read from the bell must not silently clear the Asesor's feed.
 */
export type MarkResult = { ok: true; marked: number } | { ok: false; message: string };

export async function marcarAvisosLeidos(): Promise<MarkResult> {
  try {
    const session = await requireMember('admin');

    const marked = await withTenant(session.business_id, async (tx) => {
      const rows = await tx
        .update(notices)
        .set({ state: 'leido', updatedAt: new Date().toISOString() })
        .where(
          and(isNull(notices.resolvedAt), eq(notices.state, 'nuevo'), ne(notices.source, 'asesor')),
        )
        .returning({ id: notices.id });
      return rows.length;
    });

    revalidatePath('/avisos');
    revalidatePath('/');
    return { ok: true, marked };
  } catch (error) {
    reportError(error, { endpoint: 'marcarAvisosLeidos' });
    const message =
      error instanceof Error ? error.message : 'No pudimos marcar los avisos. Intenta de nuevo.';
    return { ok: false, message };
  }
}

/**
 * One aviso's state (P-31): read it, mark it done («Listo») or dismiss it. The
 * domain decides what is allowed — a closed aviso cannot be reopened — and a
 * closed one gets `resolved_at`, which takes it out of the inbox and the bell.
 */
export type EstadoResult = { ok: true } | { ok: false; message: string };

export async function cambiarEstadoAviso(id: string, accion: AccionAviso): Promise<EstadoResult> {
  try {
    const session = await requireMember('admin');
    await withTenant(session.business_id, async (tx) => {
      const [row] = await tx
        .select({ state: notices.state })
        .from(notices)
        .where(and(eq(notices.id, id), ne(notices.source, 'asesor')));
      if (!row) throw new TypeError('Ese aviso ya no existe.');
      const state = transicionAviso(row.state, accion);
      const now = new Date().toISOString();
      const cerrado = state === 'listo' || state === 'descartado';
      await tx
        .update(notices)
        .set({ state, updatedAt: now, ...(cerrado ? { resolvedAt: now } : {}) })
        .where(eq(notices.id, id));
    });
    revalidatePath('/avisos');
    revalidatePath('/');
    return { ok: true };
  } catch (error) {
    const code = (error as { code?: string } | null)?.code;
    if (code === 'AVISO_TRANSICION' || code === 'NOT_PERMITTED' || error instanceof TypeError) {
      return { ok: false, message: (error as Error).message };
    }
    reportError(error, { endpoint: 'cambiarEstadoAviso' });
    return { ok: false, message: 'No pudimos guardar el cambio. Intenta de nuevo.' };
  }
}

/**
 * The bell's panel (P-31): the ten newest open avisos, **never the Asesor's**
 * (ADR-060). Loaded when the panel opens, so the shell does not pay for it on
 * every page. Any member may read; only admins act.
 */
export async function avisosDelBell(): Promise<BellResult> {
  try {
    const session = await readSession();
    if (session === null) return { ok: false, message: 'Inicia sesión para continuar.' };
    const rows = await withTenant(session.business_id, (tx) => listNotices(tx));
    return { ok: true, avisos: rows.filter((n) => n.source !== 'asesor').slice(0, 10) };
  } catch (error) {
    reportError(error, { endpoint: 'avisosDelBell' });
    return { ok: false, message: 'No pudimos cargar tus avisos.' };
  }
}

export type BellResult =
  | { ok: true; avisos: Awaited<ReturnType<typeof listNotices>> }
  | { ok: false; message: string };
