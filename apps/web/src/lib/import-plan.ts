import type { ImportedProduct, ParsedRow } from './import-productos';

/** The product as stored, for everything an import row is compared against. */
export interface Existing extends Omit<ImportedProduct, 'sku'> {
  readonly id: string;
}

/** Fields an update may change; a row equal on all of them is «sin cambios». */
const EDITABLE = [
  'nombre',
  'categoria',
  'unidad',
  'precioVentaCentavos',
  'umbralStockBajo',
  'icono',
] as const satisfies readonly (keyof ImportedProduct)[];

/** What an import may not change on an existing product, and why (ADR-023, `ProductPatch`). */
function frozenChanges(found: Existing, v: ImportedProduct): string[] {
  const errors: string[] = [];
  if (found.costoUnitCentavos !== v.costoUnitCentavos) {
    errors.push('el costo de un producto existente no cambia aquí; usa un movimiento');
  }
  if (found.seguirStock !== v.seguirStock) {
    errors.push('llevar existencias de un producto existente no cambia aquí');
  }
  return errors;
}

export interface PlannedRow extends ParsedRow {
  readonly kind: 'nuevo' | 'actualizar' | 'sin-cambios' | 'error';
  /** The product an `actualizar` row changes. */
  readonly id?: string;
}

/**
 * New or update, by SKU. An update never changes the cost (past sales were
 * costed at the old one, ADR-023) nor stock tracking (not in `ProductPatch`):
 * a difference there is an error on the row, never silently dropped.
 */
export function planImport(
  rows: readonly ParsedRow[],
  existingBySku: ReadonlyMap<string, Existing>,
): PlannedRow[] {
  return rows.map((r) => {
    if (r.values === null) return { ...r, kind: 'error' };
    const found = r.values.sku === undefined ? undefined : existingBySku.get(r.values.sku);
    if (found === undefined) return { ...r, kind: 'nuevo' };
    const errors = frozenChanges(found, r.values);
    if (errors.length > 0) return { ...r, kind: 'error', values: null, errors };
    const values = r.values;
    const changed = EDITABLE.some((k) => found[k] !== values[k]);
    return { ...r, kind: changed ? 'actualizar' : 'sin-cambios', id: found.id };
  });
}
