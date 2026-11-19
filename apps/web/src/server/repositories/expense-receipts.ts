import 'server-only';

import { latestExpenseReceipt, receiptsOfGastos, type ExpenseReceiptFile } from '@xangarro/data-pg';

import type { Tx } from '../db';

/**
 * A gasto's receipt photo as the portal reads it (ADR-149, M-18), bound to
 * one tenant transaction. Read only: the phone is the only writer, through
 * the push, so there is no `create` here. RLS scopes every read.
 */

/** What the Movimientos drawer says about a gasto's receipt. */
export interface ComprobanteGasto {
  /** The receipt row's id: it changes with the photo, so it versions the URL. */
  readonly id: string;
  /** The register that took it, or null when the device row is gone. */
  readonly caja: string | null;
  /** `HH:MM` in Mexico City, when the phone took it. */
  readonly hora: string;
}

const hhmm = (iso: string): string =>
  new Intl.DateTimeFormat('es-MX', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
    timeZone: 'America/Mexico_City',
  }).format(new Date(iso));

export function pgExpenseReceiptsReader(tx: Tx) {
  return {
    /** The bytes the comprobante route serves, or null when the gasto has none. */
    archivo: (gastoId: string): Promise<ExpenseReceiptFile | null> =>
      latestExpenseReceipt(tx, gastoId),
    /** Of `gastoIds`, the ones with a receipt, keyed by gasto. */
    async deGastos(gastoIds: readonly string[]): Promise<ReadonlyMap<string, ComprobanteGasto>> {
      const rows = await receiptsOfGastos(tx, gastoIds);
      return new Map(
        rows.map((r) => [r.gastoId, { id: r.id, caja: r.caja, hora: hhmm(r.tomadaEl) }]),
      );
    },
  };
}
