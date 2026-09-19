'use server';

import type { MotivoMeta, NivelMeta, ObjetivoMeta } from '@xangarro/domain';
import { celebrada } from '@xangarro/data-pg';
import { revalidatePath } from 'next/cache';

import { requireMember } from '../auth';
import { fijarMeta } from '../metas';
import { withTenant } from '../db';
import { reportError } from '../observability/report';

/**
 * The wizard's save (P-27): the use case anchors the target to the last
 * complete month and refuses what it must — the screen renders each refusal
 * as its state, not as an error toast.
 */
export type FijarMetaResult = { ok: true } | { ok: false; message: string };

export async function fijarMetaAction(input: {
  readonly objetivo: ObjetivoMeta;
  readonly motivo: MotivoMeta;
  readonly nivel: NivelMeta;
}): Promise<FijarMetaResult> {
  try {
    const session = await requireMember('admin');
    const r = await fijarMeta(session.business_id, input);
    if (!r.ok) return { ok: false, message: r.message };
    revalidatePath('/asesor');
    return { ok: true };
  } catch (error) {
    reportError(error, { endpoint: 'fijarMetaAction' });
    return { ok: false, message: 'No pudimos guardar tu meta. Intenta de nuevo.' };
  }
}

/**
 * The shown-once marker (P-33, ADR-087): writing the marker **is** the check —
 * the insert conflicts when the celebration already happened, and the caller
 * learns which it was.
 */
export type CelebrarResult = { ok: true; primeraVez: boolean } | { ok: false };

export async function celebrar(clave: string): Promise<CelebrarResult> {
  try {
    const session = await requireMember('admin');
    const primeraVez = await withTenant(session.business_id, (tx) =>
      celebrada(tx, session.business_id, clave),
    );
    return { ok: true, primeraVez };
  } catch {
    return { ok: false };
  }
}
