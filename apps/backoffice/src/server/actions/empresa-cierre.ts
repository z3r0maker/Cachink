'use server';

import { createHash } from 'node:crypto';

import {
  cerrarMes,
  confirmarSaldo,
  pedirReabrir,
  responderReapertura,
  subirDocumento,
  type CierreDeps,
} from '@xangarro/application/corp';
import {
  createCierreRepository,
  createCorpLedgerRepository,
  createDocumentRepository,
  saldoDeBancos,
} from '@xangarro/data-corp';
import { pesosToCentavos } from '@xangarro/domain';
import type { Route } from 'next';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';

import { auditedMutation } from '../audited';
import { almacenParaNuevos } from '../blobs';
import { hoyEnMexico, requireCorpDb } from '../db/corp';
import { archivoDelForm } from '../empresa/archivo';
import { avisarReapertura } from '../empresa/cierre-correo';
import { leerDetalle } from '../empresa/cierre-lectura';
import { fuentesDe, hrefCierre } from '../empresa/cierre-view';
import { failed } from '../empresa/fallas';
import { nombreMes } from '../empresa/fechas';
import { conSello, type Sello } from '../empresa/sello';
import { requireFounder } from '../founder';
import { field, type FormState } from './form-state';

/**
 * Cierre del mes's writes (E-14, boards CD-10 and CD-10b): close, confirm the
 * bank balance, upload the contador's statements, ask to reopen and answer.
 * Founders only, each with its `staff_audit_log` row after the corp write.
 */
const cierreDeps = (hoy: string): CierreDeps => {
  const db = requireCorpDb();
  return {
    cierre: createCierreRepository(db),
    fuentes: async (periodo) => fuentesDe(await leerDetalle(periodo, hoy)),
    saldoDeBancos: (hasta) => saldoDeBancos(db, hasta),
  };
};

const expedienteDeps = () => {
  const db = requireCorpDb();
  return {
    documentos: createDocumentRepository(db, almacenParaNuevos(db)),
    ledger: createCorpLedgerRepository(db),
    sha256: async (b: Uint8Array) => createHash('sha256').update(b).digest('hex'),
  };
};

const volver = (periodo: string, sello?: Sello): never => {
  revalidatePath('/empresa', 'layout');
  const href = hrefCierre(periodo);
  redirect((sello === undefined ? href : conSello(href, sello)) as Route);
};

export async function cerrarMesAction(_p: FormState, form: FormData): Promise<FormState> {
  const periodo = field(form, 'periodo');
  try {
    const { founder } = await requireFounder();
    const hoy = hoyEnMexico();
    await auditedMutation({ action: 'empresa.mes_cerrado', payload: { periodo } }, () =>
      cerrarMes(cierreDeps(hoy), { periodo, mesActual: hoy.slice(0, 7), founderId: founder.id }),
    );
  } catch (error) {
    return failed(error, 'cerrarMes');
  }
  // «Cerrado» lands as a stamp on this one render (ADR-161 «Sello»).
  return volver(periodo, 'cerrado');
}

async function estadoDeCuenta(form: FormData, periodo: string, founderId: string): Promise<void> {
  const archivo = await archivoDelForm(form);
  if (archivo === null) return;
  await auditedMutation(
    (d: { id: string; sha256: string }) => ({
      action: 'empresa.documento_subido',
      payload: { documentoId: d.id, sha256: d.sha256, carpeta: 'comprobantes' },
    }),
    () =>
      subirDocumento(expedienteDeps(), {
        carpeta: 'comprobantes',
        titulo: `Estado de cuenta de ${nombreMes(periodo)} ${periodo.slice(0, 4)}`,
        periodo,
        entryId: null,
        tipo: 'otro',
        archivo,
        hoy: hoyEnMexico(),
        founderId,
      }),
  );
}

export async function confirmarSaldoAction(_p: FormState, form: FormData): Promise<FormState> {
  const periodo = field(form, 'periodo');
  try {
    const { founder } = await requireFounder();
    const saldo = pesosToCentavos(field(form, 'saldo'));
    if (saldo === null) return { ok: false, message: 'Escribe el saldo en pesos, como 48210.55.' };
    await auditedMutation({ action: 'empresa.saldo_confirmado', payload: { periodo } }, () =>
      confirmarSaldo(cierreDeps(hoyEnMexico()), { periodo, saldo, founderId: founder.id }),
    );
    await estadoDeCuenta(form, periodo, founder.id);
  } catch (error) {
    return failed(error, 'confirmarSaldo');
  }
  return volver(periodo);
}

export async function subirEstadosAction(_p: FormState, form: FormData): Promise<FormState> {
  const periodo = field(form, 'periodo');
  try {
    const { founder } = await requireFounder();
    const archivo = await archivoDelForm(form);
    if (archivo === null) return { ok: false, message: 'Elige el archivo.' };
    await auditedMutation(
      (d: { id: string; sha256: string }) => ({
        action: 'empresa.documento_subido',
        payload: { documentoId: d.id, sha256: d.sha256, carpeta: 'estados_financieros' },
      }),
      () =>
        subirDocumento(expedienteDeps(), {
          carpeta: 'estados_financieros',
          titulo: `Estados financieros de ${nombreMes(periodo)} ${periodo.slice(0, 4)}`,
          periodo,
          entryId: null,
          tipo: 'otro',
          archivo,
          hoy: hoyEnMexico(),
          founderId: founder.id,
        }),
    );
  } catch (error) {
    return failed(error, 'subirEstados');
  }
  return volver(periodo);
}

export async function pedirReabrirAction(_p: FormState, form: FormData): Promise<FormState> {
  const periodo = field(form, 'periodo');
  try {
    const { founder } = await requireFounder();
    const motivo = field(form, 'motivo');
    await auditedMutation({ action: 'empresa.reapertura_pedida', payload: { periodo } }, () =>
      pedirReabrir(
        { cierre: createCierreRepository(requireCorpDb()) },
        { periodo, founderId: founder.id, motivo },
      ),
    );
    await avisarReapertura({ periodo, quien: founder, motivo });
  } catch (error) {
    return failed(error, 'pedirReabrir');
  }
  return volver(periodo);
}

export async function responderReaperturaAction(_p: FormState, form: FormData): Promise<FormState> {
  const periodo = field(form, 'periodo');
  const aprobar = field(form, 'respuesta') === 'aprobar';
  try {
    const { founder } = await requireFounder();
    await auditedMutation(
      {
        action: aprobar ? 'empresa.mes_reabierto' : 'empresa.reapertura_rechazada',
        payload: { periodo },
      },
      () =>
        responderReapertura(
          { cierre: createCierreRepository(requireCorpDb()) },
          { periodo, founderId: founder.id, aprobar },
        ),
    );
  } catch (error) {
    return failed(error, 'responderReapertura');
  }
  return volver(periodo);
}
