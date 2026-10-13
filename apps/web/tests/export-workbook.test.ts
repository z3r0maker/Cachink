import assert from 'node:assert/strict';
import { describe, it } from 'vitest';

import {
  buildSheet,
  centavosToPesos,
  loadExcelJs,
  type Column,
} from '../src/server/export/workbook';

/**
 * The portal's per-screen workbook (not the ten-sheet `@xangarro/ui` one):
 * one sheet, a bold header, the columns' own widths, the rows in order, and
 * money as integer centavos in the model, pesos only in the cell.
 */

interface Fila {
  readonly nombre: string;
  readonly monto: bigint | null;
}

const COLUMNAS: readonly Column<Fila>[] = [
  { header: 'Producto', value: (r) => r.nombre, width: 30 },
  { header: 'Monto', value: (r) => centavosToPesos(r.monto) },
];

const FILAS: readonly Fila[] = [
  { nombre: 'Queso Oaxaca', monto: 180_00n },
  { nombre: 'Sin registro', monto: null },
];

describe('loadExcelJs', () => {
  it('lands the namespace wherever the CommonJS bundler put it', async () => {
    const ns = await loadExcelJs();
    assert.equal(typeof ns.Workbook, 'function');
  });
});

describe('centavosToPesos', () => {
  it('integer centavos become pesos; null becomes zero, never NaN', () => {
    assert.equal(centavosToPesos(180_00n), 180);
    assert.equal(centavosToPesos(null), 0);
  });
});

describe('buildSheet', () => {
  it('one sheet, a bold header, the rows in order and money in pesos', async () => {
    const cuando = new Date('2026-09-28T12:00:00.000Z');
    const buffer = await buildSheet('Ventas', COLUMNAS, FILAS, cuando);

    // A real .xlsx: the ZIP local-file magic.
    const bytes = new Uint8Array(buffer);
    assert.equal(bytes[0], 0x50, 'P');
    assert.equal(bytes[1], 0x4b, 'K');

    // Read it back and assert the content reached the cells.
    const ns = await loadExcelJs();
    const wb = new ns.Workbook();
    await wb.xlsx.load(buffer);
    const hoja = wb.worksheets[0];
    assert.equal(hoja?.name, 'Ventas');
    assert.equal(hoja?.getRow(1).getCell(1).value, 'Producto');
    assert.equal(hoja?.getRow(1).font?.bold, true, 'the header is bold');
    assert.equal(hoja?.getRow(2).getCell(1).value, 'Queso Oaxaca');
    assert.equal(hoja?.getRow(2).getCell(2).value, 180);
    assert.equal(hoja?.getRow(3).getCell(2).value, 0, 'null money reads zero');
    assert.equal(wb.creator, 'Xangarro');
  });

  it('a column without a width gets the default', async () => {
    const buffer = await buildSheet('Prueba', COLUMNAS, []);
    const ns = await loadExcelJs();
    const wb = new ns.Workbook();
    await wb.xlsx.load(buffer);
    assert.equal(wb.worksheets[0]?.columns[1]?.width, 18, 'the default width');
    assert.equal(wb.worksheets[0]?.columns[0]?.width, 30, 'the given width');
  });
});
