import { codigoCanonico } from '@xangarro/domain';

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
 * New or update, by barcode. A code is matched by `codigoCanonico`, so the
 * EAN-13 form of a catalogue product's UPC-A updates it instead of creating a
 * second product with its code (ADR-150); a code two catalogue products
 * already share is refused on the row, since no one product is the one to
 * update. An update never changes the cost (past sales were costed at the old
 * one, ADR-023) nor stock tracking (not in `ProductPatch`): a difference there
 * is an error on the row, never silently dropped.
 *
 * `existingByCodigo` is keyed by `codigoCanonico(sku)`; `repetidos` holds the
 * keys two or more catalogue products share.
 */
export function planImport(
  rows: readonly ParsedRow[],
  existingByCodigo: ReadonlyMap<string, Existing>,
  repetidos: ReadonlySet<string> = new Set(),
): PlannedRow[] {
  return rows.map((r) => {
    if (r.values === null) return { ...r, kind: 'error' };
    const clave = codigoCanonico(r.values.sku);
    if (clave !== null && repetidos.has(clave)) {
      const error = 'ese código lo tienen 2 o más productos de tu catálogo; deja uno solo';
      return { ...r, kind: 'error', values: null, errors: [...r.errors, error] };
    }
    const found = clave === null ? undefined : existingByCodigo.get(clave);
    if (found === undefined) return { ...r, kind: 'nuevo' };
    const errors = frozenChanges(found, r.values);
    if (errors.length > 0) return { ...r, kind: 'error', values: null, errors };
    const values = r.values;
    const changed = EDITABLE.some((k) => found[k] !== values[k]);
    return { ...r, kind: changed ? 'actualizar' : 'sin-cambios', id: found.id };
  });
}
