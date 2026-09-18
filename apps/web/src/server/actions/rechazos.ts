'use server';

import { syncRejections } from '@xangarro/data-pg';
import { and, eq, isNull } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';

import { requireMember } from '../auth';
import { withTenant } from '../db';
import { reportError } from '../observability/report';

/**
 * «Marcar como resuelto» (P-11): the owner or an admin has dealt with a
 * refused row. Sets `resolved_at`; the row stays in the table (ADR-053 Q4 —
 * rejections are never dropped) and leaves the list. If the phone sends the
 * row again and it is refused again, the retry reopens it.
 */
export type ResolverResult = { ok: true } | { ok: false; message: string };

export async function marcarRechazoResuelto(id: string): Promise<ResolverResult> {
  try {
    const session = await requireMember('admin');
    await withTenant(session.business_id, (tx) =>
      tx
        .update(syncRejections)
        .set({ resolvedAt: new Date().toISOString(), updatedAt: new Date().toISOString() })
        .where(and(eq(syncRejections.id, id), isNull(syncRejections.resolvedAt))),
    );
    revalidatePath('/sincronizacion');
    return { ok: true };
  } catch (error) {
    if ((error as { code?: string } | null)?.code === 'NOT_PERMITTED') {
      return { ok: false, message: (error as Error).message };
    }
    reportError(error, { endpoint: 'marcarRechazoResuelto' });
    return { ok: false, message: 'No pudimos marcarlo. Intenta de nuevo.' };
  }
}
