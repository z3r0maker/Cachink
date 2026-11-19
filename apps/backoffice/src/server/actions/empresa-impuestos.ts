'use server';

import { createHash } from 'node:crypto';

import {
  avanzarDeclaracion,
  guardarDeclaracion,
  pagarDeclaracion,
  subirEvidencia,
} from '@xangarro/application/corp';
import {
  createAgendaRepository,
  createCorpLedgerRepository,
  createDeclaracionRepository,
  createDocumentRepository,
} from '@xangarro/data-corp';
import { formatMonth } from '@xangarro/domain';
import { isTipoEvidencia, PLANTILLA_IMPUESTOS } from '@xangarro/domain/corp';
import type { Route } from 'next';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';

import { auditedMutation } from '../audited';
import { almacenParaNuevos } from '../blobs';
import { hoyEnMexico, requireCorpDb } from '../db/corp';
import { archivoDelForm } from '../empresa/archivo';
import { failed } from '../empresa/fallas';
import { declaracionDelForm } from '../empresa/impuestos-form';
import { hrefImpuestos } from '../empresa/impuestos-view';
import { requireFounder } from '../founder';
import { field, type FormState } from './form-state';

/**
 * Impuestos' writes (E-13, boards CD-09 and CD-09b): the contador's figures,
 * a paper of the month, and «Marcar como pagado». Founders only, each with a
 * `staff_audit_log` row; a paper or the figures move the Agenda's «ISR e IVA»
 * as far as they allow.
 */
const deps = () => {
  const db = requireCorpDb();
  return {
    declaraciones: createDeclaracionRepository(db),
    agenda: createAgendaRepository(db),
    documentos: createDocumentRepository(db, almacenParaNuevos(db)),
    ledger: createCorpLedgerRepository(db),
    sha256: async (b: Uint8Array) => createHash('sha256').update(b).digest('hex'),
  };
};

const done = (message: string): FormState => {
  revalidatePath('/empresa', 'layout');
  return { ok: true, message };
};

export async function guardarDeclaracionAction(_p: FormState, form: FormData): Promise<FormState> {
  let periodo: string;
  try {
    const { founder } = await requireFounder();
    const captura = declaracionDelForm(form);
    if (!captura.ok) return captura;
    periodo = captura.v.periodo;
    await auditedMutation({ action: 'empresa.declaracion_guardada', payload: { periodo } }, () =>
      guardarDeclaracion(deps(), { declaracion: captura.v, founderId: founder.id }),
    );
  } catch (error) {
    return failed(error, 'guardarDeclaracion');
  }
  revalidatePath('/empresa', 'layout');
  redirect(hrefImpuestos(periodo) as Route);
}

export async function subirPapelAction(_p: FormState, form: FormData): Promise<FormState> {
  try {
    const { founder } = await requireFounder();
    const tipo = field(form, 'tipo');
    const periodo = field(form, 'periodo');
    const archivo = await archivoDelForm(form);
    if (archivo === null) return { ok: false, message: 'Elige el archivo.' };
    if (!isTipoEvidencia(tipo)) return { ok: false, message: 'Elige qué documento es.' };
    const d = deps();
    await auditedMutation(
      (doc: { id: string; sha256: string }) => ({
        action: 'empresa.evidencia_subida',
        payload: { documentoId: doc.id, sha256: doc.sha256, tipo },
      }),
      () =>
        subirEvidencia(d, {
          plantillaId: PLANTILLA_IMPUESTOS,
          periodo,
          tipo,
          nombre: archivo.nombre,
          mime: archivo.mime,
          contenido: archivo.contenido,
          hoy: hoyEnMexico(),
          founderId: founder.id,
        }),
    );
    await avanzarDeclaracion(d, { periodo, founderId: founder.id });
    return done(`Guardado: ${archivo.nombre}.`);
  } catch (error) {
    return failed(error, 'subirPapel');
  }
}

export async function pagarDeclaracionAction(_p: FormState, form: FormData): Promise<FormState> {
  try {
    const { founder } = await requireFounder();
    const periodo = field(form, 'periodo');
    await auditedMutation(
      (entry: { id: string } | null) => ({
        action: 'empresa.declaracion_pagada',
        payload: { periodo, entryId: entry?.id ?? null },
      }),
      () =>
        pagarDeclaracion(deps(), {
          periodo,
          fecha: hoyEnMexico(),
          concepto: `ISR e IVA de ${formatMonth(periodo)}`,
          founderId: founder.id,
        }),
    );
    return done('Listo: la declaración quedó pagada.');
  } catch (error) {
    return failed(error, 'pagarDeclaracion');
  }
}
