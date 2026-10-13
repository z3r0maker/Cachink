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
import { auditOfEntry, failed } from '../empresa/fallas';
import { field, type FormState } from './form-state';

/**
 * The ledger's two writes from the console (E-02, ADR-124 §4): record a
 * movement, reverse one. Founders only. The corp schema lives in its own
 * database, so its write cannot share the audit row's transaction: the entry
 * commits first and carries a form nonce as `sourceRef`, so a retry after a
 * failed audit finds the same entry and audits it instead of posting twice.
 */
export async function registrarMovimiento(_prev: FormState, form: FormData): Promise<FormState> {
  let saved: LedgerEntry;
  try {
    const { founder } = await requireFounder();
    const captura = leerCaptura((name) => field(form, name), founder.id);
    if (!captura.ok) return captura;
    const ledger = createCorpLedgerRepository(requireCorpDb());
    ({ result: saved } = await auditedMutation(auditOfEntry('empresa.movimiento_registrado'), () =>
      new RegistrarMovimientoUseCase(ledger).execute(captura.input),
    ));
  } catch (error) {
    return failed(error, 'registrarMovimiento');
  }
  revalidatePath('/empresa', 'layout');
  // Partner money is read on Socios; everything else in its month.
  redirect(
    saved.lines.some((l) => l.socio !== undefined)
      ? '/empresa/socios'
      : `/empresa/movimientos?mes=${periodOf(saved.fecha) ?? ''}`,
  );
}

export async function revertirMovimiento(_prev: FormState, form: FormData): Promise<FormState> {
  const entryId = field(form, 'entryId');
  try {
    const { founder } = await requireFounder();
    const ledger = createCorpLedgerRepository(requireCorpDb());
    await auditedMutation(auditOfEntry('empresa.movimiento_revertido'), () =>
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
  revalidatePath('/empresa', 'layout');
  redirect(`/empresa/movimientos/${entryId}`);
}
