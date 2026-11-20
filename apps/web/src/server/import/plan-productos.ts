import 'server-only';

import { products } from '@xangarro/data-pg';
import { codigoCanonico } from '@xangarro/domain';
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
async function existingByCodigo(
  tx: Tx,
): Promise<{ porCodigo: Map<string, Existing>; repetidos: Set<string> }> {
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
  // By barcode (ADR-150): UPC-A and EAN-13 meet; a key two products share is
  // remembered, so the plan refuses it instead of updating either.
  const porCodigo = new Map<string, Existing>();
  const repetidos = new Set<string>();
  for (const { sku, ...r } of rows) {
    const clave = codigoCanonico(sku);
    if (clave === null) continue;
    if (porCodigo.has(clave)) repetidos.add(clave);
    porCodigo.set(clave, r as Existing);
  }
  return { porCodigo, repetidos };
}

export async function planFromFile(tx: Tx, file: File): Promise<PlannedRow[]> {
  const parsed = parseProductSheet(await readSheet(file));
  if (!parsed.ok) throw new SheetError(parsed.message);
  const { porCodigo, repetidos } = await existingByCodigo(tx);
  return planImport(parsed.rows, porCodigo, repetidos);
}
