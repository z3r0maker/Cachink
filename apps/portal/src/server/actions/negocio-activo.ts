'use server';

import { revalidatePath } from 'next/cache';

import { membershipsOf } from '../memberships';
import { reportError } from '../observability/report';
import { endSession, readSession, startSession } from '../session';

/**
 * Switch the business the portal is looking at (P-02). The session is bound to
 * one business, so switching opens a fresh session on the other one and ends
 * this one — but only for a business the account is a member of **now**; the
 * id from the browser is a request, never trusted.
 */
export type CambiarNegocioResult = { ok: true } | { ok: false; message: string };

export async function cambiarNegocio(businessId: string): Promise<CambiarNegocioResult> {
  try {
    const session = await readSession();
    if (session === null) return { ok: false, message: 'Inicia sesión para continuar.' };
    const memberships = await membershipsOf(session.sub);
    if (!memberships.some((m) => m.businessId === businessId)) {
      return { ok: false, message: 'No perteneces a ese negocio.' };
    }
    if (businessId === session.business_id) return { ok: true };
    await endSession();
    await startSession(session.sub, businessId);
    revalidatePath('/', 'layout');
    return { ok: true };
  } catch (error) {
    reportError(error, { endpoint: 'cambiarNegocio' });
    return { ok: false, message: 'No pudimos cambiar de negocio. Intenta de nuevo.' };
  }
}
