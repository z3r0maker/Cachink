/**
 * The Asesor's deterministic insights (P-26, ADR-056's "deterministic layer").
 *
 * Five detectors, each computed from the tenant's own rows — never a model:
 *   1. `costo-subio`   — a product's purchase cost rose ≥ 10% against its
 *                        previous entrada.
 *   2. `quincena`      — last complete month's ventas concentrated in one
 *                        half (≥ 65%).
 *   3. `gasto-fuera`   — this month's spend in a category ≥ 30% above its
 *                        three prior months' average.
 *   4. `inventario-quieto` — stock on the shelf with no movement for 45 days.
 *   5. `gasto-duplicado`  — two egresos with the same concepto and monto
 *                        within 72 hours.
 *
 * Every insight carries a deterministic `clave` (its identity across
 * recomputes — the notices row is keyed by it) and an `urgencia` ranking, which
 * is what the weekly tier truncates to (ADR-059: tiering governs how many
 * asesor rows a plan receives). Thresholds are constants, stated once, so a
 * change to them is a reviewable line.
 */

import type { IsoDate } from '../dates/index.js';
import type { Money } from '../money/index.js';

import { gastosDuplicados } from './insights-duplicados.js';
import { gastosFueraDeLoNormal, gastosPorMitadDeMes } from './insights-gastos.js';

/** The venta fields the detectors read — structural, so any store can feed them. */
export interface VentaInsight {
  readonly fecha: IsoDate;
  readonly monto: Money;
}

/** The gasto fields the detectors read. */
export interface GastoInsight {
  readonly id: string;
  readonly fecha: IsoDate;
  readonly concepto: string;
  readonly categoria: string;
  readonly monto: Money;
}

/** The raw rows the detectors read, fetched by the portal in one pass. */
export interface InsightRows {
  readonly hoy: IsoDate;
  /** Ventas of the last two complete months plus the current one. */
  readonly ventas: readonly VentaInsight[];
  /** Egresos of the last four months (current + three for the baseline). */
  readonly egresos: readonly GastoInsight[];
  /** Purchase entries (`inventory_movements` tipo entrada), oldest first. */
  readonly entradas: readonly EntradaInsight[];
  readonly productos: readonly { readonly id: string; readonly nombre: string }[];
  /** Current stock per product, from the same snapshot the Balance values. */
  readonly stock: readonly { readonly productoId: string; readonly cantidad: number }[];
  /** Last movement date per product, `null` when it never moved. */
  readonly ultimoMovimiento: readonly {
    readonly productoId: string;
    readonly fecha: IsoDate | null;
  }[];
}

export interface EntradaInsight {
  readonly productoId: string;
  readonly fecha: IsoDate;
  readonly costoUnitCentavos: Money;
}

export type InsightKind =
  | 'costo-subio'
  | 'quincena'
  | 'gasto-fuera'
  | 'inventario-quieto'
  | 'gasto-duplicado';

export interface Insight {
  readonly kind: InsightKind;
  readonly severity: 'critical' | 'warning' | 'info';
  /** Rank for the weekly tier: higher is shown first. */
  readonly urgencia: number;
  readonly title: string;
  readonly body: string;
  readonly ctaLabel: string;
  readonly ctaHref: string;
  /** The insight's identity: stable across recomputes of the same subject. */
  readonly clave: string;
  /** Money at stake, for the ranking; absent when there is none. */
  readonly monto?: Money;
}

export const URGENCIA_BASE: Readonly<Record<InsightKind, number>> = {
  'gasto-duplicado': 50,
  'gasto-fuera': 40,
  'costo-subio': 30,
  'inventario-quieto': 20,
  quincena: 10,
};

export const ym = (fecha: IsoDate) => fecha.slice(0, 7);
export const day = (fecha: IsoDate) => Number(fecha.slice(8, 10));

/** `hoy`'s month minus `n`, as `YYYY-MM`. */
export function mesAnterior(hoy: IsoDate, n: number): string {
  const [y, m] = hoy.split('-').map(Number) as [number, number];
  const d = new Date(Date.UTC(y, m - 1 - n, 1));
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}`;
}

export function calcularInsights(rows: InsightRows): readonly Insight[] {
  return [
    ...costosQueSubieron(rows),
    ...gastosPorMitadDeMes(rows),
    ...gastosFueraDeLoNormal(rows),
    ...inventarioQuieto(rows),
    ...gastosDuplicados(rows),
  ];
}

/** 1 · A product's cost rose ≥ COSTO_DELTA against its previous entrada. */
const COSTO_DELTA_PCT = 10;

function costosQueSubieron(rows: InsightRows): readonly Insight[] {
  const porProducto = new Map<string, EntradaInsight[]>();
  for (const e of rows.entradas) {
    const lista = porProducto.get(e.productoId) ?? [];
    lista.push(e);
    porProducto.set(e.productoId, lista);
  }
  const nombre = new Map(rows.productos.map((p) => [p.id, p.nombre]));
  const out: Insight[] = [];
  for (const [productoId, entradas] of porProducto) {
    if (entradas.length < 2) continue;
    const ordenadas = [...entradas].sort((a, b) => a.fecha.localeCompare(b.fecha));
    const previa = ordenadas.at(-2);
    const ultima = ordenadas.at(-1);
    if (previa === undefined || ultima === undefined || previa.costoUnitCentavos === 0n) continue;
    const alza = Number(
      ((ultima.costoUnitCentavos - previa.costoUnitCentavos) * 100n) / previa.costoUnitCentavos,
    );
    if (alza < COSTO_DELTA_PCT) continue;
    out.push({
      kind: 'costo-subio',
      severity: 'warning',
      urgencia: URGENCIA_BASE['costo-subio'] + alza,
      title: `El ${nombre.get(productoId) ?? 'producto'} te cuesta ${alza}% más`,
      body: `Pasó de ${fmt(previa.costoUnitCentavos)} a ${fmt(ultima.costoUnitCentavos)} por pieza en tu última compra. Revisa tu precio de venta para no perder margen.`,
      ctaLabel: 'Revisar producto',
      ctaHref: '/productos',
      clave: `costo-subio:${productoId}:${ym(ultima.fecha)}`,
      monto: ultima.costoUnitCentavos - previa.costoUnitCentavos,
    });
  }
  return out;
}

/** 4 · Stock on the shelf with no movement for ≥ DIAS_QUIETO days. */
const DIAS_QUIETO = 45;
const DIA_MS = 86_400_000;

function inventarioQuieto(rows: InsightRows): readonly Insight[] {
  const hoyMs = Date.parse(`${rows.hoy}T00:00:00Z`);
  const stock = new Map(
    rows.stock.filter((s) => s.cantidad > 0).map((s) => [s.productoId, s.cantidad]),
  );
  const ultimo = new Map(rows.ultimoMovimiento.map((m) => [m.productoId, m.fecha]));
  const nombre = new Map(rows.productos.map((p) => [p.id, p.nombre]));
  const out: Insight[] = [];
  for (const [productoId, cantidad] of stock) {
    const fecha = ultimo.get(productoId);
    if (fecha === undefined || fecha === null) continue;
    const dias = Math.floor((hoyMs - Date.parse(`${fecha}T00:00:00Z`)) / DIA_MS);
    if (dias < DIAS_QUIETO) continue;
    out.push({
      kind: 'inventario-quieto',
      severity: 'info',
      urgencia: URGENCIA_BASE['inventario-quieto'] + dias,
      title: `${nombre.get(productoId) ?? 'Un producto'} lleva ${dias} días sin moverse`,
      body: `Tienes ${cantidad} en existencia sin entradas ni ventas en más de ${DIAS_QUIETO} días. Una promo o un ajuste de compra puede liberar ese dinero.`,
      ctaLabel: 'Ver productos',
      ctaHref: '/productos',
      clave: `inventario-quieto:${productoId}`,
    });
  }
  return out;
}

/** The weekly tier sees the top `n` by urgencia (ADR-059's tiering). */
export function filtrarPorCadencia(
  insights: readonly Insight[],
  cadencia: 'semanal' | 'diario' | 'completo',
): readonly Insight[] {
  const top = cadencia === 'semanal' ? 2 : insights.length;
  return [...insights].sort((a, b) => b.urgencia - a.urgencia).slice(0, top);
}

export const diasEntre = (a: IsoDate, b: IsoDate): number =>
  Math.round((Date.parse(`${b}T00:00:00Z`) - Date.parse(`${a}T00:00:00Z`)) / DIA_MS);

export const fmt = (m: Money) => {
  const pesos = Number(m) / 100;
  return `$${pesos.toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
};

export const MESES = [
  'enero',
  'febrero',
  'marzo',
  'abril',
  'mayo',
  'junio',
  'julio',
  'agosto',
  'septiembre',
  'octubre',
  'noviembre',
  'diciembre',
];
export const nombreMes = (mes: string) => MESES[Number(mes.slice(5, 7)) - 1] ?? mes;
