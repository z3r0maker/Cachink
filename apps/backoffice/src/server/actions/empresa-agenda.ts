'use server';

import { createHash } from 'node:crypto';

import {
  agregarVencimiento,
  guardarInscripcion,
  marcarObligacion,
  subirEvidencia,
} from '@xangarro/application/corp';
import { createAgendaRepository, createDocumentRepository } from '@xangarro/data-corp';
import { isTipoEvidencia, type Paso } from '@xangarro/domain/corp';
import { revalidatePath } from 'next/cache';

import { auditedMutation } from '../audited';
import { hoyEnMexico, requireCorpDb } from '../db/corp';
import { failed } from '../empresa/fallas';
import { requireFounder } from '../founder';
import { field, type FormState } from './form-state';

/**
 * The Agenda's writes (E-04): the SAT registration, a dated one-off, an
 * evidence file, a step. Founders only; each leaves its staff audit row
 * after the corp write commits, as in empresa.ts.
 */
const deps = () => {
  const db = requireCorpDb();
  return {
    agenda: createAgendaRepository(db),
    documentos: createDocumentRepository(db),
    sha256: async (b: Uint8Array) => createHash('sha256').update(b).digest('hex'),
  };
};

const done = (message: string): FormState => {
  revalidatePath('/empresa', 'layout');
  return { ok: true, message };
};

const PASOS: readonly Paso[] = ['preparada', 'presentada', 'pagada'];

export async function guardarInscripcionAction(_p: FormState, form: FormData): Promise<FormState> {
  try {
    const { founder } = await requireFounder();
    const fecha = field(form, 'fecha');
    await auditedMutation({ action: 'empresa.inscripcion_guardada', payload: { fecha } }, () =>
      guardarInscripcion(deps().agenda, { fecha, hoy: hoyEnMexico(), founderId: founder.id }),
    );
    return done('Listo: la agenda ya calcula las obligaciones desde esa fecha.');
  } catch (error) {
    return failed(error, 'guardarInscripcion');
  }
}

export async function agregarVencimientoAction(_p: FormState, form: FormData): Promise<FormState> {
  try {
    const { founder } = await requireFounder();
    const input = {
      plantillaId: field(form, 'plantilla'),
      fecha: field(form, 'fecha'),
      titulo: field(form, 'titulo'),
      founderId: founder.id,
    };
    await auditedMutation(
      (o: { id: string }) => ({
        action: 'empresa.vencimiento_agregado',
        payload: { obligacionId: o.id },
      }),
      () => agregarVencimiento(deps().agenda, input),
    );
    return done('Fecha agregada a la agenda.');
  } catch (error) {
    return failed(error, 'agregarVencimiento');
  }
}

export async function subirEvidenciaAction(_p: FormState, form: FormData): Promise<FormState> {
  try {
    const { founder } = await requireFounder();
    const archivo = form.get('archivo');
    const tipo = field(form, 'tipo');
    if (!(archivo instanceof File)) return { ok: false, message: 'Elige el archivo.' };
    if (!isTipoEvidencia(tipo)) return { ok: false, message: 'Elige qué documento es.' };
    const input = {
      plantillaId: field(form, 'plantilla'),
      periodo: field(form, 'periodo'),
      tipo,
      nombre: archivo.name,
      mime: archivo.type,
      contenido: new Uint8Array(await archivo.arrayBuffer()),
      hoy: hoyEnMexico(),
      founderId: founder.id,
    };
    await auditedMutation(
      (d: { id: string; sha256: string }) => ({
        action: 'empresa.evidencia_subida',
        payload: { documentoId: d.id, sha256: d.sha256, tipo },
      }),
      () => subirEvidencia(deps(), input),
    );
    return done(`Guardado: ${archivo.name}.`);
  } catch (error) {
    return failed(error, 'subirEvidencia');
  }
}

export async function marcarObligacionAction(_p: FormState, form: FormData): Promise<FormState> {
  try {
    const { founder } = await requireFounder();
    const nuevo = PASOS.find((p) => p === field(form, 'nuevo'));
    if (nuevo === undefined) return { ok: false, message: 'Elige el paso.' };
    const input = {
      plantillaId: field(form, 'plantilla'),
      periodo: field(form, 'periodo'),
      nuevo,
      sinPago: field(form, 'sinPago') === 'si',
      founderId: founder.id,
    };
    await auditedMutation(
      (o: { id: string; estado: string }) => ({
        action: 'empresa.obligacion_marcada',
        payload: { obligacionId: o.id, estado: o.estado, sinPago: input.sinPago },
      }),
      () => marcarObligacion(deps(), input),
    );
    return done('Listo.');
  } catch (error) {
    return failed(error, 'marcarObligacion');
  }
}
