/**
 * The register's turno close (O-36): the expected cash and the turno's
 * figures from its own rows, and the close itself through
 * `CerrarCajaUseCase` — the O-03 calculator decides the expected, the reason
 * rides the domain's enum (mapped from the screen's word, ADR-083 D6).
 */

import { CerrarCajaUseCase } from '@xangarro/application';
import {
  DrizzleCajaTurnosRepository,
  DrizzleClientPaymentsRepository,
  DrizzleExpensesRepository,
  DrizzleSalesRepository,
  DrizzleTicketsRepository,
} from '@xangarro/data';
import { esperadoDelTurno } from '@xangarro/domain';
import { hhmmLocal, hoyLocal } from './fechas';
import type { BusinessId, CajaTurnoId, DiscrepancyReason } from '@xangarro/domain';

import type { Db } from './db-types';
import { resumenDelTurno } from './cierre-resumen';
import type { CierrePara } from './protocol';

/** The open turno's close figures: the four parts, the esperado, the resumen. */
export async function cierreDelTurno(
  db: Db,
  businessId: BusinessId,
  deviceId: string,
  turnoId: string,
): Promise<CierrePara> {
  const turnos = new DrizzleCajaTurnosRepository(db as never, deviceId as never);
  const tickets = new DrizzleTicketsRepository(db as never, deviceId as never);
  const sales = new DrizzleSalesRepository(db as never, deviceId as never);
  const expenses = new DrizzleExpensesRepository(db as never, deviceId as never);
  const payments = new DrizzleClientPaymentsRepository(db as never, deviceId as never);

  const turno = await turnos.findById(turnoId as never);
  if (turno === null) throw new Error('turno no encontrado');
  const delTurno = await tickets.findByCajaTurno(turnoId as never);
  const lineas = await sales.findByDateRange(turno.fecha, hoyLocal() as never, businessId as never);
  const abonos = await payments.findByDateRange(
    turno.fecha,
    hoyLocal() as never,
    businessId as never,
  );
  const gastos = await expenses.findByCajaTurno(turnoId as never);

  const esperado = esperadoDelTurno(turno, delTurno, lineas, abonos, gastos);
  const partes = partesDelTurno(turno, delTurno, lineas, abonos, gastos);
  return {
    desde: hhmmLocal(turno.aperturaAt),
    cerrado: turno.cierreAt !== null,
    fondoCentavos: partes.fondo.toString(),
    ventasEfectivoCentavos: partes.ventasEfectivo.toString(),
    abonosEfectivoCentavos: partes.abonosEfectivo.toString(),
    gastosEfectivoCentavos: partes.gastosEfectivo.toString(),
    esperadoCentavos: esperado.toString(),
    resumen: resumenDelTurno(delTurno, lineas),
  };
}

/** The calculator's four inputs, so the screen can show how it was formed. */
function partesDelTurno(
  turno: { montoAperturaCentavos: bigint; efectivoAdicionalCentavos: bigint },
  delTurno: readonly {
    id: string;
    metodo: string;
    estadoPago: string;
    cancelledAt: string | null;
  }[],
  lineas: readonly { ticketId: string; monto: bigint; deletedAt: string | null }[],
  abonos: readonly { metodo: string; montoCentavos: bigint; deletedAt: string | null }[],
  gastos: readonly { monto: bigint }[],
): { fondo: bigint; ventasEfectivo: bigint; abonosEfectivo: bigint; gastosEfectivo: bigint } {
  const vivas = delTurno.filter((t) => t.cancelledAt === null && t.metodo === 'Efectivo');
  const deTicket = new Map<string, bigint>();
  for (const l of lineas) {
    if (l.deletedAt !== null) continue;
    deTicket.set(l.ticketId, (deTicket.get(l.ticketId) ?? 0n) + (l.monto as bigint));
  }
  return {
    fondo: turno.montoAperturaCentavos + turno.efectivoAdicionalCentavos,
    ventasEfectivo: sum(vivas.map((t) => deTicket.get(t.id) ?? 0n)),
    abonosEfectivo: sum(
      abonos
        .filter((a) => a.deletedAt === null && a.metodo === 'Efectivo')
        .map((a) => a.montoCentavos as bigint),
    ),
    gastosEfectivo: sum(gastos.map((g) => g.monto as bigint)),
  };
}

function sum(xs: readonly bigint[]): bigint {
  return xs.reduce((a, b) => a + b, 0n);
}

/** Close the turno through the real use case (O-36). */
export async function cerrarCaja(
  db: Db,
  p: {
    readonly businessId: BusinessId;
    readonly deviceId: string;
    readonly turnoId: CajaTurnoId;
    readonly montoCierreCentavos: bigint;
    readonly discrepancyReason: DiscrepancyReason | null;
    readonly explicacion: string | null;
    readonly denominaciones: Readonly<Record<string, number>> | null;
  },
): Promise<{ readonly cierreAt: string }> {
  const useCase = new CerrarCajaUseCase(
    new DrizzleCajaTurnosRepository(db as never, p.deviceId as never),
    new DrizzleTicketsRepository(db as never, p.deviceId as never),
    new DrizzleSalesRepository(db as never, p.deviceId as never),
    new DrizzleExpensesRepository(db as never, p.deviceId as never),
    new DrizzleClientPaymentsRepository(db as never, p.deviceId as never),
  );
  const turno = await useCase.execute({
    ...p,
    turnoId: p.turnoId,
    ...(p.denominaciones === null ? {} : { denominaciones: { ...p.denominaciones } }),
  });
  return { cierreAt: turno.cierreAt ?? '' };
}
