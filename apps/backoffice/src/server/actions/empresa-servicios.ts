'use server';

import { darDeBajaServicio, guardarServicio } from '@xangarro/application/corp';
import { createRecurringTemplateRepository, createServiceRepository } from '@xangarro/data-corp';
import type { Servicio } from '@xangarro/domain/corp';
import type { Route } from 'next';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';

import { auditedMutation } from '../audited';
import { hoyEnMexico, requireCorpDb } from '../db/corp';
import { failed } from '../empresa/fallas';
import { servicioDelForm } from '../empresa/servicio-form';
import { hrefServicio } from '../empresa/servicios-textos';
import { requireFounder } from '../founder';
import { field, type FormState } from './form-state';

/**
 * Servicios' writes (E-24, boards CD-18c and CD-18d): «Guardar servicio»
 * from the drawer, and «Dar de baja». Founders only, each with a
 * `staff_audit_log` row; a saved service opens on its own page.
 */
const deps = () => {
  const db = requireCorpDb();
  return {
    servicios: createServiceRepository(db),
    plantillas: createRecurringTemplateRepository(db),
  };
};

const auditoria = (action: string) => (s: Servicio) => ({
  action,
  payload: { servicioId: s.id, cobro: s.cobro, estado: s.estado, plantillaId: s.plantillaId },
});

export async function guardarServicioAction(_p: FormState, form: FormData): Promise<FormState> {
  let id: string;
  try {
    const { founder } = await requireFounder();
    const hoy = hoyEnMexico();
    const captura = servicioDelForm(form, hoy);
    if (!captura.ok) return captura;
    const { result } = await auditedMutation(auditoria('empresa.servicio_guardado'), () =>
      guardarServicio(deps(), { ...captura.v, hoy, founderId: founder.id }),
    );
    id = result.id;
  } catch (error) {
    return failed(error, 'guardarServicio');
  }
  revalidatePath('/empresa', 'layout');
  redirect(hrefServicio(id) as Route);
}

export async function darDeBajaAction(_p: FormState, form: FormData): Promise<FormState> {
  try {
    const { founder } = await requireFounder();
    await auditedMutation(auditoria('empresa.servicio_dado_de_baja'), () =>
      darDeBajaServicio(deps(), field(form, 'servicioId'), founder.id),
    );
  } catch (error) {
    return failed(error, 'darDeBajaServicio');
  }
  revalidatePath('/empresa', 'layout');
  return { ok: true, message: 'Dado de baja. Sus gastos ya registrados se quedan.' };
}
