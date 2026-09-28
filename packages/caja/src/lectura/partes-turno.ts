/**
 * The four parts of a turno's expected cash from its own rows (O-03, ADR-074
 * §3), scoped exactly as `esperadoDelTurno` scopes them, so the figure a
 * screen shows is the one `CerrarCajaUseCase` stores:
 *
 * - fondo: apertura + adicional;
 * - ventas en efectivo: the lines of this turno's standing Efectivo tickets;
 * - abonos en efectivo: every standing Efectivo abono the caller read (an
 *   abono has no turno; the caller reads the turno's days, as the use case
 *   does);
 * - gastos: this turno's standing gastos (`cajaTurnoId` decides, never a date).
 *
 * The web caja, Inicio, Mi turno and Cierre on the phone read the same parts.
 * Pure.
 */

import { sum, type Money } from '@xangarro/domain';

import type { PartesEsperado } from '../turno/desglose';

interface TurnoFila {
  readonly id: string;
  readonly montoAperturaCentavos: Money;
  readonly efectivoAdicionalCentavos: Money;
}
interface TicketFila {
  readonly id: string;
  readonly cajaTurnoId: string | null;
  readonly metodo: string;
  readonly cancelledAt: string | null;
  readonly deletedAt: string | null;
}
interface LineaFila {
  readonly ticketId: string;
  readonly monto: Money;
  readonly deletedAt: string | null;
}
interface AbonoFila {
  readonly metodo: string;
  readonly montoCentavos: Money;
  readonly deletedAt: string | null;
}
interface GastoFila {
  readonly cajaTurnoId: string | null;
  readonly monto: Money;
  readonly deletedAt: string | null;
}

export interface FilasPartes {
  readonly tickets: readonly TicketFila[];
  readonly lineas: readonly LineaFila[];
  readonly abonos: readonly AbonoFila[];
  readonly gastos: readonly GastoFila[];
}

/** The standing Efectivo abonos' total: the part of the expected cash they add. */
export const abonosEfectivo = (abonos: readonly AbonoFila[]): Money =>
  sum(
    abonos
      .filter((a) => a.deletedAt === null && a.metodo === 'Efectivo')
      .map((a) => a.montoCentavos),
  );

export function partesDelTurno(turno: TurnoFila, f: FilasPartes): PartesEsperado {
  const efectivo = new Set(
    f.tickets
      .filter(
        (t) =>
          t.deletedAt === null &&
          t.cajaTurnoId === turno.id &&
          t.cancelledAt === null &&
          t.metodo === 'Efectivo',
      )
      .map((t) => t.id),
  );
  return {
    fondo: turno.montoAperturaCentavos + turno.efectivoAdicionalCentavos,
    ventasEfectivo: sum(
      f.lineas.filter((l) => l.deletedAt === null && efectivo.has(l.ticketId)).map((l) => l.monto),
    ),
    abonosEfectivo: abonosEfectivo(f.abonos),
    gastosEfectivo: sum(
      f.gastos
        .filter((g) => g.deletedAt === null && g.cajaTurnoId === turno.id)
        .map((g) => g.monto),
    ),
  };
}
