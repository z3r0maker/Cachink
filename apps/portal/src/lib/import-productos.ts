import {
  InventoryCategoryEnum,
  InventoryUnitEnum,
  ProductIconEnum,
  type InventoryCategory,
  type InventoryUnit,
  type ProductIcon,
} from '@xangarro/domain';

import { pesosToCentavos } from './money';

/**
 * The product import (P-07), as pure functions: a sheet in, typed rows and a
 * plan out. Reading the .xlsx and writing to Postgres are the server's; every
 * rule is here, where it is tested.
 *
 * No `stock_inicial` column: imported products start at zero stock and stock
 * is added with a movement (ADR-081).
 */
export const TEMPLATE_HEADERS = [
  'sku',
  'nombre',
  'categoria',
  'unidad',
  'costo_unitario',
  'precio_venta',
  'seguir_stock',
  'umbral_stock_bajo',
  'icono',
] as const;
type Header = (typeof TEMPLATE_HEADERS)[number];
const REQUIRED: readonly Header[] = [
  'nombre',
  'categoria',
  'unidad',
  'costo_unitario',
  'precio_venta',
];

export const MAX_IMPORT_ROWS = 5_000;

export interface ImportedProduct {
  readonly sku: string | undefined;
  readonly nombre: string;
  readonly categoria: InventoryCategory;
  readonly unidad: InventoryUnit;
  readonly costoUnitCentavos: bigint;
  readonly precioVentaCentavos: bigint;
  readonly seguirStock: boolean;
  readonly umbralStockBajo: number;
  readonly icono: ProductIcon | null;
}

export interface ParsedRow {
  /** The spreadsheet row number the shopkeeper sees (header is row 1). */
  readonly line: number;
  readonly values: ImportedProduct | null;
  readonly errors: readonly string[];
}

export type ParseResult =
  | { readonly ok: true; readonly rows: readonly ParsedRow[] }
  | { readonly ok: false; readonly message: string };

const text = (v: unknown): string => (v === null || v === undefined ? '' : String(v).trim());
const matchEnum = <T extends string>(options: readonly T[], v: string): T | undefined =>
  options.find((o) => o.toLowerCase() === v.toLowerCase());

function yesNo(v: string): boolean | undefined {
  if (v === '') return true;
  if (/^(s[ií]|true|verdadero|1|x)$/i.test(v)) return true;
  if (/^(no|false|falso|0)$/i.test(v)) return false;
  return undefined;
}

type Cells = Readonly<Record<Header, string>>;
type Check = (c: Cells) => [field: keyof ImportedProduct, value: unknown, error: string | null];

const CHECKS: readonly Check[] = [
  (c) => ['sku', c.sku || undefined, null],
  (c) => ['nombre', c.nombre, c.nombre ? null : 'nombre vacío'],
  (c) => {
    const v = matchEnum(InventoryCategoryEnum.options, c.categoria);
    return ['categoria', v, v ? null : `categoria «${c.categoria}» no existe`];
  },
  (c) => {
    const v = matchEnum(InventoryUnitEnum.options, c.unidad);
    return ['unidad', v, v ? null : `unidad «${c.unidad}» no existe`];
  },
  (c) => {
    const v = pesosToCentavos(c.costo_unitario);
    return [
      'costoUnitCentavos',
      v,
      v === null ? `costo_unitario «${c.costo_unitario}» no es un monto` : null,
    ];
  },
  (c) => {
    const v = pesosToCentavos(c.precio_venta);
    return [
      'precioVentaCentavos',
      v,
      v === null ? `precio_venta «${c.precio_venta}» no es un monto` : null,
    ];
  },
  (c) => {
    const v = yesNo(c.seguir_stock);
    return ['seguirStock', v, v === undefined ? 'seguir_stock es sí o no' : null];
  },
  (c) => {
    const v = c.umbral_stock_bajo === '' ? 3 : Number(c.umbral_stock_bajo);
    return [
      'umbralStockBajo',
      v,
      Number.isInteger(v) && v >= 0 ? null : 'umbral_stock_bajo es un entero',
    ];
  },
  (c) => {
    const v = c.icono === '' ? null : matchEnum(ProductIconEnum.options, c.icono);
    return ['icono', v ?? null, v === undefined ? `icono «${c.icono}» no existe` : null];
  },
];

function parseRow(cells: Cells, line: number): ParsedRow {
  const values: Record<string, unknown> = {};
  const errors: string[] = [];
  for (const check of CHECKS) {
    const [field, value, error] = check(cells);
    values[field] = value;
    if (error !== null) errors.push(error);
  }
  return {
    line,
    errors,
    values: errors.length === 0 ? (values as unknown as ImportedProduct) : null,
  };
}

function markDuplicateSkus(rows: ParsedRow[], skus: readonly string[]): ParsedRow[] {
  const lines = new Map<string, number[]>();
  skus.forEach(
    (s, i) =>
      s && lines.set(s.toUpperCase(), [...(lines.get(s.toUpperCase()) ?? []), rows[i]?.line ?? 0]),
  );
  return rows.map((r, i) => {
    const same = lines.get((skus[i] ?? '').toUpperCase()) ?? [];
    if (same.length < 2) return r;
    const error = `SKU repetido en el archivo (filas ${same.join(', ')})`;
    return { line: r.line, values: null, errors: [...r.errors, error] };
  });
}

export function parseProductSheet(table: readonly (readonly unknown[])[]): ParseResult {
  const [head = [], ...body] = table;
  const index = new Map(head.map((h, i) => [text(h).toLowerCase(), i]));
  const missing = REQUIRED.filter((h) => !index.has(h));
  if (missing.length > 0) return { ok: false, message: `Faltan columnas: ${missing.join(', ')}` };

  const data = body
    .map((cells, i) => ({ cells, line: i + 2 }))
    .filter(({ cells }) => cells.some((c) => text(c) !== ''));
  if (data.length > MAX_IMPORT_ROWS) {
    return {
      ok: false,
      message: `El archivo tiene ${data.length} filas; el máximo es ${MAX_IMPORT_ROWS}.`,
    };
  }
  const cells = data.map(
    ({ cells: row }) =>
      Object.fromEntries(TEMPLATE_HEADERS.map((h) => [h, text(row[index.get(h) ?? -1])])) as Cells,
  );
  const rows = cells.map((c, i) => parseRow(c, data[i]?.line ?? 0));
  return {
    ok: true,
    rows: markDuplicateSkus(
      rows,
      cells.map((c) => c.sku),
    ),
  };
}
