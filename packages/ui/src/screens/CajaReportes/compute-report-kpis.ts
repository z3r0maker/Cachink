/**
 * computeReportKpis — pure KPI computation for the Caja Reportes screen.
 *
 * Extracted to keep CajaReportesScreen under 40 lines and complexity 12.
 */

import type { CajaTurno } from '@cachink/domain';

export interface ReportKpis {
  totalTurnos: number;
  turnosConDiferencia: number;
  promedioDiferencia: bigint;
}

export function computeReportKpis(turnos: readonly CajaTurno[]): ReportKpis {
  const totalTurnos = turnos.length;

  const turnosConDiferencia = turnos.filter(
    (tn) => tn.diferenciaCentavos !== null && tn.diferenciaCentavos !== 0n,
  ).length;

  const promedioDiferencia = computeAvgDiferencia(turnos);

  return { totalTurnos, turnosConDiferencia, promedioDiferencia };
}

function computeAvgDiferencia(turnos: readonly CajaTurno[]): bigint {
  if (turnos.length === 0) return 0n;
  const closed = turnos.filter((tn) => tn.diferenciaCentavos !== null);
  if (closed.length === 0) return 0n;
  const sum = closed.reduce(
    (acc, tn) => acc + (tn.diferenciaCentavos ?? 0n),
    0n,
  );
  return sum / BigInt(closed.length);
}
