/**
 * Inicio over the phone's own rows (Track M, M-06): the SQLite rows the
 * phone keeps are shaped as the web caja's live read (`TurnoVivoPara`,
 * ADR-118), so `comoInicio` from `@xangarro/caja/inicio` says them exactly
 * as the web does: the same greeting, «Lo primero», KPIs and «Para hoy».
 * The turno's figures come from the caja package's `resumenDelTurno` and
 * `detalleDelTurno`; the expected cash from `partesDelTurno`, the O-03 rule
 * `CerrarCajaUseCase` stores (cash abonos included), the one Mi turno and
 * Cierre use too. Pure.
 */
import { hhmmLocal } from '@xangarro/caja';
import { comoInicio, type Entorno, type InicioData, type StockTarea } from '@xangarro/caja/inicio';
import { comoCuenta } from '@xangarro/caja/cobranza';
import {
  detalleDelTurno,
  partesDelTurno,
  porCobrarDe,
  resumenDelTurno,
  type CierrePara,
  type CuentaPara,
  type CortePara,
  type RecurrentePara,
  type TurnoVivoPara,
} from '@xangarro/caja/lectura';
import { esperadoDe } from '@xangarro/caja/turno';
import type { CajaTurno, RecurringExpense } from '@xangarro/domain';
import type { FilasDelTurno } from '../MiTurno/filas-del-turno';

export interface FilasInicio extends FilasDelTurno {
  /** The operator's open turno, or else the newest one on this device (closed). */
  readonly turno: CajaTurno | null;
  /** Recent turnos on this device, for «Tus últimos cortes». */
  readonly turnos: readonly CajaTurno[];
  /** Recurring gastos already due. */
  readonly recurrentes: readonly RecurringExpense[];
  readonly stock: readonly StockTarea[];
}

/** Rows that belong to this turno: stamped with it, or older rows with no stamp. */
const delTurno = <T extends { cajaTurnoId: string | null; deletedAt: string | null }>(
  xs: readonly T[],
  turnoId: string,
): T[] =>
  xs.filter((x) => x.deletedAt === null && (x.cajaTurnoId === null || x.cajaTurnoId === turnoId));

const DIA_MS = 86_400_000;

/** Whole days from `desde` to `hasta` (`YYYY-MM-DD`); negative when `hasta` is earlier. */
export function diasEntre(desde: string, hasta: string): number {
  return Math.round((Date.parse(`${hasta}T00:00:00Z`) - Date.parse(`${desde}T00:00:00Z`)) / DIA_MS);
}

export const comoRecurrente = (r: RecurringExpense, hoy: string): RecurrentePara => ({
  id: r.id,
  concepto: r.concepto,
  frecuencia: r.frecuencia,
  diaDelMes: r.diaDelMes,
  proveedor: r.proveedor,
  montoCentavos: r.montoCentavos.toString(),
  vence: Math.min(0, diasEntre(hoy, r.proximoDisparo)),
});

/** Closed turnos with a count, newest first, the four the panel lists. */
export function cortesDe(turnos: readonly CajaTurno[]): readonly CortePara[] {
  return turnos
    .filter((t) => t.cierreAt !== null && t.diferenciaCentavos !== null)
    .sort((a, b) => (b.cierreAt ?? '').localeCompare(a.cierreAt ?? ''))
    .slice(0, 4)
    .map((t) => ({ fecha: t.fecha, diferenciaCentavos: String(t.diferenciaCentavos) }));
}

const CERO: CierrePara['resumen'] = {
  ventas: 0,
  cobradoCentavos: '0',
  canceladas: 0,
  canceladoCentavos: '0',
  fiadoCentavos: '0',
  entradas: 0,
  mermas: 0,
};

/** The close figures: the four parts of the expected cash as the use case forms them. */
export function cierreDe(f: FilasDelTurno, t: CajaTurno): CierrePara {
  const partes = partesDelTurno(t, f);
  return {
    desde: hhmmLocal(t.aperturaAt),
    cerrado: t.cierreAt !== null,
    fondoCentavos: partes.fondo.toString(),
    ventasEfectivoCentavos: partes.ventasEfectivo.toString(),
    abonosEfectivoCentavos: partes.abonosEfectivo.toString(),
    gastosEfectivoCentavos: partes.gastosEfectivo.toString(),
    esperadoCentavos: esperadoDe(partes).toString(),
    resumen: resumenDelTurno(delTurno(f.tickets, t.id), f.lineas),
  };
}

const SIN_TURNO: CierrePara = {
  desde: '',
  cerrado: true,
  fondoCentavos: '0',
  ventasEfectivoCentavos: '0',
  abonosEfectivoCentavos: '0',
  gastosEfectivoCentavos: '0',
  esperadoCentavos: '0',
  resumen: CERO,
};

/** The phone's rows as the web's live turno read. */
export function turnoVivoMovil(f: FilasInicio, hoy: string, ahora: Date): TurnoVivoPara {
  const t = f.turno;
  const tickets = t === null ? [] : delTurno(f.tickets, t.id);
  const detalle = detalleDelTurno(
    {
      delTurno: tickets,
      lineas: f.lineas,
      abonos: t === null ? [] : f.abonos.filter((a) => a.deletedAt === null),
      gastos: t === null ? [] : delTurno(f.gastos, t.id),
    },
    new Map(),
  );
  return {
    ...detalle,
    cierre: t === null ? SIN_TURNO : cierreDe(f, t),
    aperturaAt: t?.aperturaAt ?? ahora.toISOString(),
    recurrentes: f.recurrentes.map((r) => comoRecurrente(r, hoy)),
    cortes: cortesDe(f.turnos),
  };
}

/** Everything but the rows: who, where, when, and the sync state. */
export type EntornoMovil = Omit<Entorno, 'stock' | 'cuentas' | 'porCobrar'>;

/**
 * Inicio's data. The accounts (`leerCuentas`, the same read as Fiado y
 * abonos) give «Por cobrar» and the «Cobrar a …» tasks, said by the caja
 * package as the web says them (`porCobrarDe`, `comoCuenta`).
 */
export function inicioMovil(
  f: FilasInicio,
  e: EntornoMovil,
  hoy: string,
  cuentas: readonly CuentaPara[] = [],
): InicioData {
  return comoInicio(turnoVivoMovil(f, hoy, e.ahora), {
    ...e,
    porCobrar: porCobrarDe(cuentas),
    stock: f.stock,
    cuentas: cuentas.map((c) => comoCuenta(c, hoy)),
  });
}
