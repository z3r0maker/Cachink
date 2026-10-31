'use server';

import { quitarFactura, registrarFacturas, subirFacturas } from '@xangarro/application/corp';
import { CATEGORIAS_GASTO, periodOf } from '@xangarro/domain/corp';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';

import { auditedMutation } from '../audited';
import { hoyEnMexico } from '../db/corp';
import { archivosDe, facturasDeps } from '../empresa/facturas-deps';
import { failed } from '../empresa/fallas';
import { mensajeDeRechazo } from '../empresa/registrar-xml-view';
import { requireFounder } from '../founder';
import { field, type FormState } from './form-state';

/**
 * Registrar gasto with one XML (E-11, board CD-06d): attach it, register it
 * with the founder's concept and payment date, or take it off. It travels
 * the same path as an upload in Facturas, so the same checks apply.
 */
const REGISTRAR = '/empresa/movimientos/registrar';

export async function adjuntarXmlAction(_p: FormState, form: FormData): Promise<FormState> {
  let uuid: string;
  try {
    const { founder } = await requireFounder();
    const archivos = (await archivosDe(form)).slice(0, 1);
    const { result } = await auditedMutation(
      (r) => ({
        action: 'empresa.facturas_subidas',
        payload: { listas: r.listas, rechazadas: r.rechazos.map((x) => x.motivo) },
      }),
      () => subirFacturas(facturasDeps(), { archivos, founderId: founder.id }),
    );
    const [rechazo] = result.rechazos;
    const [lista] = result.listas;
    if (lista === undefined) {
      return {
        ok: false,
        message: rechazo === undefined ? 'Elige un XML.' : mensajeDeRechazo(rechazo),
      };
    }
    uuid = lista;
  } catch (error) {
    return failed(error, 'adjuntarXml');
  }
  redirect(`${REGISTRAR}?factura=${encodeURIComponent(uuid)}`);
}

export async function registrarConXmlAction(_p: FormState, form: FormData): Promise<FormState> {
  const uuid = field(form, 'uuid');
  const categoria = CATEGORIAS_GASTO.find((c) => c === field(form, 'categoria'));
  if (categoria === undefined) return { ok: false, message: 'Elige la categoría del gasto.' };
  const proyecto = field(form, 'proyecto');
  let fecha: string;
  try {
    const { founder } = await requireFounder();
    const seleccion = {
      uuid,
      categoria,
      projectId: proyecto === '' ? null : proyecto,
      concepto: field(form, 'concepto'),
      fecha: field(form, 'fecha'),
    };
    const { result } = await auditedMutation(
      (entries) => ({
        action: 'empresa.facturas_registradas',
        payload: { entryIds: entries.map((e) => e.id) },
      }),
      () =>
        registrarFacturas(facturasDeps(), {
          selecciones: [seleccion],
          founderId: founder.id,
          hoy: hoyEnMexico(),
        }),
    );
    fecha = result[0]?.fecha ?? hoyEnMexico();
  } catch (error) {
    return failed(error, 'registrarConXml');
  }
  revalidatePath('/empresa', 'layout');
  redirect(`/empresa/movimientos?mes=${periodOf(fecha) ?? ''}`);
}

export async function quitarXmlAction(_p: FormState, form: FormData): Promise<FormState> {
  const uuid = field(form, 'uuid');
  try {
    await requireFounder();
    await auditedMutation({ action: 'empresa.factura_quitada', payload: { uuid } }, () =>
      quitarFactura(facturasDeps().facturas, uuid),
    );
  } catch (error) {
    return failed(error, 'quitarXml');
  }
  redirect(REGISTRAR);
}
