'use server';

import { createHash } from 'node:crypto';

import {
  cancelarFactura,
  descartarRevision,
  registrarFacturas,
  registrarPagoFactura,
  subirFacturas,
  type ArchivoXml,
  type Seleccion,
} from '@xangarro/application/corp';
import {
  createCorpLedgerRepository,
  createDocumentRepository,
  createReceivedInvoiceRepository,
} from '@xangarro/data-corp';
import { CATEGORIAS_GASTO } from '@xangarro/domain/corp';
import { revalidatePath } from 'next/cache';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';

import { auditedMutation } from '../audited';
import { hoyEnMexico, requireCorpDb } from '../db/corp';
import { failed } from '../empresa/fallas';
import { rfcDeMexia } from '../empresa/facturas-lectura';
import { RECHAZOS_COOKIE } from '../empresa/facturas-rutas';
import { serializarRechazos } from '../empresa/revision-view';
import { consultaSat } from '../empresa/sat-consulta';
import { requireFounder } from '../founder';
import { field, type FormState } from './form-state';

/**
 * Facturas recibidas' writes (E-11): upload XML, register what was
 * reviewed, leave the review, and pay or cancel an invoice on credit.
 * Founders only, each with its staff audit row. Nothing here deletes.
 */
const FACTURAS = '/empresa/facturas';

const deps = () => {
  const db = requireCorpDb();
  return {
    facturas: createReceivedInvoiceRepository(db),
    ledger: createCorpLedgerRepository(db),
    documentos: createDocumentRepository(db),
    sat: consultaSat(),
    rfcMexia: () => rfcDeMexia(db),
    sha256: async (b: Uint8Array) => createHash('sha256').update(b).digest('hex'),
  };
};

async function archivosDe(form: FormData): Promise<ArchivoXml[]> {
  const files = form.getAll('xml').filter((f): f is File => f instanceof File && f.size > 0);
  return Promise.all(
    files.map(async (f) => {
      const contenido = new Uint8Array(await f.arrayBuffer());
      return { nombre: f.name, contenido, texto: new TextDecoder().decode(contenido) };
    }),
  );
}

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

async function porPagar(form: FormData, accion: 'pago' | 'cancelar'): Promise<FormState> {
  const uuid = field(form, 'uuid');
  try {
    const { founder } = await requireFounder();
    const input = { uuid, fecha: hoyEnMexico(), founderId: founder.id };
    await auditedMutation(
      (entry) => ({
        action: accion === 'pago' ? 'empresa.factura_pagada' : 'empresa.factura_cancelada',
        payload: { uuid, entryId: entry.id },
      }),
      () =>
        accion === 'pago'
          ? registrarPagoFactura(deps(), input)
          : cancelarFactura(deps(), { ...input, motivo: 'Factura cancelada desde Facturas' }),
    );
  } catch (error) {
    return failed(error, accion === 'pago' ? 'registrarPagoFactura' : 'cancelarFactura');
  }
  revalidatePath('/empresa', 'layout');
  return { ok: true, message: accion === 'pago' ? 'Pago registrado.' : 'Factura cancelada.' };
}

export async function registrarPagoAction(_p: FormState, form: FormData): Promise<FormState> {
  return porPagar(form, 'pago');
}

export async function cancelarFacturaAction(_p: FormState, form: FormData): Promise<FormState> {
  return porPagar(form, 'cancelar');
}
