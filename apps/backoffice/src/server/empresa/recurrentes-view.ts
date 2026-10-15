import { formatDate, formatMoney, parseIsoDate } from '@xangarro/domain';
import {
  ACCOUNTS,
  CATEGORIAS_GASTO,
  type CategoriaGasto,
  type PlantillaRecurrente,
  type RecurrenteDelMes,
} from '@xangarro/domain/corp';

import type { FilaMovimiento, Filtro } from './movimiento-view';

/**
 * Recurring expenses on Movimientos (E-02, boards CD-02 and CD-03): a
 * suggested charge as a row of the month's table, and each template's line
 * on the «Recurrentes» tab.
 */
export type EstadoRecurrenteVista = 'Registrado' | 'Sugerido' | 'Próximo';

export interface FilaRecurrente {
  readonly id: string;
  readonly nombre: string;
  readonly detalle: string;
  readonly categoria: string;
  /** The usual charge in its currency: «USD 20.00», «$3,500.00». */
  readonly monto: string;
  readonly fecha: string;
  readonly estado: EstadoRecurrenteVista;
  /** The entry that registered it, or the Registrar form prefilled with it. */
  readonly href: string | null;
}

/** «USD 20.00» or «$3,500.00»: the template's own currency, never converted. */
export function montoEstimado(p: Pick<PlantillaRecurrente, 'moneda' | 'montoEstimado'>): string {
  const m = formatMoney(p.montoEstimado);
  return p.moneda === 'USD' ? `USD ${m.replace('$', '')}` : m;
}

export function registrarHref(plantillaId: string, mes: string): string {
  return `/empresa/movimientos/registrar?plantilla=${encodeURIComponent(plantillaId)}&mes=${mes}`;
}

const ESTADO: Record<RecurrenteDelMes['estado'], EstadoRecurrenteVista> = {
  registrado: 'Registrado',
  sugerido: 'Sugerido',
  proximo: 'Próximo',
};

function detalleDe(p: PlantillaRecurrente): string {
  return [p.contraparte, p.activo ? 'cada mes' : 'ya no se repite']
    .filter((x): x is string => x !== null && x !== '')
    .join(' · ');
}

export function filaRecurrente(r: RecurrenteDelMes, mes: string): FilaRecurrente {
  const p = r.plantilla;
  return {
    id: p.id,
    nombre: p.nombre,
    detalle: detalleDe(p),
    categoria: ACCOUNTS[p.categoria].nombre,
    monto: montoEstimado(p),
    fecha: formatDate(parseIsoDate(r.fecha)),
    estado: ESTADO[r.estado],
    href:
      r.entryId !== null
        ? `/empresa/movimientos/${r.entryId}`
        : r.estado === 'sugerido'
          ? registrarHref(p.id, mes)
          : null,
  };
}

/** A suggested charge in the month's table: it posts nothing, so it never counts in the totals. */
export function filaSugerida(r: RecurrenteDelMes, mes: string): FilaMovimiento {
  const p = r.plantilla;
  return {
    id: `sugerido-${p.id}`,
    href: registrarHref(p.id, mes),
    fechaIso: r.fecha,
    fecha: formatDate(parseIsoDate(r.fecha)),
    tipo: 'Gasto',
    concepto: p.nombre,
    detalle: [p.contraparte, 'recurrente'].filter((x) => x !== null && x !== '').join(' · '),
    categoria: ACCOUNTS[p.categoria].nombre,
    categoriaKey: p.categoria,
    monto: `−${montoEstimado(p)}`,
    entra: false,
    estado: 'Sugerido',
    filtro: 'gastos',
  };
}

/** `?cat=` → an expense category, else every category. */
export function parseCategoria(value: string | undefined): CategoriaGasto | null {
  return CATEGORIAS_GASTO.find((c) => c === value) ?? null;
}

const plano = (s: string) =>
  s
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .toLowerCase();

/** The search box: concepto or proveedor, ignoring case and accents. */
export function coincide(f: Pick<FilaMovimiento, 'concepto' | 'detalle'>, q: string): boolean {
  const needle = plano(q.trim());
  return needle === '' || plano(`${f.concepto} ${f.detalle}`).includes(needle);
}

export interface FiltroDeFilas {
  readonly ver: Filtro;
  readonly cat: CategoriaGasto | null;
  readonly q: string;
}

/**
 * The month's table: its entries and the suggested charges, newest first,
 * narrowed by type, category and search. A category keeps expenses only.
 */
export function filasDelMes(
  entradas: readonly FilaMovimiento[],
  recurrentes: readonly RecurrenteDelMes[],
  mes: string,
  f: FiltroDeFilas,
): readonly FilaMovimiento[] {
  const sugeridas = recurrentes
    .filter((r) => r.estado === 'sugerido')
    .map((r) => filaSugerida(r, mes));
  return [...entradas, ...sugeridas]
    .filter((x) => f.ver === 'todos' || x.filtro === f.ver)
    .filter((x) => f.cat === null || x.categoriaKey === f.cat)
    .filter((x) => coincide(x, f.q))
    .sort((a, b) => b.fechaIso.localeCompare(a.fechaIso));
}
