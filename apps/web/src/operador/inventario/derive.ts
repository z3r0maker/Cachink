import { matches } from '../ui/search';
import type { Existencia, Movimiento, TipoMovimiento } from './types';

export const porReponer = (e: Existencia): boolean => e.existencias <= e.umbral;

/** «Pastor, tortilla y agua»: the distinct items of one kind, in order, capitalised once. */
export function enLista(
  movs: readonly Movimiento[],
  items: readonly Existencia[],
  tipo: TipoMovimiento,
): string {
  const nombres = [
    ...new Set(
      movs
        .filter((m) => m.tipo === tipo)
        .map((m) => items.find((i) => i.id === m.existenciaId)?.corto ?? ''),
    ),
  ].filter(Boolean);
  const texto =
    nombres.length < 2
      ? (nombres[0] ?? '')
      : `${nombres.slice(0, -1).join(', ')} y ${nombres.at(-1)}`;
  return texto.charAt(0).toUpperCase() + texto.slice(1);
}

export interface ResumenInventario {
  readonly porReponer: number;
  readonly entradas: number;
  readonly mermas: number;
}

export function resumen(
  items: readonly Existencia[],
  movs: readonly Movimiento[],
): ResumenInventario {
  return {
    porReponer: items.filter(porReponer).length,
    entradas: movs.filter((m) => m.tipo === 'Entrada').length,
    mermas: movs.filter((m) => m.tipo === 'Merma').length,
  };
}

export const buscar = (items: readonly Existencia[], query: string): readonly Existencia[] =>
  items.filter((i) => matches(query, i.nombre));

/** Stock after a movement: entries add, write-offs subtract (never below zero). */
export function aplicar(items: readonly Existencia[], m: Movimiento): readonly Existencia[] {
  const delta = m.tipo === 'Entrada' ? m.cantidad : -m.cantidad;
  return items.map((i) =>
    i.id === m.existenciaId ? { ...i, existencias: Math.max(0, i.existencias + delta) } : i,
  );
}

const UNA: Readonly<Record<string, string>> = {
  piezas: 'pieza',
  litros: 'litro',
  metros: 'metro',
  cajas: 'caja',
  bolsas: 'bolsa',
  rollos: 'rollo',
  pares: 'par',
};

/** «8 kg», «1 pieza», «220 piezas»: the unit agrees with the amount. */
export const conUnidad = (n: number, unidad: string): string =>
  `${n} ${n === 1 ? (UNA[unidad] ?? unidad) : unidad}`;

/** «+15 kg», «−2 litros». */
export const delta = (m: Movimiento, unidad: string): string =>
  `${m.tipo === 'Entrada' ? '+' : '−'}${conUnidad(m.cantidad, unidad)}`;

/** The stock bar's fill: the threshold sits at half, twice the threshold fills it. */
export const nivel = (e: Existencia): number =>
  e.umbral <= 0 ? 100 : Math.round(Math.min(e.existencias / (e.umbral * 2), 1) * 100);

/** «Pastor, bistec, queso oaxaca y agua»: the short names of what to restock. */
export function paraReponer(items: readonly Existencia[]): string {
  const nombres = items.filter(porReponer).map((i) => i.corto);
  if (nombres.length === 0) return 'Todo está arriba de su aviso';
  const texto =
    nombres.length < 2
      ? (nombres[0] ?? '')
      : `${nombres.slice(0, -1).join(', ')} y ${nombres.at(-1)}`;
  return texto.charAt(0).toUpperCase() + texto.slice(1);
}
