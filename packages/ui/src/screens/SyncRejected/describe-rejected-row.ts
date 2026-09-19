/**
 * Pure mapping from a rejected sync row to what "No enviados" shows (A-08):
 * a one-line summary of the record, the human reason (ERROR_CATALOG i18n
 * key, single source) and an optional what-to-do hint.
 */

import { ERROR_CATALOG, isKnownErrorCode } from '@xangarro/contracts';
import { formatMoney, type Money } from '@xangarro/domain';
import type { RejectedRow } from '@xangarro/sync';

export interface RejectedRowView {
  readonly key: string;
  /** i18n key under `noEnviados.kinds`. */
  readonly kindKey: string;
  /** Record-specific detail, e.g. "$120.00 · Tacos"; empty when unknown. */
  readonly detail: string;
  readonly reasonKey: string;
  /** Raw server message, shown only when the code has no translation. */
  readonly fallbackMessage: string;
  readonly hintKey: string | null;
  /** Automatic retries are still scheduled — no manual button needed. */
  readonly retrying: boolean;
}

const KIND_BY_TABLE: Readonly<Record<string, string>> = {
  sales: 'venta',
  expenses: 'egreso',
  inventory_movements: 'movimiento',
  caja_turnos: 'turno',
  caja_movimientos: 'movimientoCaja',
  cancelacion_logs: 'cancelacion',
  day_closes: 'corte',
  products: 'producto',
  clients: 'cliente',
  client_payments: 'pago',
};

const HINT_BY_CODE: Readonly<Record<string, string>> = {
  FK_PRODUCT_MISSING: 'noEnviados.hints.productMissing',
  FK_CLIENT_MISSING: 'noEnviados.hints.clientMissing',
  FK_USER_MISSING: 'noEnviados.hints.userMissing',
};

function text(row: Readonly<Record<string, unknown>> | null, field: string): string | null {
  const v = row?.[field];
  return typeof v === 'string' && v.length > 0 ? v : null;
}

function money(row: Readonly<Record<string, unknown>> | null, field: string): string | null {
  const v = row?.[field];
  if (typeof v === 'bigint') return formatMoney(v as Money);
  if (typeof v === 'string' && /^-?\d+$/.test(v)) return formatMoney(BigInt(v) as Money);
  return null;
}

function detailOf(r: RejectedRow): string {
  const parts = [
    money(r.row, 'monto'),
    text(r.row, 'concepto') ?? text(r.row, 'nombre'),
    text(r.row, 'fecha'),
  ];
  return parts.filter((p): p is string => p !== null).join(' · ');
}

export function describeRejectedRow(r: RejectedRow): RejectedRowView {
  const known = isKnownErrorCode(r.code);
  return {
    key: `${r.tableName}:${r.rowId}`,
    kindKey: `noEnviados.kinds.${KIND_BY_TABLE[r.tableName] ?? 'otro'}`,
    detail: detailOf(r),
    reasonKey: known ? ERROR_CATALOG[r.code as keyof typeof ERROR_CATALOG].userMessageKey : '',
    fallbackMessage: r.message,
    hintKey: HINT_BY_CODE[r.code] ?? null,
    retrying: r.retryable,
  };
}
