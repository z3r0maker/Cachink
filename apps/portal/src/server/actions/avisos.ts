'use server';

import { and, eq, isNull, ne } from 'drizzle-orm';
import { notices } from '@xangarro/data-pg';
import { revalidatePath } from 'next/cache';

import { requireMember } from '../auth';
import { withTenant } from '../db';

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
    console.error('[marcarAvisosLeidos]', error);
    const message =
      error instanceof Error ? error.message : 'No pudimos marcar los avisos. Intenta de nuevo.';
    return { ok: false, message };
  }
}
