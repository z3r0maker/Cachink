'use server';

import {
  CerrarDineroDelTrimestreUseCase,
  PagarMitadUseCase,
  PedirFondeoUseCase,
  type CierreDeDinero,
  type FundingCall,
} from '@xangarro/application/corp';
import { createCorpLedgerRepository, createFundingCallRepository } from '@xangarro/data-corp';
import { formatMoney, pesosToCentavos } from '@xangarro/domain';
import { revalidatePath } from 'next/cache';

import { auditedMutation } from '../audited';
import { hoyEnMexico, requireCorpDb } from '../db/corp';
import { auditOfEntry, failed } from '../empresa/fallas';
import { requireFounder } from '../founder';
import { field, type FormState } from './form-state';

/**
 * Socios' writes (E-03, agreement Quinta): ask for funding by halves, record
 * a partner's half, close a quarter's additional money. Founders only, each
 * with its staff audit row; the corp write commits first, as in empresa.ts.
 */
const socioDe = (form: FormData) => (field(form, 'socio') === '2' ? 2 : 1);

const done = (message: string): FormState => {
  revalidatePath('/empresa', 'layout');
  return { ok: true, message };
};

export async function pedirFondeo(_prev: FormState, form: FormData): Promise<FormState> {
  try {
    const { founder } = await requireFounder();
    const total = pesosToCentavos(field(form, 'total'));
    if (total === null) return { ok: false, message: 'Escribe el monto con números.' };
    const calls = createFundingCallRepository(requireCorpDb());
    const { result } = await auditedMutation(
      (call: FundingCall) => ({
        action: 'empresa.fondeo_pedido',
        payload: { callId: call.id, total: call.total.toString(), vence: call.vence },
      }),
      () =>
        new PedirFondeoUseCase(calls).execute({
          concepto: field(form, 'concepto'),
          total,
          vence: field(form, 'vence'),
          hoy: hoyEnMexico(),
          founderId: founder.id,
        }),
    );
    return done(`Listo: cada socio pone ${formatMoney(result.porSocio)}.`);
  } catch (error) {
    return failed(error, 'pedirFondeo');
  }
}

export async function pagarMitad(_prev: FormState, form: FormData): Promise<FormState> {
  try {
    const { founder } = await requireFounder();
    const db = requireCorpDb();
    await auditedMutation(auditOfEntry('empresa.mitad_pagada'), () =>
      new PagarMitadUseCase(
        createFundingCallRepository(db),
        createCorpLedgerRepository(db),
      ).execute({
        callId: field(form, 'callId'),
        socio: socioDe(form),
        fecha: field(form, 'fecha') || hoyEnMexico(),
        founderId: founder.id,
      }),
    );
    return done('Mitad registrada.');
  } catch (error) {
    return failed(error, 'pagarMitad');
  }
}

export async function cerrarDinero(_prev: FormState, form: FormData): Promise<FormState> {
  try {
    const { founder } = await requireFounder();
    const entregables = pesosToCentavos(field(form, 'entregables'));
    if (entregables === null) {
      return { ok: false, message: 'Escribe el valor de los entregables con números.' };
    }
    const trimestre = field(form, 'trimestre');
    const { result } = await auditedMutation(
      (r: CierreDeDinero) => ({
        action: 'empresa.dinero_cerrado',
        payload: {
          trimestre,
          socio: socioDe(form),
          bolsa: r.bolsa.toString(),
          prestamo: r.prestamo.toString(),
          entryId: r.entry?.id ?? null,
        },
      }),
      () =>
        new CerrarDineroDelTrimestreUseCase(createCorpLedgerRepository(requireCorpDb())).execute({
          socio: socioDe(form),
          trimestre,
          entregables,
          hoy: hoyEnMexico(),
          founderId: founder.id,
        }),
    );
    return done(
      `Listo: ${formatMoney(result.bolsa)} cuentan para la bolsa y ${formatMoney(result.prestamo)} quedan como préstamo.`,
    );
  } catch (error) {
    return failed(error, 'cerrarDinero');
  }
}
