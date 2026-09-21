/**
 * The turno's headline figures for the Resumen card (O-36): counts and sums
 * over the turno's own tickets, from the same rows the calculator saw.
 */

import type { CierrePara } from './protocol';

function sum(xs: readonly bigint[]): bigint {
  return xs.reduce((a, b) => a + b, 0n);
}

/** The turno's headline figures, as the Resumen card lists them. */
export function resumenDelTurno(
  delTurno: readonly { id: string; metodo: string; cancelledAt: string | null }[],
  lineas: readonly { ticketId: string; monto: bigint; deletedAt: string | null }[],
): CierrePara['resumen'] {
  const deTicket = new Map<string, bigint>();
  for (const l of lineas) {
    if (l.deletedAt !== null) continue;
    deTicket.set(l.ticketId, (deTicket.get(l.ticketId) ?? 0n) + (l.monto as bigint));
  }
  const total = (id: string) => deTicket.get(id) ?? 0n;
  const vivas = delTurno.filter((t) => t.cancelledAt === null);
  const canceladas = delTurno.filter((t) => t.cancelledAt !== null);
  return {
    ventas: vivas.length,
    cobradoCentavos: sum(vivas.map((t) => total(t.id))).toString(),
    canceladas: canceladas.length,
    canceladoCentavos: sum(canceladas.map((t) => total(t.id))).toString(),
    fiadoCentavos: sum(
      vivas.filter((t) => t.metodo === 'Crédito').map((t) => total(t.id)),
    ).toString(),
    // The register sells without stock movements until the flags wiring; the
    // fixtures' entradas/mermas stay zero on real data.
    entradas: 0,
    mermas: 0,
  };
}
