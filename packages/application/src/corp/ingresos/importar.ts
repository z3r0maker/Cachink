import { PeriodoCerradoError } from '@xangarro/domain/corp';

import { splitIvaIncluded } from '../../cfdi/iva.js';
import type { CorpLedgerRepository } from '../ports.js';
import { RegistrarMovimientoUseCase } from '../registrar-movimiento.js';
import { RevertirMovimientoUseCase } from '../revertir-movimiento.js';

/**
 * Xangarro's own subscription payments into the corp ledger (E-10, board
 * CD-06i). Each payment is its own «Cobro», keyed by its Stripe id (owner
 * decision, 2026-11-09): running again posts nothing new, a payment that
 * arrives late for a past day still gets in, and a payment refunded in full
 * reverses exactly its entry. A card payment waits in «Stripe por depositar»
 * until its payout, which is not imported yet (it needs N-63's events).
 */
export interface PagoDeXangarro {
  /** The Stripe invoice id. */
  readonly paymentId: string;
  /** `YYYY-MM-DD` in Mexico City. */
  readonly pagadoEl: string;
  /** IVA included, centavos. */
  readonly total: bigint;
  /** The receptor's name; null for a payment without fiscal data. */
  readonly cliente: string | null;
  /** Refunded in full: cancelled, or its credit notes add up to it. */
  readonly reembolsado: boolean;
}

/** Where the payments come from: the ADR-070 tables, never Stripe live. */
export interface RevenueSource {
  pagosDelPeriodo(periodo: string): Promise<readonly PagoDeXangarro[]>;
}

export interface ImportarCobrosDeps {
  readonly ledger: CorpLedgerRepository;
  readonly ingresos: RevenueSource;
}

export interface ResultadoImportacion {
  readonly registrados: number;
  readonly revertidos: number;
  /** Payments or refunds that fall in a closed month, left for the founders. */
  readonly omitidos: number;
}

/** The author of what the import posts: no founder typed it. */
export const IMPORTADOR_COBROS = 'sistema:cobros';
const PROYECTO = 'xangarro';
const PUBLICO = 'Público en general';

type Paso = 'registrado' | 'revertido' | 'omitido' | null;

async function registrar(ledger: CorpLedgerRepository, p: PagoDeXangarro): Promise<Paso> {
  const cliente = p.cliente ?? PUBLICO;
  await new RegistrarMovimientoUseCase(ledger).execute({
    fecha: p.pagadoEl,
    projectId: PROYECTO,
    concepto: `Cobro · ${cliente}`,
    contraparte: cliente,
    founderId: IMPORTADOR_COBROS,
    source: 'billing',
    sourceRef: p.paymentId,
    usd: null,
    deducible: null,
    movement: { kind: 'cobro', ...splitIvaIncluded(p.total), destino: 'stripe_por_depositar' },
  });
  return 'registrado';
}

async function paso(ledger: CorpLedgerRepository, p: PagoDeXangarro, hoy: string): Promise<Paso> {
  const entry = await ledger.findBySource('billing', p.paymentId);
  if (entry === null) return p.reembolsado ? null : registrar(ledger, p);
  if (!p.reembolsado || (await ledger.isReversed(entry.id))) return null;
  await new RevertirMovimientoUseCase(ledger).execute({
    entryId: entry.id,
    fecha: hoy,
    motivo: 'Reembolso en Stripe',
    founderId: IMPORTADOR_COBROS,
  });
  return 'revertido';
}

/** Imports `periodos` (`YYYY-MM`); a closed month is skipped and counted, never forced. */
export async function importarCobros(
  deps: ImportarCobrosDeps,
  input: { readonly periodos: readonly string[]; readonly hoy: string },
): Promise<ResultadoImportacion> {
  const cuenta = { registrados: 0, revertidos: 0, omitidos: 0 };
  for (const periodo of input.periodos) {
    for (const p of await deps.ingresos.pagosDelPeriodo(periodo)) {
      const r = await paso(deps.ledger, p, input.hoy).catch((e: unknown) => {
        if (e instanceof PeriodoCerradoError) return 'omitido' as const;
        throw e;
      });
      if (r !== null) cuenta[`${r}s`] += 1;
    }
  }
  return cuenta;
}
