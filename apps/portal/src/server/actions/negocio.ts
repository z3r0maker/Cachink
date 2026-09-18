'use server';

import { businesses } from '@xangarro/data-pg';
import { regimenPatch } from '@xangarro/domain';
import { eq } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';

import { requireMember } from '../auth';
import { withTenant } from '../db';
import { recordChange } from '../repositories/sync-log';
import { reportError } from '../observability/report';

/**
 * Edit the business's own record.
 *
 * Owner-only, not admin: the fiscal régimen and the ISR rate feed the NIF
 * statements and every comprobante, so this is the billing contact's call. The
 * screen already hides the button from everyone else; this is the half that
 * cannot be bypassed by calling the action directly.
 *
 * `businesses` is a DOWN table, so the change is logged for the devices in the
 * same transaction — a phone printing comprobantes with a stale régimen is the
 * failure this prevents.
 */
export interface NegocioPatch {
  readonly nombre?: string;
  /** SAT régimen code; the bucket in `regimenFiscal` is derived from it here. */
  readonly regimenSat?: string;
  /** Basis points: 12.5% is 125. Integer, never a float (CLAUDE.md §2.8 in spirit). */
  readonly isrTasa?: number;
}

export type SaveResult = { ok: true } | { ok: false; message: string };

export async function editarNegocio(patch: NegocioPatch): Promise<SaveResult> {
  try {
    const session = await requireMember('owner');

    const nombre = patch.nombre?.trim();
    if (nombre !== undefined && nombre.length === 0) {
      return { ok: false, message: 'El negocio necesita un nombre.' };
    }
    if (patch.isrTasa !== undefined && (!Number.isInteger(patch.isrTasa) || patch.isrTasa < 0)) {
      return { ok: false, message: 'La tasa de ISR debe ser un número entero de puntos base.' };
    }

    // The régimen is its SAT code; the name-bucket old phones read is derived
    // in one place (`regimenPatch`), never typed. Throws REGIMEN_INVALID.
    const { regimenSat, ...rest } = patch;
    const regimen =
      regimenSat === undefined
        ? {}
        : (({ isrSugerido: _isr, ...r }) => r)(regimenPatch(regimenSat));
    await withTenant(session.business_id, async (tx) => {
      const [row] = await tx
        .update(businesses)
        .set({ ...rest, ...regimen, nombre, updatedAt: new Date().toISOString() })
        .where(eq(businesses.id, session.business_id))
        .returning({ id: businesses.id });
      if (!row) throw new TypeError('No encontramos tu negocio.');
      await recordChange(tx, session.business_id, 'businesses', row.id, 'update');
    });

    revalidatePath('/negocio');
    return { ok: true };
  } catch (error) {
    reportError(error, { endpoint: 'editarNegocio' });
    const message =
      error instanceof Error ? error.message : 'No pudimos guardar los datos. Intenta de nuevo.';
    return { ok: false, message };
  }
}
