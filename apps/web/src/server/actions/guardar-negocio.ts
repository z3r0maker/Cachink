'use server';

import { GuardarNegocioUseCase, type GuardarNegocioInput } from '@xangarro/application';
import { NegocioInvalidoError, type BusinessId, type NegocioErrores } from '@xangarro/domain';
import { revalidatePath } from 'next/cache';

import { failure } from '../action-errors';
import { requireMember } from '../auth';
import { withTenant } from '../db';
import { pgBusinessesRepository } from '../repositories/businesses';

/**
 * «Guardar cambios» on Negocio (P-08): every section in one validated patch,
 * one `sync_log` entry for the phones. Owner-only — the régimen, the ISR rate
 * and the fiscal data feed the NIF statements and every comprobante — and the
 * server says so even when the button was hidden.
 */
export type GuardarNegocioForm = Omit<GuardarNegocioInput, 'id'>;

export type GuardarNegocioResult =
  | { ok: true; warnings: readonly string[] }
  | { ok: false; errores: NegocioErrores; message: string };

const SIN_ERRORES: NegocioErrores = { campos: {}, atributos: {} };

export async function guardarNegocio(form: GuardarNegocioForm): Promise<GuardarNegocioResult> {
  try {
    const session = await requireMember('owner');
    const id = session.business_id as BusinessId;
    const { warnings } = await withTenant(id, (tx) =>
      new GuardarNegocioUseCase(pgBusinessesRepository(tx, id)).execute({ ...form, id }),
    );
    revalidatePath('/negocio');
    return { ok: true, warnings };
  } catch (error) {
    if (error instanceof NegocioInvalidoError) {
      return { ok: false, errores: error.errores, message: error.message };
    }
    return { ...failure(error, 'guardarNegocio'), errores: SIN_ERRORES };
  }
}
