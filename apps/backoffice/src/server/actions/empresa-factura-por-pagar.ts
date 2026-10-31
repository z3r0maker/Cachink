'use server';

import { cancelarFactura, registrarPagoFactura } from '@xangarro/application/corp';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';

import { auditedMutation } from '../audited';
import { hoyEnMexico } from '../db/corp';
import { facturasDeps as deps } from '../empresa/facturas-deps';
import { failed } from '../empresa/fallas';
import { mensajeMesCerrado } from '../empresa/pago-factura-view';
import { requireFounder } from '../founder';
import { field, type FormState } from './form-state';

/**
 * An invoice on credit still owed (E-11, owner decision 9): «Registrar pago»
 * on the day the money left the bank (board CD-06e), or «Cancelar» once the
 * founder confirmed it (board CD-06f), reversed today so a closed month stays
 * closed. Founders only, each with its staff audit row.
 */
const MES = /^\d{4}-\d{2}$/;

const codigo = (error: unknown) =>
  error instanceof Error && 'code' in error ? String(error.code) : '';

export async function registrarPagoAction(_p: FormState, form: FormData): Promise<FormState> {
  const uuid = field(form, 'uuid');
  const fecha = field(form, 'fecha');
  try {
    const { founder } = await requireFounder();
    await auditedMutation(
      (entry) => ({
        action: 'empresa.factura_pagada',
        payload: { uuid, entryId: entry.id, fecha },
      }),
      () => registrarPagoFactura(deps(), { uuid, fecha, founderId: founder.id }),
    );
  } catch (error) {
    if (codigo(error) === 'PERIODO_CERRADO')
      return { ok: false, message: mensajeMesCerrado(fecha) };
    return failed(error, 'registrarPagoFactura');
  }
  revalidatePath('/empresa', 'layout');
  return { ok: true, message: 'Pago registrado.' };
}

export async function cancelarFacturaAction(_p: FormState, form: FormData): Promise<FormState> {
  const uuid = field(form, 'uuid');
  const mes = field(form, 'mes');
  try {
    const { founder } = await requireFounder();
    await auditedMutation(
      (entry) => ({ action: 'empresa.factura_cancelada', payload: { uuid, entryId: entry.id } }),
      () =>
        cancelarFactura(deps(), {
          uuid,
          fecha: hoyEnMexico(),
          motivo: 'Factura cancelada desde Facturas',
          founderId: founder.id,
        }),
    );
  } catch (error) {
    return failed(error, 'cancelarFactura');
  }
  revalidatePath('/empresa', 'layout');
  redirect(`/empresa/facturas?${MES.test(mes) ? `mes=${mes}&` : ''}aviso=cancelada`);
}
