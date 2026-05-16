/**
 * AuditoriaCadencia — scheduling types for periodic inventory audits.
 *
 * Phase 10 of the Feature Flags plan.
 */

import type { IsoDate } from '../dates/index.js';

export type AuditoriaCadencia =
  | { tipo: 'semanal'; diaSemana: 0 | 1 | 2 | 3 | 4 | 5 | 6 }
  | { tipo: 'quincenal'; diaSemana: 0 | 1 | 2 | 3 | 4 | 5 | 6 }
  | { tipo: 'mensual'; dia: number }
  | { tipo: 'personalizado'; cadaDias: number };

/** Check whether an audit is due based on cadence and last audit date. */
export function isAuditDue(
  cadencia: AuditoriaCadencia,
  lastAuditDate: IsoDate | null,
  today: IsoDate,
): boolean {
  if (lastAuditDate === null) return true;
  const last = new Date(`${lastAuditDate}T00:00:00Z`);
  const now = new Date(`${today}T00:00:00Z`);
  const daysDiff = Math.floor(
    (now.getTime() - last.getTime()) / 86_400_000,
  );

  switch (cadencia.tipo) {
    case 'semanal':
      return daysDiff >= 7;
    case 'quincenal':
      return daysDiff >= 14;
    case 'mensual':
      return daysDiff >= 28;
    case 'personalizado':
      return daysDiff >= cadencia.cadaDias;
  }
}
