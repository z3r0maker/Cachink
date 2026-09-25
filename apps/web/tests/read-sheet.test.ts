import assert from 'node:assert/strict';
import type { Worksheet } from 'exceljs';
import { beforeAll, describe, it } from 'vitest';

import { loadExcelJs } from '../src/server/export/workbook';
import { MAX_IMPORT_BYTES, readSheet, SheetError } from '../src/server/import/read-sheet';

/**
 * The upload reader behind Importar (P-07, N-16). The sync spec drives one
 * happy .xlsx through the page; every refusal lives here, where a file can be
 * made to be exactly as broken as the case needs.
 */

const XLSX = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';

// ExcelJS is imported lazily and is large; loading it once here keeps that
// cost out of the first test's 5-second budget on a busy machine. The hook's
// own budget is generous: on a machine at load 30 the cold import alone took 10s.
beforeAll(async () => {
  await loadExcelJs();
}, 30_000);

async function workbook(fill?: (ws: Worksheet) => void): Promise<File> {
  const ExcelJs = await loadExcelJs();
  const wb = new ExcelJs.Workbook();
  if (fill !== undefined) fill(wb.addWorksheet('Productos'));
  const buffer = await wb.xlsx.writeBuffer();
  return new File([buffer], 'productos.xlsx', { type: XLSX });
}

async function refusal(file: File): Promise<string> {
  const err = await readSheet(file).catch((e: unknown) => e);
  assert.ok(err instanceof SheetError, `expected SheetError, got ${String(err)}`);
  assert.equal(err.code, 'SHEET_INVALID');
  return err.message;
}

describe('readSheet — what the cell shows (happy paths)', () => {
  it('an .xlsx gives plain values: numbers stay numbers, rich text and formulas flatten', async () => {
    const file = await workbook((ws) => {
      ws.addRow(['nombre', 'precio', 'alta']);
      ws.addRow([
        { richText: [{ text: 'Taco ' }, { text: 'de pastor' }] },
        9.8,
        new Date('2026-05-12T00:00:00.000Z'),
      ]);
      ws.addRow([{ formula: '1+1', result: 2 }, { text: 'ver', hyperlink: 'https://x.mx' }, null]);
    });
    assert.deepEqual(await readSheet(file), [
      ['nombre', 'precio', 'alta'],
      ['Taco de pastor', 9.8, '2026-05-12'],
      [2, 'ver'],
    ]);
  });

  it('a .csv is read as text, by extension or by type', async () => {
    const byName = new File(['nombre,precio\nGringa,45'], 'productos.csv');
    const byType = new File(['nombre\nGringa'], 'sin-extension', { type: 'text/csv' });
    assert.deepEqual(await readSheet(byName), [
      ['nombre', 'precio'],
      ['Gringa', '45'],
    ]);
    assert.deepEqual(await readSheet(byType), [['nombre'], ['Gringa']]);
  });
});

describe('readSheet — refusals, each with a reason the owner can act on', () => {
  it('an empty file', async () => {
    assert.match(await refusal(new File([], 'productos.xlsx')), /vacío/);
  });

  it('a file over 2 MB', async () => {
    const big = new File([new Uint8Array(MAX_IMPORT_BYTES + 1)], 'productos.xlsx');
    assert.match(await refusal(big), /2 MB/);
  });

  it('a .csv with nothing but whitespace', async () => {
    assert.match(await refusal(new File(['  \n \n'], 'productos.csv')), /no tiene filas/);
  });

  it('bytes that are not a workbook', async () => {
    const junk = new File(['esto no es un xlsx'], 'productos.xlsx', { type: XLSX });
    assert.match(await refusal(junk), /No pudimos leer el archivo/);
  });

  it('a workbook with no worksheets', async () => {
    assert.match(await refusal(await workbook()), /no tiene hojas/);
  });
});
