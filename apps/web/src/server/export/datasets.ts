import 'server-only';

import {
  exportarGastos,
  exportarMovimientosInventario,
  exportarVentas,
  listEmpleados,
  listProductos,
  type EnTx,
} from '@xangarro/data-pg';

import { withExportTenant } from '../db';
import { streamWorkbook, type StreamOptions } from './stream';
import { centavosToPesos, type Column } from './workbook';

/**
 * What the portal can export, and how each becomes a sheet.
 *
 * A closed union rather than an open string: the dataset name arrives in a URL,
 * so anything that is not on this list must fail before it reaches a query. It
 * also means adding an export is one entry here, not a new route.
 *
 * Every export reads through `withExportTenant`, so it is scoped by RLS
 * exactly as the screen it mirrors — an export is a read like any other, and
 * the most damaging place to accidentally widen one — on a pool of its own, so
 * a long one never holds a connection a device is waiting for (DB3-SYNC-05).
 *
 * Ledger exports are the **whole** history, read by their own keyset-batched
 * queries (`exportar*`), never by a screen's list: «Exportar movimientos»
 * once reused the Productos list and stopped at 50 rows (DB2-EXP-01). Each
 * batch is its own short transaction, and is written to the response before
 * the next is read (`stream.ts`, DB3-EXP-01).
 */
export const DATASETS = ['ventas', 'gastos', 'productos', 'movimientos', 'empleados'] as const;
export type Dataset = (typeof DATASETS)[number];

export const isDataset = (v: string): v is Dataset => (DATASETS as readonly string[]).includes(v);

interface Built {
  readonly filename: string;
  readonly body: ReadableStream<Uint8Array>;
}

type Row = Record<string, unknown>;
const text = (v: unknown): string => (v === null || v === undefined ? '' : String(v));

const MOVIMIENTO_COLUMNS: readonly Column<Row>[] = [
  { header: 'Fecha', value: (r) => text(r.fecha) },
  { header: 'Concepto', value: (r) => text(r.concepto), width: 36 },
  { header: 'Clasificación', value: (r) => text(r.clasificacion) },
  { header: 'Monto', value: (r) => centavosToPesos(r.amount as bigint | null) },
  { header: 'Cancelada', value: (r) => (r.cancelada === true ? 'Sí' : 'No') },
];

const PRODUCTO_COLUMNS: readonly Column<Row>[] = [
  { header: 'Producto', value: (r) => text(r.nombre), width: 30 },
  { header: 'SKU', value: (r) => text(r.sku) },
  { header: 'Categoría', value: (r) => text(r.categoria) },
  { header: 'Costo', value: (r) => centavosToPesos(r.costo as bigint | null) },
  { header: 'Precio', value: (r) => centavosToPesos(r.precio as bigint | null) },
  { header: 'Existencias', value: (r) => Number(r.stock ?? 0) },
];

const INVENTARIO_COLUMNS: readonly Column<Row>[] = [
  { header: 'Fecha', value: (r) => text(r.fecha) },
  { header: 'Producto', value: (r) => text(r.producto), width: 30 },
  { header: 'Tipo', value: (r) => text(r.tipo) },
  { header: 'Cantidad', value: (r) => Number(r.cantidad ?? 0) },
  { header: 'Motivo', value: (r) => text(r.motivo) },
];

const EMPLEADO_COLUMNS: readonly Column<Row>[] = [
  { header: 'Nombre', value: (r) => text(r.nombre), width: 28 },
  { header: 'Puesto', value: (r) => text(r.puesto) },
  { header: 'Salario', value: (r) => centavosToPesos(r.salarioCentavos as bigint | null) },
  { header: 'Periodo', value: (r) => text(r.periodo) },
];

/** A catalogue read (bounded by the catalogue's size) as a one-batch export. */
async function* unLote(leer: Promise<readonly Row[]>): AsyncGenerator<readonly Row[]> {
  yield await leer;
}

function lotesDe(dataset: Dataset, enTx: EnTx): AsyncIterable<readonly Row[]> {
  if (dataset === 'ventas') return exportarVentas(enTx) as AsyncIterable<readonly Row[]>;
  if (dataset === 'gastos') return exportarGastos(enTx) as AsyncIterable<readonly Row[]>;
  if (dataset === 'movimientos') {
    return exportarMovimientosInventario(enTx) as AsyncIterable<readonly Row[]>;
  }
  const leer = dataset === 'productos' ? listProductos : listEmpleados;
  return unLote(enTx((tx) => leer(tx) as Promise<readonly Row[]>));
}

const COLUMNS: Record<Dataset, readonly Column<Row>[]> = {
  ventas: MOVIMIENTO_COLUMNS,
  gastos: MOVIMIENTO_COLUMNS,
  productos: PRODUCTO_COLUMNS,
  movimientos: INVENTARIO_COLUMNS,
  empleados: EMPLEADO_COLUMNS,
};

export async function buildExport(
  dataset: Dataset,
  businessId: string,
  options: StreamOptions = {},
): Promise<Built> {
  const stamp = new Date().toISOString().slice(0, 10);
  const enTx: EnTx = (fn) => withExportTenant(businessId, fn);
  const name = dataset.charAt(0).toUpperCase() + dataset.slice(1);
  return {
    filename: `xangarro-${dataset}-${stamp}.xlsx`,
    body: await streamWorkbook(
      { name, columns: COLUMNS[dataset] },
      lotesDe(dataset, enTx),
      options,
    ),
  };
}
