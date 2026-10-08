'use server';

import {
  RegistrarMovimientoUseCase,
  RevertirMovimientoUseCase,
  type LedgerEntry,
} from '@xangarro/application/corp';
import { createCorpLedgerRepository } from '@xangarro/data-corp';
import { periodOf } from '@xangarro/domain/corp';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';

import { auditedMutation } from '../audited';
import { hoyEnMexico, requireCorpDb } from '../db/corp';
import { leerCaptura } from '../empresa/captura';
import { requireFounder } from '../founder';
import { NotPermitted } from '../staff';
import { field, type FormState } from './form-state';

/**
 * The ledger's two writes from the console (E-02, ADR-124 §4): record a
 * movement, reverse one. Founders only. The corp schema lives in its own
 * database, so its write cannot share the audit row's transaction: the entry
 * commits first and carries a form nonce as `sourceRef`, so a retry after a
 * failed audit finds the same entry and audits it instead of posting twice.
 */
const OWN_MESSAGES: Record<string, string> = {
  MOTIVO_REQUERIDO: 'Escribe por qué lo reviertes.',
};

const DOMAIN_CODES = new Set([
  'CONCEPTO_REQUERIDO',
  'PROYECTO_DESCONOCIDO',
  'PERIODO_CERRADO',
  'MONTO_INVALIDO',
  'TIPO_CAMBIO_INVALIDO',
  'ASIENTO_DESBALANCEADO',
  'MOVIMIENTO_DESCONOCIDO',
  'YA_REVERTIDO',
]);

function failed(error: unknown, what: string): FormState {
  if (error instanceof NotPermitted) return { ok: false, message: error.message };
  const code = error instanceof Error && 'code' in error ? String(error.code) : '';
  const own = OWN_MESSAGES[code];
  if (own !== undefined) return { ok: false, message: own };
  if (DOMAIN_CODES.has(code)) return { ok: false, message: (error as Error).message };
  console.error(`[empresa] ${what} failed`, error);
  return { ok: false, message: 'No se pudo guardar. Intenta de nuevo.' };
}

const audit = (action: string) => (entry: LedgerEntry) => ({
  action,
  payload: { entryId: entry.id, kind: entry.kind, fecha: entry.fecha, source: entry.source },
});

export async function registrarMovimiento(_prev: FormState, form: FormData): Promise<FormState> {
  let saved: LedgerEntry;
  try {
    const { founder } = await requireFounder();
    const captura = leerCaptura((name) => field(form, name), founder.id);
    if (!captura.ok) return captura;
    const ledger = createCorpLedgerRepository(requireCorpDb());
    ({ result: saved } = await auditedMutation(audit('empresa.movimiento_registrado'), () =>
      new RegistrarMovimientoUseCase(ledger).execute(captura.input),
    ));
  } catch (error) {
    return failed(error, 'registrarMovimiento');
  }
  revalidatePath('/empresa/movimientos');
  redirect(`/empresa/movimientos?mes=${periodOf(saved.fecha) ?? ''}`);
}

export async function revertirMovimiento(_prev: FormState, form: FormData): Promise<FormState> {
  const entryId = field(form, 'entryId');
  try {
    const { founder } = await requireFounder();
    const ledger = createCorpLedgerRepository(requireCorpDb());
    await auditedMutation(audit('empresa.movimiento_revertido'), () =>
      new RevertirMovimientoUseCase(ledger).execute({
        entryId,
        fecha: field(form, 'fecha') || hoyEnMexico(),
        motivo: field(form, 'motivo'),
        founderId: founder.id,
      }),
    );
  } catch (error) {
    return failed(error, 'revertirMovimiento');
  }
  revalidatePath('/empresa/movimientos');
  redirect(`/empresa/movimientos/${entryId}`);
}
