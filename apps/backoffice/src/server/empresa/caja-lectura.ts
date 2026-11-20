import 'server-only';

import {
  createRecurringTemplateRepository,
  listFounders,
  listFundingCalls,
  listPartnerEntries,
  movimientosDeCaja,
  saldosDeCaja,
  ultimoSaldoConfirmado,
} from '@xangarro/data-corp';
import { cuentasDeSocios, recurrentesDelMes } from '@xangarro/domain/corp';

import { requireCorpDb } from '../db/corp';
import type { DatosCaja } from './caja-view';
import { leerImpuestos } from './impuestos-lectura';
import { mesDe } from './impuestos-view';
import { mesesVecinos } from './movimiento-view';
import { nombresDe } from './socios-view';

/**
 * What Caja reads (E-23, board CD-15c): cash up to today, each entry with its
 * kind; Bancos and Stripe por depositar; the last balance confirmed in Cierre
 * del mes; the partners' funding calls and loans; and what comes in the next
 * 30 days: the recurring charges of this month and the next, and the ISR e IVA
 * of last month and this one.
 */
async function recurrentesProximos(mes: string, siguiente: string, hoy: string) {
  const repo = createRecurringTemplateRepository(requireCorpDb());
  const [todas, esteMes, proximo, facturadas] = await Promise.all([
    repo.list(),
    repo.registradasEn(mes),
    repo.registradasEn(siguiente),
    repo.facturadasEn(mes),
  ]);
  return [
    ...recurrentesDelMes(todas, esteMes, mes, hoy, facturadas),
    ...recurrentesDelMes(todas, proximo, siguiente, hoy),
  ];
}

export async function leerCaja(hoy: string): Promise<DatosCaja> {
  const db = requireCorpDb();
  const mes = hoy.slice(0, 7);
  const { anterior, siguiente } = mesesVecinos(mes);
  const [movs, saldos, confirmado, calls, partner, founders, recurrentes, impuestos] =
    await Promise.all([
      movimientosDeCaja(db, hoy),
      saldosDeCaja(db, hoy),
      ultimoSaldoConfirmado(db),
      listFundingCalls(db),
      listPartnerEntries(db),
      listFounders(db),
      recurrentesProximos(mes, siguiente, hoy),
      leerImpuestos(mes, hoy),
    ]);
  return {
    hoy,
    movs,
    saldos,
    confirmado,
    calls,
    cuentas: cuentasDeSocios(partner),
    socios: nombresDe(founders),
    recurrentes,
    impuestos: [mesDe(impuestos, anterior), mesDe(impuestos, mes)].flatMap((m) =>
      m === null ? [] : [m],
    ),
  };
}
