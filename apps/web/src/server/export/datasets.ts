import 'server-only';

import {
  listEmpleados,
  listMovimientos,
  listMovimientosInventario,
  listProductos,
} from '@xangarro/data-pg';

import { withTenant } from '../db';
import { buildSheet, centavosToPesos, type Column } from './workbook';

/**
 * What the portal can export, and how each becomes a sheet.
 *
 * A closed union rather than an open string: the dataset name arrives in a URL,
 * so anything that is not on this list must fail before it reaches a query. It
 * also means adding an export is one entry here, not a new route.
 *
 * Every export reads through `withTenant`, so it is scoped by RLS exactly as
 * the screen it mirrors — an export is a read like any other, and the most
 * damaging place to accidentally widen one.
 */
export const DATASETS = ['ventas', 'gastos', 'productos', 'movimientos', 'empleados'] as const;
export type Dataset = (typeof DATASETS)[number];

export const isDataset = (v: string): v is Dataset => (DATASETS as readonly string[]).includes(v);

interface Built {
  readonly filename: string;
  readonly bytes: ArrayBuffer;
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

export async function buildExport(dataset: Dataset, businessId: string): Promise<Built> {
  const stamp = new Date().toISOString().slice(0, 10);

  const rows = await withTenant(businessId, async (tx) => {
    if (dataset === 'ventas') return listMovimientos(tx, 'venta');
    if (dataset === 'gastos') return listMovimientos(tx, 'gasto');
    if (dataset === 'productos') return listProductos(tx);
    if (dataset === 'movimientos') return listMovimientosInventario(tx);
    return listEmpleados(tx);
  });

  const columns =
    dataset === 'ventas' || dataset === 'gastos'
      ? MOVIMIENTO_COLUMNS
      : dataset === 'productos'
        ? PRODUCTO_COLUMNS
        : dataset === 'movimientos'
          ? INVENTARIO_COLUMNS
          : EMPLEADO_COLUMNS;

  const sheet = dataset.charAt(0).toUpperCase() + dataset.slice(1);
  return {
    filename: `xangarro-${dataset}-${stamp}.xlsx`,
    bytes: await buildSheet(sheet, columns, rows as readonly Row[]),
  };
}
