import assert from 'node:assert/strict';
import { describe, it } from 'vitest';

import { parseCsv } from '../src/lib/csv';
import { erroresCsv } from '../src/app/(portal)/importar/errores-csv';
import type { PreviewRow } from '../src/server/import/templates';

/**
 * «Descargar errores» (P-07): the rows of an import that need fixing, as a
 * CSV the owner opens in a spreadsheet. Every cell but the row number came
 * out of the file they uploaded, so none of them may run as a formula
 * (audit F-15a).
 */
const row = (over: Partial<PreviewRow>): PreviewRow => ({
  line: 2,
  kind: 'error',
  sku: 'TAC-001',
  nombre: 'Taco de pastor',
  errors: ['Falta el precio'],
  ...over,
});

describe('erroresCsv', () => {
  it('lists only the rows that need fixing, under the header', () => {
    const csv = erroresCsv([
      row({ line: 2 }),
      row({ line: 3, kind: 'nuevo' }),
      row({ line: 4, sku: 'GRI-002', nombre: 'Gringa', errors: ['Sin nombre', 'Sin costo'] }),
    ]);
    assert.deepEqual(parseCsv(csv), [
      ['fila', 'sku', 'nombre', 'motivo'],
      ['2', 'TAC-001', 'Taco de pastor', 'Falta el precio'],
      ['4', 'GRI-002', 'Gringa', 'Sin nombre; Sin costo'],
    ]);
  });

  it('writes a formula from the uploaded file as text', () => {
    const csv = erroresCsv([
      row({
        sku: "=cmd|' /C calc'!A0",
        nombre: '+52 "Tacos", S.A.',
        errors: ['@SUM(A1) no es un precio', '-1'],
      }),
    ]);
    const [, cells] = parseCsv(csv) as [string[], string[]];
    assert.deepEqual(cells, [
      '2',
      `'=cmd|' /C calc'!A0`,
      `'+52 "Tacos", S.A.`,
      `'@SUM(A1) no es un precio; -1`,
    ]);
  });
});
