'use server';

import { guardarTopes } from '@xangarro/application/corp';
import { createTopesRepository } from '@xangarro/data-corp';
import { pesosToCentavos } from '@xangarro/domain';
import { revalidatePath } from 'next/cache';

import { auditedMutation } from '../audited';
import { requireCorpDb } from '../db/corp';
import { failed } from '../empresa/fallas';
import { requireFounder } from '../founder';
import { field, type FormState } from './form-state';

/**
 * Límites' one write (E-15, board CD-12d): a year's SAS and RESICO caps, as
 * the DOF and the law publish them. Founders only, audited.
 */
export async function guardarTopesAction(_p: FormState, form: FormData): Promise<FormState> {
  try {
    const { founder } = await requireFounder();
    const sas = pesosToCentavos(field(form, 'sas'));
    const resico = pesosToCentavos(field(form, 'resico'));
    if (sas === null || resico === null) {
      return { ok: false, message: 'Escribe los dos topes en pesos, como 7678849.94.' };
    }
    const anio = Number(field(form, 'anio'));
    const { result: topes } = await auditedMutation(
      (t: { anio: number; sas: bigint; resico: bigint }) => ({
        action: 'empresa.topes_guardados',
        payload: { anio: t.anio, sas: t.sas.toString(), resico: t.resico.toString() },
      }),
      () =>
        guardarTopes(
          { topes: createTopesRepository(requireCorpDb()) },
          { anio, sas, resico, founderId: founder.id },
        ),
    );
    revalidatePath('/empresa', 'layout');
    return { ok: true, message: `Guardados los topes de ${topes.anio}.` };
  } catch (error) {
    return failed(error, 'guardarTopes');
  }
}
