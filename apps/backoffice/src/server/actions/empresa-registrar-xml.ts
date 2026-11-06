'use server';

import {
  hacerRecurrenteFactura,
  quitarFactura,
  registrarFacturas,
  subirFacturas,
  type Seleccion,
} from '@xangarro/application/corp';
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
 * with the founder's concept and payment date (and, ticked, repeat it each
 * month by its supplier's invoice, CD-06h), or take it off. It travels the
 * same path as an upload in Facturas, so the same checks apply.
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

/**
 * Registers the invoice and, with «Hacer recurrente cada mes» ticked, makes
 * its supplier's template, known by the RFC (board CD-06h).
 */
async function registrarYRepetir(seleccion: Seleccion, founderId: string, recurrente: boolean) {
  const deps = facturasDeps();
  const entries = await registrarFacturas(deps, {
    selecciones: [seleccion],
    founderId,
    hoy: hoyEnMexico(),
  });
  const plantilla = recurrente
    ? await hacerRecurrenteFactura(deps, { uuid: seleccion.uuid, founderId })
    : null;
  return { entries, plantillaId: plantilla?.id ?? null };
}

export async function registrarConXmlAction(_p: FormState, form: FormData): Promise<FormState> {
  const categoria = CATEGORIAS_GASTO.find((c) => c === field(form, 'categoria'));
  if (categoria === undefined) return { ok: false, message: 'Elige la categoría del gasto.' };
  const proyecto = field(form, 'proyecto');
  let fecha: string;
  try {
    const { founder } = await requireFounder();
    const seleccion = {
      uuid: field(form, 'uuid'),
      categoria,
      projectId: proyecto === '' ? null : proyecto,
      concepto: field(form, 'concepto'),
      fecha: field(form, 'fecha'),
    };
    const { result } = await auditedMutation(
      (r) => ({
        action: 'empresa.facturas_registradas',
        payload: { entryIds: r.entries.map((e) => e.id), plantillaId: r.plantillaId },
      }),
      () => registrarYRepetir(seleccion, founder.id, field(form, 'recurrente') === 'si'),
    );
    fecha = result.entries[0]?.fecha ?? hoyEnMexico();
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
