/**
 * Inicio over the phone's own rows (Track M, M-06): the SQLite rows the
 * phone keeps are shaped as the web caja's live read (`TurnoVivoPara`,
 * ADR-118), so `comoInicio` from `@xangarro/caja/inicio` says them exactly
 * as the web does: the same greeting, «Lo primero», KPIs and «Para hoy».
 * The turno's figures come from the caja package's `resumenDelTurno` and
 * `detalleDelTurno`; the expected cash from the phone's own calculator
 * (`computeCajaBalance`, the one Mi turno and Cierre use). Pure.
 */
import { hhmmLocal } from '@xangarro/caja';
import { comoInicio, type Entorno, type InicioData, type StockTarea } from '@xangarro/caja/inicio';
import {
  detalleDelTurno,
  resumenDelTurno,
  type CierrePara,
  type CortePara,
  type RecurrentePara,
  type TurnoVivoPara,
} from '@xangarro/caja/lectura';
import {
  computeCajaBalance,
  type CajaMovimiento,
  type CajaTurno,
  type Expense,
  type RecurringExpense,
  type Sale,
  type Ticket,
} from '@xangarro/domain';
import { buildBalanceInput } from '../Caja/build-balance-input';

export interface FilasInicio {
  /** The operator's open turno, or else the newest one on this device (closed). */
  readonly turno: CajaTurno | null;
  /** The turno day's tickets, lines, gastos, and the turno's cash movements. */
  readonly tickets: readonly Ticket[];
  readonly lineas: readonly Sale[];
  readonly gastos: readonly Expense[];
  readonly movimientos: readonly CajaMovimiento[];
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

function cierreDe(f: FilasInicio, t: CajaTurno): CierrePara {
  const tickets = delTurno(f.tickets, t.id);
  const gastos = delTurno(f.gastos, t.id);
  const saldo = computeCajaBalance(buildBalanceInput(t, tickets, f.lineas, gastos, f.movimientos));
  return {
    desde: hhmmLocal(t.aperturaAt),
    cerrado: t.cierreAt !== null,
    fondoCentavos: t.montoAperturaCentavos.toString(),
    ventasEfectivoCentavos: saldo.desglose.ventasEfectivo.toString(),
    abonosEfectivoCentavos: '0',
    gastosEfectivoCentavos: saldo.desglose.egresosEfectivo.toString(),
    esperadoCentavos: saldo.efectivoEnCaja.toString(),
    resumen: resumenDelTurno(tickets, f.lineas),
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
      abonos: [],
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
 * Inicio's data. Fiado is not on the phone yet (M-08 builds Fiado y abonos),
 * so no «Cobrar a …» task and nothing «por cobrar».
 */
export function inicioMovil(f: FilasInicio, e: EntornoMovil, hoy: string): InicioData {
  return comoInicio(turnoVivoMovil(f, hoy, e.ahora), {
    ...e,
    porCobrar: { monto: 0n, clientes: 0 },
    stock: f.stock,
    cuentas: [],
  });
}
