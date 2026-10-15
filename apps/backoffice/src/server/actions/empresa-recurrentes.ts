'use server';

import { dejarDeRepetir as detener } from '@xangarro/application/corp';
import { createRecurringTemplateRepository } from '@xangarro/data-corp';
import { revalidatePath } from 'next/cache';

import { auditedMutation } from '../audited';
import { requireCorpDb } from '../db/corp';
import { failed } from '../empresa/fallas';
import { requireFounder } from '../founder';
import { field, type FormState } from './form-state';

/**
 * «Dejar de repetir» on Movimientos › Recurrentes (E-02): the template stops
 * suggesting its charge; what it registered stays in the ledger. Founders
 * only, with a `staff_audit_log` row.
 */
export async function dejarDeRepetir(_prev: FormState, form: FormData): Promise<FormState> {
  const plantillaId = field(form, 'plantillaId');
  try {
    await requireFounder();
    const plantillas = createRecurringTemplateRepository(requireCorpDb());
    await auditedMutation({ action: 'empresa.recurrente_detenido', payload: { plantillaId } }, () =>
      detener(plantillas, plantillaId),
    );
  } catch (error) {
    return failed(error, 'dejarDeRepetir');
  }
  revalidatePath('/empresa/movimientos');
  return { ok: true, message: 'Ya no se repetirá cada mes.' };
}
