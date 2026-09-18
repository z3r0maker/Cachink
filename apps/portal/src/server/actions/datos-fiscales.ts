'use server';

import type { BusinessId } from '@xangarro/domain';
import { validateDatosFiscales, type DatosFiscalesInput } from '@xangarro/domain';
import { revalidatePath } from 'next/cache';

import { requireMember } from '../auth';
import { withTenant } from '../db';
import { reportError } from '../observability/report';
import { pgBusinessesRepository } from '../repositories/businesses';

/**
 * Save the business's fiscal data (P-08, README Q15) — owner only, like the
 * rest of Negocio. Validated with the domain's rules (the same RFC check digit
 * the CFDI router uses); the write is logged, so every phone gets it, and the
 * CFDI router reads it for the next invoice.
 */
export type DatosFiscalesResult =
  | { ok: true; warnings: readonly string[] }
  | { ok: false; errors: Partial<Record<keyof DatosFiscalesInput, string>>; message?: string };

export async function editarDatosFiscales(input: DatosFiscalesInput): Promise<DatosFiscalesResult> {
  try {
    const session = await requireMember('owner');
    const checked = validateDatosFiscales(input);
    if (!checked.ok) return { ok: false, errors: checked.errors };
    const businessId = session.business_id as BusinessId;
    await withTenant(businessId, (tx) =>
      pgBusinessesRepository(tx, businessId).update(businessId, checked.value),
    );
    revalidatePath('/negocio');
    return { ok: true, warnings: checked.warnings };
  } catch (error) {
    if ((error as { code?: string } | null)?.code === 'NOT_PERMITTED') {
      return { ok: false, errors: {}, message: (error as Error).message };
    }
    reportError(error, { endpoint: 'editarDatosFiscales' });
    return { ok: false, errors: {}, message: 'No pudimos guardar los datos. Intenta de nuevo.' };
  }
}
