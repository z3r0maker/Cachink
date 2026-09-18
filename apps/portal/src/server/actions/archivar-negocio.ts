'use server';

import { ArchivarNegocioUseCase } from '@xangarro/application';
import { archiveCurrentBusiness, businesses, subscriptionsOfBusiness } from '@xangarro/data-pg';
import { ConfirmacionNombreError, SuscripcionActivaError } from '@xangarro/domain';
import { eq } from 'drizzle-orm';

import { requireMember } from '../auth';
import { withTenant } from '../db';
import { reportError } from '../observability/report';
import { endSession } from '../session';

/**
 * «Archivar negocio» (P-08), owner only: the name typed to confirm, no
 * subscription left charging, then one database call soft-deletes the business,
 * revokes its devices and ends every portal session — this one included.
 */
export type ArchivarNegocioResult = { ok: true } | { ok: false; message: string };

export async function archivarNegocio(confirmacion: string): Promise<ArchivarNegocioResult> {
  try {
    const session = await requireMember('owner');
    const biz = session.business_id;
    await withTenant(biz, async (tx) => {
      const [row] = await tx
        .select({ nombre: businesses.nombre })
        .from(businesses)
        .where(eq(businesses.id, biz));
      await new ArchivarNegocioUseCase({
        subscriptions: () => subscriptionsOfBusiness(tx, biz),
        archive: () => archiveCurrentBusiness(tx),
      }).execute({ nombre: row?.nombre ?? '', confirmacion });
    });
    await endSession();
    return { ok: true };
  } catch (error) {
    if (
      error instanceof ConfirmacionNombreError ||
      error instanceof SuscripcionActivaError ||
      (error as { code?: string } | null)?.code === 'NOT_PERMITTED'
    ) {
      return { ok: false, message: (error as Error).message };
    }
    reportError(error, { endpoint: 'archivarNegocio' });
    return { ok: false, message: 'No pudimos archivar el negocio. Intenta de nuevo.' };
  }
}
