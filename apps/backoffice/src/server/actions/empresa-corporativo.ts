'use server';

import { createHash } from 'node:crypto';

import {
  actualizarRegistro,
  agregarCertificado,
  registrarEventoAcciones,
} from '@xangarro/application/corp';
import {
  createAgendaRepository,
  createCorpLedgerRepository,
  createCorporativoRepository,
  createDocumentRepository,
} from '@xangarro/data-corp';
import type { Certificado, Socio } from '@xangarro/domain/corp';
import { revalidatePath } from 'next/cache';

import { auditedMutation } from '../audited';
import { hoyEnMexico, requireCorpDb } from '../db/corp';
import { failed } from '../empresa/fallas';
import { requireFounder } from '../founder';
import { field, type FormState } from './form-state';

/**
 * The corporate book's writes (E-06): a share event (and its notice on the
 * Agenda), the administrador, a certificate's serial and expiry, and a
 * registry's status with its proof. Founders only, each audited.
 */
const deps = () => {
  const db = requireCorpDb();
  return {
    corp: createCorporativoRepository(db),
    agenda: createAgendaRepository(db),
    documentos: createDocumentRepository(db),
    ledger: createCorpLedgerRepository(db),
    sha256: async (b: Uint8Array) => createHash('sha256').update(b).digest('hex'),
  };
};

const socioDe = (v: string): Socio | null => (v === '1' ? 1 : v === '2' ? 2 : null);

const done = (message: string): FormState => {
  revalidatePath('/empresa', 'layout');
  return { ok: true, message };
};

export async function registrarEventoAction(_p: FormState, form: FormData): Promise<FormState> {
  try {
    const { founder } = await requireFounder();
    const a = socioDe(field(form, 'a'));
    if (a === null) return { ok: false, message: 'Elige quién recibe las acciones.' };
    const transmision = field(form, 'tipo') === 'transmision';
    const evento = {
      fecha: field(form, 'fecha'),
      tipo: transmision ? ('transmision' as const) : ('suscripcion' as const),
      de: transmision ? (a === 1 ? (2 as const) : (1 as const)) : null,
      a,
      acciones: Number(field(form, 'acciones')),
    };
    await auditedMutation(
      (r: { evento: { id: string } }) => ({
        action: 'empresa.acciones_registradas',
        payload: { eventoId: r.evento.id, ...evento },
      }),
      () =>
        registrarEventoAcciones(deps(), {
          evento,
          nota: field(form, 'nota'),
          founderId: founder.id,
        }),
    );
    return done('Registrado. El aviso de beneficiario controlador ya está en la agenda.');
  } catch (error) {
    return failed(error, 'registrarEvento');
  }
}

export async function guardarAdministradorAction(
  _p: FormState,
  form: FormData,
): Promise<FormState> {
  try {
    const { founder } = await requireFounder();
    const s = socioDe(field(form, 'administrador'));
    if (s === null) return { ok: false, message: 'Elige al administrador.' };
    await auditedMutation({ action: 'empresa.administrador_guardado', payload: { socio: s } }, () =>
      deps().corp.guardarAdministrador(s, founder.id),
    );
    return done('Administrador guardado.');
  } catch (error) {
    return failed(error, 'guardarAdministrador');
  }
}

export async function agregarCertificadoAction(_p: FormState, form: FormData): Promise<FormState> {
  try {
    const { founder } = await requireFounder();
    const tipo = field(form, 'tipo') === 'efirma' ? ('efirma' as const) : ('csd' as const);
    const t = field(form, 'titular');
    const titular = t === 'f1' ? 'f1' : t === 'f2' ? 'f2' : 'mexia';
    const certificado: Omit<Certificado, 'id'> = {
      tipo,
      titular,
      serie: field(form, 'serie'),
      vence: field(form, 'vence'),
    };
    await auditedMutation(
      (c: { id: string }) => ({
        action: 'empresa.certificado_agregado',
        payload: { certificadoId: c.id, tipo, titular },
      }),
      () => agregarCertificado(deps(), { certificado, founderId: founder.id }),
    );
    return done('Certificado guardado.');
  } catch (error) {
    return failed(error, 'agregarCertificado');
  }
}

export async function actualizarRegistroAction(_p: FormState, form: FormData): Promise<FormState> {
  try {
    const { founder } = await requireFounder();
    const f = form.get('archivo');
    const archivo =
      f instanceof File && f.size > 0
        ? { nombre: f.name, mime: f.type, contenido: new Uint8Array(await f.arrayBuffer()) }
        : null;
    const input = {
      id: field(form, 'id'),
      estado: field(form, 'estado'),
      referencia: field(form, 'referencia'),
      siguiente: field(form, 'siguiente'),
      alDia: field(form, 'alDia') === 'si',
      archivo,
      hoy: hoyEnMexico(),
      founderId: founder.id,
    };
    await auditedMutation(
      (r: { id: string; documentoId: string | null }) => ({
        action: 'empresa.registro_actualizado',
        payload: { registroId: r.id, estado: input.estado, documentoId: r.documentoId },
      }),
      () => actualizarRegistro(deps(), input),
    );
    return done('Registro actualizado.');
  } catch (error) {
    return failed(error, 'actualizarRegistro');
  }
}
