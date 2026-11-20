'use server';

import { codigoCanonico, type BusinessId } from '@xangarro/domain';

import { failure, type Failure } from '../action-errors';
import { requireMember } from '../auth';
import { withTenant } from '../db';
import { pgCodigos } from '../repositories/codigos';

/**
 * «Nuevo producto»'s look before «Siguiente» (P-44, board EcPortalCodigo): the
 * live product that already has this barcode, if any, so the step can name it
 * with «Ver ese producto». The save refuses the same code again on the server
 * (`CrearProductoUseCase`), so this is the early answer, not the control.
 * `propio` leaves the product being edited out.
 */
export type CodigoEnUso =
  { ok: true; otro: { readonly id: string; readonly nombre: string } | null } | Failure;

export async function codigoEnUso(codigo: string, propio?: string): Promise<CodigoEnUso> {
  try {
    const session = await requireMember('admin');
    const clave = codigoCanonico(codigo);
    if (clave === null) return { ok: true, otro: null };
    const otros = await withTenant(session.business_id as BusinessId, (tx) =>
      pgCodigos(tx).conCodigo(clave),
    );
    return { ok: true, otro: otros.find((p) => p.id !== propio) ?? null };
  } catch (error) {
    return failure(error, 'codigoEnUso', {
      retry: 'No pudimos revisar el código. Intenta de nuevo.',
    });
  }
}
