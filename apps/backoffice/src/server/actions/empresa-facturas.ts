'use server';

import {
  descartarRevision,
  registrarFacturas,
  subirFacturas,
  type Seleccion,
} from '@xangarro/application/corp';
import { CATEGORIAS_GASTO } from '@xangarro/domain/corp';
import { revalidatePath } from 'next/cache';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';

import { auditedMutation } from '../audited';
import { hoyEnMexico } from '../db/corp';
import { archivosDe, facturasDeps as deps } from '../empresa/facturas-deps';
import { failed } from '../empresa/fallas';
import { RECHAZOS_COOKIE } from '../empresa/facturas-rutas';
import { serializarRechazos } from '../empresa/revision-view';
import { requireFounder } from '../founder';
import { field, type FormState } from './form-state';

/**
 * Facturas recibidas' writes (E-11): upload XML, register what was
 * reviewed and leave the review; paying or cancelling an invoice on credit
 * is empresa-factura-por-pagar.ts. Founders only, each with its staff audit row. Nothing here deletes.
 */
const FACTURAS = '/empresa/facturas';

export async function subirFacturasAction(_p: FormState, form: FormData): Promise<FormState> {
  try {
    const { founder } = await requireFounder();
    const archivos = await archivosDe(form);
    const { result } = await auditedMutation(
      (r) => ({
        action: 'empresa.facturas_subidas',
        payload: { listas: r.listas, rechazadas: r.rechazos.map((x) => x.motivo) },
      }),
      () => subirFacturas(deps(), { archivos, founderId: founder.id }),
    );
    (await cookies()).set(RECHAZOS_COOKIE, serializarRechazos(result.rechazos), {
      httpOnly: true,
      sameSite: 'lax',
      path: FACTURAS,
      maxAge: 600,
    });
  } catch (error) {
    return failed(error, 'subirFacturas');
  }
  redirect('/empresa/facturas/revisar?subidas=1');
}

function seleccionesDe(form: FormData): Seleccion[] {
  return form.getAll('uuid').flatMap((u) => {
    const uuid = typeof u === 'string' ? u : '';
    const categoria = CATEGORIAS_GASTO.find((c) => c === field(form, `categoria-${uuid}`));
    if (uuid === '' || categoria === undefined) return [];
    const proyecto = field(form, `proyecto-${uuid}`);
    return [{ uuid, categoria, projectId: proyecto === '' ? null : proyecto }];
  });
}

export async function registrarFacturasAction(_p: FormState, form: FormData): Promise<FormState> {
  const selecciones = seleccionesDe(form);
  if (selecciones.length < form.getAll('uuid').length) {
    return { ok: false, message: 'Elige la categoría de cada factura.' };
  }
  try {
    const { founder } = await requireFounder();
    await auditedMutation(
      (entries) => ({
        action: 'empresa.facturas_registradas',
        payload: { entryIds: entries.map((e) => e.id) },
      }),
      () => registrarFacturas(deps(), { selecciones, founderId: founder.id, hoy: hoyEnMexico() }),
    );
    (await cookies()).delete({ name: RECHAZOS_COOKIE, path: FACTURAS });
  } catch (error) {
    return failed(error, 'registrarFacturas');
  }
  revalidatePath('/empresa', 'layout');
  redirect(FACTURAS);
}

export async function descartarRevisionAction(): Promise<FormState> {
  try {
    await requireFounder();
    await auditedMutation(
      (n) => ({ action: 'empresa.revision_descartada', payload: { descartadas: n } }),
      () => descartarRevision(deps().facturas),
    );
    (await cookies()).delete({ name: RECHAZOS_COOKIE, path: FACTURAS });
  } catch (error) {
    return failed(error, 'descartarRevision');
  }
  redirect(FACTURAS);
}
