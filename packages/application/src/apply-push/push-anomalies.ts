/**
 * What a push carries that an honest device would not (security audit
 * 2026-11, F-05 c). **Observed, never refused.**
 *
 * A push is trusted for everything inside its own tenant, and two things it
 * may say cannot be turned into rejections yet: a rejection is terminal for a
 * phone's captured row, and a phone that was linked again legitimately pushes
 * rows it captured under its old device id. So these are reported — by table,
 * row id and field name, never a value — and the row is accepted exactly as
 * before. The log is the evidence a later CHECK or rejection is staged on.
 *
 * Pure: the deltas and the device the token names in, the anomalies out.
 */

import type { Delta, PushableTable } from '@xangarro/contracts';

export type PushAnomalyKind = 'DEVICE_MISMATCH' | 'NEGATIVE_MONEY';

export interface PushAnomaly {
  readonly table: PushableTable;
  readonly rowId: string;
  readonly kind: PushAnomalyKind;
  /** The field that is off. Its value is never carried. */
  readonly field: string;
}

/**
 * Money fields a negative is never written to — only those where code **below
 * the UI** shows it, since a form's check is exactly what another client can
 * leave out:
 *
 * - `client_payments.montoCentavos`: `RegistrarPagoClienteUseCase`, the only
 *   writer, throws `AbonoInvalidoError` on `<= 0`; the turno's calculator
 *   refuses a negative abono (`cierre-turno.ts`).
 * - `tickets.cambioCentavos`: `RegistrarTicketUseCase`, the only writer, sets
 *   it through `#cambio`, which returns 0 for a shortfall.
 *
 * Left out on purpose: what is legitimately negative (`diferenciaCentavos`,
 * `efectivoEsperadoCentavos`), `sales.monto` — the statements model a refund
 * as a negative sale — and what is summed from it (the turno's totals, the
 * cancellation log), and every amount only a form keeps positive.
 */
export const NEVER_NEGATIVE_MONEY: Readonly<Partial<Record<PushableTable, readonly string[]>>> = {
  client_payments: ['montoCentavos'],
  tickets: ['cambioCentavos'],
};

/**
 * Parsed, never asserted (CLAUDE.md §2.8): centavos arrive as a bigint once
 * the contract has parsed them, as a decimal string on the wire, and as an
 * integer from an in-process caller. Anything else is not a negative amount.
 */
function isNegative(value: unknown): boolean {
  if (typeof value === 'bigint') return value < 0n;
  if (typeof value === 'number') return Number.isInteger(value) && value < 0;
  return typeof value === 'string' && /^-\d+$/.test(value) && BigInt(value) < 0n;
}

function anomaliesOf(delta: Delta, tokenDeviceId: string): PushAnomaly[] {
  const row = delta.row as Readonly<Record<string, unknown>>;
  const found: PushAnomaly[] = [];
  const say = (kind: PushAnomalyKind, field: string) =>
    found.push({ table: delta.table, rowId: delta.rowId, kind, field });
  if (row['deviceId'] !== tokenDeviceId) say('DEVICE_MISMATCH', 'deviceId');
  for (const field of NEVER_NEGATIVE_MONEY[delta.table] ?? []) {
    if (isNegative(row[field])) say('NEGATIVE_MONEY', field);
  }
  return found;
}

/** Every anomaly in `deltas`, in their order, for the device the token names. */
export function pushAnomalies(deltas: readonly Delta[], tokenDeviceId: string): PushAnomaly[] {
  return deltas.flatMap((delta) => anomaliesOf(delta, tokenDeviceId));
}
