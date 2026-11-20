'use server';

import { guardarCodigos, validarCodigos } from '@xangarro/application/corp';
import { createCodigosRepository } from '@xangarro/data-corp';
import { CUENTAS_DEL_CATALOGO } from '@xangarro/domain/corp';
import type { Route } from 'next';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';

import { auditedMutation } from '../audited';
import { hoyEnMexico, requireCorpDb } from '../db/corp';
import { HREF_CODIGOS } from '../empresa/cierre-view';
import { failed } from '../empresa/fallas';
import { requireFounder } from '../founder';
import { field, type FormState } from './form-state';

/**
 * Códigos agrupadores' writes (E-43, board CD-10e): save the codes the
 * contador sent, and mark the list as validated with the day they did.
 * Founders only, each with its `staff_audit_log` row.
 */
const deps = () => ({ codigos: createCodigosRepository(requireCorpDb()) });

const volver = (): never => {
  revalidatePath('/empresa', 'layout');
  redirect(HREF_CODIGOS as Route);
};

export async function guardarCodigosAction(_p: FormState, form: FormData): Promise<FormState> {
  const codigos = Object.fromEntries(
    CUENTAS_DEL_CATALOGO.map((c) => [c, field(form, `codigo_${c}`)]),
  );
  try {
    const { founder } = await requireFounder();
    const { result } = await auditedMutation(
      (l: { id: string; codigos: ReadonlyMap<string, string> } | null) => ({
        action: 'empresa.codigos_guardados',
        payload: l === null ? { sinCambios: true } : { listaId: l.id, codigos: l.codigos.size },
      }),
      () => guardarCodigos(deps(), { codigos, founderId: founder.id }),
    );
    if (result === null)
      return { ok: true, message: 'Los códigos ya estaban así: no cambió nada.' };
  } catch (error) {
    return failed(error, 'guardarCodigos');
  }
  return volver();
}

export async function validarCodigosAction(_p: FormState, form: FormData): Promise<FormState> {
  const listaId = field(form, 'listaId');
  const fecha = field(form, 'fecha');
  try {
    const { founder } = await requireFounder();
    await auditedMutation(
      { action: 'empresa.codigos_validados', payload: { listaId, fecha } },
      () => validarCodigos(deps(), { listaId, fecha, hoy: hoyEnMexico(), founderId: founder.id }),
    );
  } catch (error) {
    return failed(error, 'validarCodigos');
  }
  return volver();
}
