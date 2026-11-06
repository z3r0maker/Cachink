'use server';

import { consultarSatFactura } from '@xangarro/application/corp';
import type { Route } from 'next';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';

import { auditedMutation } from '../audited';
import { facturasDeps as deps } from '../empresa/facturas-deps';
import { facturasHref } from '../empresa/facturas-rutas';
import { failed } from '../empresa/fallas';
import { mensajeConsultaSat } from '../empresa/sat-fila-view';
import { requireFounder } from '../founder';
import { field, type FormState } from './form-state';

/**
 * «Consultar al SAT» (E-11, board CD-06g): asks again about a registered
 * invoice the SAT did not answer for. «vigente» comes back as «El SAT la
 * confirmó hoy»; «cancelado» as the warning under its row, and nothing is
 * reversed until a founder cancels it. Founders only, with its audit row.
 */
export async function consultarSatAction(_p: FormState, form: FormData): Promise<FormState> {
  const uuid = field(form, 'uuid');
  const mes = field(form, 'mes');
  let estado;
  try {
    await requireFounder();
    const { result } = await auditedMutation(
      (r) => ({ action: 'empresa.factura_consultada_sat', payload: { uuid, estado: r } }),
      () => consultarSatFactura(deps(), { uuid }),
    );
    estado = result;
  } catch (error) {
    return failed(error, 'consultarSatFactura');
  }
  const mensaje = mensajeConsultaSat(estado);
  if (mensaje !== null) return { ok: false, message: mensaje };
  revalidatePath('/empresa', 'layout');
  redirect(facturasHref(mes, estado === 'vigente' ? { consultada: uuid } : {}) as Route);
}
