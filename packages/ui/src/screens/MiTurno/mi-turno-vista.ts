/**
 * Mi turno over the phone's rows (MvTurno; the web's `turno/viva.tsx`): the
 * rows Inicio reads (`FilasInicio`), said as the web caja's live turno
 * (`turnoVivoMovil` → `comoTurno`), so the expected cash, its breakdown and
 * the figures are the ones Inicio and Cierre show. Plus what the big rows
 * say live: the gastos that left the caja and the recurring one due, fiado
 * and abonos, what to restock, what waits to be sent. Pure.
 */
import { comoTurno, type TurnoData } from '@xangarro/caja/turno';
import { porReponer, type StockTarea } from '@xangarro/caja/inicio';
import { cortoDe, paraReponer, type Existencia } from '@xangarro/caja/inventario';
import { formatMoney, sum, type Money } from '@xangarro/domain';
import type { TurnoRowsVivas, TurnoRowVivo } from '../AppShell/turno-nav';
import { inicialesDe } from '../AppShell/use-shell-data';
import { turnoVivoMovil, type FilasInicio } from '../Inicio/inicio-filas';
import { diaLargo } from '../Inicio/sesion';

export interface MiTurnoVista {
  readonly turno: TurnoData;
  readonly iniciales: string;
  /** «jueves 14 de mayo». */
  readonly dia: string;
  /** Every standing abono of the turno's days, any method («$550.00 en abonos»). */
  readonly abonos: Money;
  readonly stock: readonly StockTarea[];
}

export interface EntornoTurno {
  readonly operador: string;
  readonly caja: string;
  readonly hoy: string;
  readonly ahora: Date;
}

/** The open turno as Mi turno says it; null when there is none open. */
export function miTurnoMovil(f: FilasInicio, e: EntornoTurno): MiTurnoVista | null {
  if (f.turno === null || f.turno.cierreAt !== null) return null;
  const vivo = turnoVivoMovil(f, e.hoy, e.ahora);
  const dia = diaLargo(e.ahora);
  return {
    turno: comoTurno(vivo, e.operador, e.caja),
    iniciales: inicialesDe(e.operador),
    dia: dia.charAt(0).toLowerCase() + dia.slice(1),
    abonos: sum(f.abonos.filter((a) => a.deletedAt === null).map((a) => a.montoCentavos)),
    stock: f.stock,
  };
}

/** «Gas vence hoy», «Gas ya venció», «3 por registrar». */
function chipGastos(t: TurnoData): TurnoRowVivo['chip'] {
  const vencidos = t.pendientes.filter((p) => p.vence <= 0);
  const [uno] = vencidos;
  if (uno === undefined) return undefined;
  if (vencidos.length > 1) return { label: `${vencidos.length} por registrar`, tone: 'red' };
  return { label: `${uno.nombre} ${uno.vence === 0 ? 'vence hoy' : 'ya venció'}`, tone: 'red' };
}

function filaInventario(stock: readonly StockTarea[]): TurnoRowVivo | undefined {
  if (stock.length === 0) return undefined;
  const bajos = stock.filter(porReponer);
  // `paraReponer` reads only the short name and the two numbers of an Existencia.
  const items = stock.map((s) => ({ ...s, corto: cortoDe(s.nombre) }) as unknown as Existencia);
  return {
    detail: paraReponer(items),
    ...(bajos.length > 0 ? { chip: { label: `${bajos.length} por reponer`, tone: 'amber' } } : {}),
  };
}

export interface ColaTurno {
  /** Everything the server has not accepted yet (ADR-123's «por enviar»). */
  readonly porEnviar: number;
  /** Refused rows that need a person (No enviados). */
  readonly rechazados: number;
}

function chipCola(c: ColaTurno): TurnoRowVivo['chip'] {
  if (c.rechazados > 0) return { label: `${c.rechazados} no enviados`, tone: 'red' };
  if (c.porEnviar > 0) return { label: `${c.porEnviar} sin enviar`, tone: 'amber' };
  return { label: 'Todo enviado', tone: 'green' };
}

/** The live detail lines and chips of Mi turno's rows. */
export function filasVivas(v: MiTurnoVista, cola: ColaTurno): TurnoRowsVivas {
  const t = v.turno;
  const gastos = chipGastos(t);
  const inventario = filaInventario(v.stock);
  return {
    gastos: {
      detail: `${formatMoney(t.gastos)} salieron de la caja`,
      ...(gastos ? { chip: gastos } : {}),
    },
    cobranza: {
      detail: `${formatMoney(t.fiado)} fiado hoy · ${formatMoney(v.abonos)} en abonos`,
    },
    ...(inventario ? { inventario } : {}),
    pendientes: { chip: chipCola(cola) },
  };
}
