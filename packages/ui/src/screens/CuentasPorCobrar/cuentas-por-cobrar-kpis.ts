/**
 * Pure helpers for Cuentas por Cobrar KPIs (Slice 2 C30).
 *
 * diasPromedioCobranza: average age (in days) of pending/parcial
 * Crédito ventas at a reference date. Returns 0 when no pending
 * sales exist.
 */

import type { IsoDate, Sale } from '@cachink/domain';

export function daysBetween(from: IsoDate | string, to: IsoDate | string): number {
  const a = new Date(`${from}T00:00:00.000Z`).getTime();
  const b = new Date(`${to}T00:00:00.000Z`).getTime();
  if (Number.isNaN(a) || Number.isNaN(b)) return 0;
  return Math.max(0, Math.round((b - a) / (1000 * 60 * 60 * 24)));
}

export function diasPromedioCobranza(
  pendingSales: readonly Sale[],
  today: IsoDate | string,
): number {
  if (pendingSales.length === 0) return 0;
  const total = pendingSales.reduce((acc, v) => acc + daysBetween(v.fecha, today), 0);
  return Math.round(total / pendingSales.length);
}
