import type { Money } from '../../money/index.js';
import { CATEGORIAS_GASTO, type CategoriaGasto } from '../ledger/accounts.js';
import type { RecurrenteDelMes } from '../ledger/recurrentes.js';
import type { ImporteResultados } from '../resultados/cascada.js';
import type { Montos } from './reglas.js';

/**
 * Budget against actual (E-22, board CD-15d). «Gastado» is what Resultados
 * shows: each category's lines on the day they were invoiced, reversals
 * netted, so bank fees («financiero») stay out. The projection adds the
 * recurring peso charges still to come and, for each month of the period not
 * yet started, its recurring charges plus the category's average of what was
 * not recurring. A dollar charge has no peso amount until it is paid, so it is
 * left out, as in Caja. Pure.
 */
const con = (f: (c: CategoriaGasto) => Money): Montos =>
  Object.fromEntries(CATEGORIAS_GASTO.map((c) => [c, f(c)])) as Record<CategoriaGasto, Money>;

export const montosEnCero = (): Montos => con(() => 0n);

const esCategoria = (c: string): c is CategoriaGasto =>
  (CATEGORIAS_GASTO as readonly string[]).includes(c);

export function gastadoPorCategoria(
  importes: readonly ImporteResultados[],
  desde: string,
  hasta: string,
  excluir: ReadonlySet<string> = new Set(),
): Montos {
  const suma: Record<CategoriaGasto, Money> = { ...montosEnCero() };
  for (const i of importes) {
    if (!esCategoria(i.cuenta) || i.fecha < desde || i.fecha > hasta) continue;
    if (!excluir.has(i.entryId)) suma[i.cuenta] += i.importe;
  }
  return suma;
}

const enMeses = (fecha: string, meses: readonly string[]) => meses.includes(fecha.slice(0, 7));

/** The months' income without IVA (Resultados' «Ingresos»), averaged over all of them. */
export function ingresoPromedio(
  importes: readonly ImporteResultados[],
  meses: readonly string[],
): Money {
  if (meses.length === 0) return 0n;
  const total = importes
    .filter((i) => i.cuenta === 'ingresos' && enMeses(i.fecha, meses))
    .reduce((t, i) => t + i.importe, 0n);
  return total / BigInt(meses.length);
}

/** The month's recurring peso charges not yet registered, by category. */
export function recurrentesPendientes(delMes: readonly RecurrenteDelMes[]): Montos {
  const suma: Record<CategoriaGasto, Money> = { ...montosEnCero() };
  for (const r of delMes) {
    const p = r.plantilla;
    if (r.estado === 'registrado' || p.moneda !== 'MXN' || p.montoEstimado <= 0n) continue;
    suma[p.categoria] += p.montoEstimado;
  }
  return suma;
}

/** Each category's monthly average over the months, recurring charges' entries left out. */
export function promedioNoRecurrente(
  importes: readonly ImporteResultados[],
  meses: readonly string[],
  recurrentes: ReadonlySet<string>,
): Montos {
  if (meses.length === 0) return montosEnCero();
  const dentro = importes.filter((i) => enMeses(i.fecha, meses));
  const total = gastadoPorCategoria(dentro, '0000-01-01', '9999-12-31', recurrentes);
  return con((c) => total[c] / BigInt(meses.length));
}

export interface ProyeccionInput {
  readonly gastado: Montos;
  /** This month's recurring charges still to come. */
  readonly pendientes: Montos;
  /** Each month of the period not yet started: its recurring charges. */
  readonly futuros: readonly Montos[];
  readonly noRecurrente: Montos;
}

export function proyeccionPorCategoria(i: ProyeccionInput): Montos {
  return con(
    (c) =>
      i.gastado[c] + i.pendientes[c] + i.futuros.reduce((t, f) => t + f[c] + i.noRecurrente[c], 0n),
  );
}
