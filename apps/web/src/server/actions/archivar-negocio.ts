'use server';

import { ArchivarNegocioUseCase } from '@xangarro/application';
import { archiveCurrentBusiness, businesses, subscriptionsOfBusiness } from '@xangarro/data-pg';
import { eq } from 'drizzle-orm';

import { failure } from '../action-errors';
import { requireMember } from '../auth';
import { withTenant } from '../db';
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
    return failure(error, 'archivarNegocio', {
      shown: ['CONFIRMACION_NOMBRE', 'SUSCRIPCION_ACTIVA'],
      retry: 'No pudimos archivar el negocio. Intenta de nuevo.',
    });
  }
}
