import type { Money } from '@xangarro/domain';
import {
  CATEGORIAS_GASTO,
  gastadoPorCategoria,
  ingresoPromedio,
  limiteDeGasto,
  mesesDelLimite,
  presupuestoPendiente,
  presupuestoVigente,
  promedioNoRecurrente,
  proyeccionPorCategoria,
  rangoDelTrimestre,
  recurrentesPendientes,
  trimestreAnterior,
  trimestreAPreparar,
  trimestreDe,
  trimestreSiguiente,
  ultimoDiaDelTrimestre,
  type CategoriaGasto,
  type Montos,
  type Presupuesto,
} from '@xangarro/domain/corp';

import { mesesDelTrimestre, type DatosPresupuesto } from './presupuesto-view';

/**
 * Presupuesto's figures (E-22, board CD-15d), worked out from what the page
 * read: spent and projected by category for the month and for the quarter,
 * the budget in force and the one waiting, the previous quarter's average,
 * and the Límite. Pure.
 */
export interface Gasto {
  readonly gastado: Montos;
  readonly proyeccion: Montos;
}

export interface Calculo {
  readonly hoy: string;
  readonly mes: string;
  readonly trimestre: string;
  readonly anterior: string;
  readonly siguiente: string;
  readonly vigente: Presupuesto | null;
  /** A budget waiting on the other founder, for this quarter or the next. */
  readonly pendiente: Presupuesto | null;
  readonly aPreparar: string | null;
  readonly ingresoPromedio: Money;
  readonly limite: Money;
  readonly delMes: Gasto;
  readonly delTrimestre: Gasto;
  /** The previous quarter's spending, a month on average. */
  readonly promedioAnterior: Montos;
}

const por = (m: Montos, n: bigint): Montos =>
  Object.fromEntries(CATEGORIAS_GASTO.map((c) => [c, m[c] / n])) as Record<CategoriaGasto, Money>;

function gastos(d: DatosPresupuesto, mes: string, trimestre: string) {
  const pendientes = recurrentesPendientes(d.recurrentes.get(mes) ?? []);
  const delMes = gastadoPorCategoria(d.importes, `${mes}-01`, d.hoy);
  const [desde] = rangoDelTrimestre(trimestre);
  const delTrim = gastadoPorCategoria(d.importes, desde, d.hoy);
  const futuros = mesesDelTrimestre(trimestre)
    .filter((m) => m > mes)
    .map((m) => recurrentesPendientes(d.recurrentes.get(m) ?? []));
  const previos = mesesDelLimite(mes);
  const noRecurrente = promedioNoRecurrente(d.importes, previos, d.deRecurrentes);
  const sinFuturos = { gastado: delMes, pendientes, futuros: [], noRecurrente };
  return {
    previos,
    delMes: { gastado: delMes, proyeccion: proyeccionPorCategoria(sinFuturos) },
    delTrimestre: {
      gastado: delTrim,
      proyeccion: proyeccionPorCategoria({ gastado: delTrim, pendientes, futuros, noRecurrente }),
    },
  };
}

export function calculoDe(d: DatosPresupuesto): Calculo {
  const mes = d.hoy.slice(0, 7);
  const trimestre = trimestreDe(d.hoy);
  const anterior = trimestreAnterior(trimestre);
  const siguiente = trimestreSiguiente(trimestre);
  const g = gastos(d, mes, trimestre);
  const ingreso = ingresoPromedio(d.importes, g.previos);
  const [desdeAnt] = rangoDelTrimestre(anterior);
  const hastaAnt = ultimoDiaDelTrimestre(anterior);
  return {
    hoy: d.hoy,
    mes,
    trimestre,
    anterior,
    siguiente,
    vigente: presupuestoVigente(d.presupuestos, trimestre),
    pendiente:
      presupuestoPendiente(d.presupuestos, trimestre) ??
      presupuestoPendiente(d.presupuestos, siguiente),
    aPreparar: trimestreAPreparar(d.presupuestos, d.hoy),
    ingresoPromedio: ingreso,
    limite: limiteDeGasto(ingreso),
    delMes: g.delMes,
    delTrimestre: g.delTrimestre,
    promedioAnterior: por(gastadoPorCategoria(d.importes, desdeAnt, hastaAnt), 3n),
  };
}
