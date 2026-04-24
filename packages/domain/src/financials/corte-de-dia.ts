/**
 * Corte de Día — nightly cash reconciliation math (CLAUDE.md §10).
 *
 *   efectivoEsperado = saldoCierreAnterior
 *                    + ventasEfectivoHoy
 *                    − egresosEfectivoHoy
 *   diferencia       = efectivoContado − efectivoEsperado
 *
 * "Cash" here means `metodo === 'Efectivo'` only. Transferencias / tarjeta
 * don't enter the cash drawer, so they're not part of the corte.
 *
 * The caller filters ventas + egresos to today's entries. This function
 * doesn't know about dates.
 *
 * We return the structured values; the caller persists (or doesn't) via
 * DayClosesRepository.
 */

import type { Expense } from '../entities/expense.js';
import type { Sale } from '../entities/sale.js';
import type { Money } from '../money/index.js';
import { ZERO, sum } from '../money/index.js';

export interface CorteDeDiaResult {
  esperado: Money;
  diferencia: Money;
}

export interface CorteDeDiaInput {
  ventasHoy: readonly Sale[];
  egresosHoy: readonly Expense[];
  /** Saldo de cierre del corte anterior; 0 when no prior corte exists. */
  saldoCierreAnterior: Money;
  /** What the user counted in the drawer. */
  efectivoContado: Money;
}

export function calculateCorteDeDia(input: CorteDeDiaInput): CorteDeDiaResult {
  const ventasEfectivo = sum(
    input.ventasHoy.filter((v) => v.metodo === 'Efectivo').map((v) => v.monto),
  );
  // Heuristic: in Phase 1 we don't capture "metodo" on egresos, so every
  // egreso is treated as paid in efectivo. This matches the CLAUDE.md §10
  // formula; when egresos gain a metodo field we'll filter here.
  const egresosEfectivo = sum(input.egresosHoy.map((e) => e.monto));

  const esperado = input.saldoCierreAnterior + ventasEfectivo - egresosEfectivo;
  const diferencia = input.efectivoContado - esperado;

  return { esperado, diferencia };
}

/**
 * Convenience: shift a bigint to display "zero" semantics (useful when
 * callers want to distinguish genuine zero from "no calc ran yet").
 */
export const CORTE_ZERO: CorteDeDiaResult = { esperado: ZERO, diferencia: ZERO };
