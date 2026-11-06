import { formatDate, formatMoney, parseIsoDate } from '@xangarro/domain';
import {
  ACCOUNTS,
  CATEGORIAS_GASTO,
  type CategoriaGasto,
  type PlantillaRecurrente,
  type RecurrenteDelMes,
} from '@xangarro/domain/corp';

import { fechaCorta } from './fechas';
import type { FilaMovimiento, Filtro } from './movimiento-view';

/**
 * Recurring expenses on Movimientos (E-02, boards CD-02 and CD-03): a
 * suggested charge as a row of the month's table, and each template's line
 * on the «Recurrentes» tab.
 */
export type EstadoRecurrenteVista = 'Registrado' | 'Sugerido' | 'Falta su factura' | 'Próximo';

export interface FilaRecurrente {
  readonly id: string;
  readonly nombre: string;
  readonly detalle: string;
  readonly categoria: string;
  /** The usual charge in its currency: «USD 20.00», «$3,500.00». */
  readonly monto: string;
  readonly fecha: string;
  readonly estado: EstadoRecurrenteVista;
  /** Under the state: «Pídela a …» or «Con su factura del 2 nov» (board CD-01f). */
  readonly nota: string;
  /** The row's button and where it goes: its entry, Registrar prefilled, or Facturas. */
  readonly accion: 'Registrar' | 'Ver' | 'Subir su XML' | null;
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
  falta_factura: 'Falta su factura',
  proximo: 'Próximo',
};

/** «Vercel Inc. · cada mes», or a supplier who invoices by its RFC: «RFC … · factura cada mes». */
function detalleDe(p: PlantillaRecurrente): string {
  const cada = p.rfc === null ? 'cada mes' : 'factura cada mes';
  return [p.rfc === null ? p.contraparte : `RFC ${p.rfc}`, p.activo ? cada : 'ya no se repite']
    .filter((x): x is string => x !== null && x !== '')
    .join(' · ');
}

function notaDe(r: RecurrenteDelMes): string {
  if (r.facturaDel !== null) return `Con su factura del ${fechaCorta(r.facturaDel)}`;
  if (r.estado !== 'falta_factura') return '';
  return `Pídela a ${r.plantilla.contraparte ?? r.plantilla.nombre}`;
}

function accionDe(r: RecurrenteDelMes, mes: string): Pick<FilaRecurrente, 'accion' | 'href'> {
  if (r.entryId !== null) return { accion: 'Ver', href: `/empresa/movimientos/${r.entryId}` };
  if (r.estado === 'sugerido')
    return { accion: 'Registrar', href: registrarHref(r.plantilla.id, mes) };
  if (r.estado === 'falta_factura') return { accion: 'Subir su XML', href: '/empresa/facturas' };
  return { accion: null, href: null };
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
    nota: notaDe(r),
    ...accionDe(r, mes),
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
