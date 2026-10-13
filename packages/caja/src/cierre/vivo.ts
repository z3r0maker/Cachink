/**
 * The close, derived (the phone's twin of the web register's `runtime/cierre`
 * and `use-cierre`): the four parts and the esperado from the turno's own
 * rows, the live read as the screen's `CierreData`, the count's state and the
 * payload the close write takes. Pure, so the phone's figures are the web's.
 */

import {
  diferenciaCorte,
  esperadoDelTurno,
  totalContado,
  type ConteoDenominaciones,
  type DiferenciaCorte,
  type Money,
} from '@xangarro/domain';

import { motivoDominio } from '../vocabulario';
import { hhmmLocal } from '../comun/fechas';
import { resumenDelTurno } from '../lectura/cierre-resumen';
import type { CierrePara } from '../lectura/shapes';
import { esperadoDe, type PartesEsperado } from '../turno/desglose';
import type { CerrarVivo, CierreData, MotivoDiferencia } from './types';

/** The rows the calculator reads, already scoped to one open turno. */
export interface FilasCierre {
  readonly turno: {
    readonly id: string;
    readonly aperturaAt: string;
    readonly montoAperturaCentavos: Money;
    readonly efectivoAdicionalCentavos: Money;
  };
  readonly delTurno: readonly {
    readonly id: string;
    readonly cajaTurnoId: string | null;
    readonly metodo: string;
    readonly estadoPago: string;
    readonly cancelledAt: string | null;
    readonly deletedAt: string | null;
  }[];
  readonly lineas: readonly {
    readonly ticketId: string;
    readonly monto: Money;
    readonly deletedAt: string | null;
  }[];
  readonly abonos: readonly {
    readonly metodo: string;
    readonly montoCentavos: Money;
    readonly deletedAt: string | null;
  }[];
  readonly gastos: readonly {
    readonly cajaTurnoId: string | null;
    readonly monto: Money;
    readonly deletedAt: string | null;
  }[];
}

function sum(xs: readonly bigint[]): bigint {
  return xs.reduce((a, b) => a + b, 0n);
}

/** The calculator's four inputs, so the screen can show how it was formed. */
export function partesDeFilas(f: FilasCierre): PartesEsperado {
  const vivas = f.delTurno.filter((t) => t.cancelledAt === null && t.metodo === 'Efectivo');
  const deTicket = new Map<string, bigint>();
  for (const l of f.lineas) {
    if (l.deletedAt !== null) continue;
    deTicket.set(l.ticketId, (deTicket.get(l.ticketId) ?? 0n) + (l.monto as bigint));
  }
  return {
    fondo: f.turno.montoAperturaCentavos + f.turno.efectivoAdicionalCentavos,
    ventasEfectivo: sum(vivas.map((t) => deTicket.get(t.id) ?? 0n)),
    abonosEfectivo: sum(
      f.abonos
        .filter((a) => a.deletedAt === null && a.metodo === 'Efectivo')
        .map((a) => a.montoCentavos as bigint),
    ),
    gastosEfectivo: sum(f.gastos.map((g) => g.monto as bigint)),
  };
}

/** The close figures over the turno's rows: the four parts, the esperado, the resumen. */
export function cierreDeFilas(f: FilasCierre): CierrePara {
  const esperado = esperadoDelTurno(f.turno, f.delTurno, f.lineas, f.abonos, f.gastos);
  const partes = partesDeFilas(f);
  return {
    desde: hhmmLocal(f.turno.aperturaAt),
    cerrado: false,
    fondoCentavos: partes.fondo.toString(),
    ventasEfectivoCentavos: partes.ventasEfectivo.toString(),
    abonosEfectivoCentavos: partes.abonosEfectivo.toString(),
    gastosEfectivoCentavos: partes.gastosEfectivo.toString(),
    esperadoCentavos: esperado.toString(),
    resumen: resumenDelTurno(f.delTurno, f.lineas),
  };
}

/** The live read as Cierre's data; the count starts at zero. */
export function comoCierre(
  c: CierrePara,
  ctx: {
    readonly operador: string;
    readonly caja: string;
    readonly hasta: string;
    readonly dueno: string;
    readonly negocio?: string;
  },
): CierreData {
  return {
    operador: ctx.operador,
    caja: ctx.caja,
    desde: c.desde,
    hasta: ctx.hasta,
    dueno: ctx.dueno,
    ...(ctx.negocio === undefined ? {} : { negocio: ctx.negocio }),
    partes: {
      fondo: BigInt(c.fondoCentavos),
      ventasEfectivo: BigInt(c.ventasEfectivoCentavos),
      abonosEfectivo: BigInt(c.abonosEfectivoCentavos),
      gastosEfectivo: BigInt(c.gastosEfectivoCentavos),
    },
    resumen: {
      ventas: c.resumen.ventas,
      cobrado: BigInt(c.resumen.cobradoCentavos),
      canceladas: c.resumen.canceladas,
      cancelado: BigInt(c.resumen.canceladoCentavos),
      fiado: BigInt(c.resumen.fiadoCentavos),
      entradas: c.resumen.entradas,
      mermas: c.resumen.mermas,
    },
    conteo: {},
  };
}

/** Everything the screen derives from the count, in one place. */
export interface EstadoConteo {
  readonly contado: Money;
  readonly esperado: Money;
  readonly dif: DiferenciaCorte;
  readonly faltaMotivo: boolean;
  readonly faltaNota: boolean;
  readonly puede: boolean;
}

export function estadoDelConteo(
  conteo: ConteoDenominaciones,
  partes: PartesEsperado,
  motivo: MotivoDiferencia | null,
  nota: string,
): EstadoConteo {
  const contado = totalContado(conteo);
  const esperado = esperadoDe(partes);
  const dif = diferenciaCorte(contado, esperado);
  const faltaMotivo = dif.tipo !== 'cuadra' && motivo === null;
  const faltaNota = dif.tipo !== 'cuadra' && motivo === 'Otra razón' && nota.trim() === '';
  return { contado, esperado, dif, faltaMotivo, faltaNota, puede: !faltaMotivo && !faltaNota };
}

/** What the close write takes, built from the screen's state (D6's mapping). */
export function cargaDeCierre(e: {
  readonly tipo: DiferenciaCorte['tipo'];
  readonly motivo: MotivoDiferencia | null;
  readonly nota: string;
  readonly contado: Money;
  readonly conteo: ConteoDenominaciones;
}): Parameters<CerrarVivo>[0] {
  const motivo = e.tipo === 'cuadra' ? null : e.motivo;
  const reason =
    motivo === null ? null : motivoDominio(motivo, e.tipo === 'falta' ? 'falta' : 'sobra');
  const nota = motivo === 'Otra razón' ? e.nota.trim() : '';
  return {
    montoCierreCentavos: e.contado,
    discrepancyReason: reason,
    explicacion: nota === '' ? null : nota,
    denominaciones: { ...e.conteo },
  };
}
