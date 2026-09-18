import 'server-only';

import { products } from '@xangarro/data-pg';
import { and, isNotNull, isNull } from 'drizzle-orm';

import { planImport, type Existing, type PlannedRow } from '@/lib/import-plan';
import { parseProductSheet } from '@/lib/import-productos';

import type { Tx } from '../db';
import { readSheet, SheetError } from './read-sheet';

/**
 * Read, parse and plan an uploaded product sheet inside the tenant
 * transaction (P-07). The preview and the commit both call this, so what gets
 * written is always re-derived on the server from the file — never taken from
 * a preview the browser sent back.
 */
async function existingBySku(tx: Tx): Promise<Map<string, Existing>> {
  const rows = await tx
    .select({
      id: products.id,
      sku: products.sku,
      nombre: products.nombre,
      categoria: products.categoria,
      unidad: products.unidad,
      costoUnitCentavos: products.costoUnitCentavos,
      precioVentaCentavos: products.precioVentaCentavos,
      seguirStock: products.seguirStock,
      umbralStockBajo: products.umbralStockBajo,
      icono: products.icono,
    })
    .from(products)
    .where(and(isNull(products.deletedAt), isNotNull(products.sku)));
  return new Map(rows.map(({ sku, ...r }) => [sku as string, r as Existing]));
}

export async function planFromFile(tx: Tx, file: File): Promise<PlannedRow[]> {
  const parsed = parseProductSheet(await readSheet(file));
  if (!parsed.ok) throw new SheetError(parsed.message);
  return planImport(parsed.rows, await existingBySku(tx));
}
