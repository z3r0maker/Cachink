import assert from 'node:assert/strict';
import { describe, it } from 'vitest';

import { parseCsv } from '../src/lib/csv';

describe('parseCsv (N-16: .csv import files)', () => {
  it('splits plain rows and trims nothing the user typed', () => {
    assert.deepEqual(parseCsv('nombre,telefono,rfc\nDoña Mary,55 1234 5678,'), [
      ['nombre', 'telefono', 'rfc'],
      ['Doña Mary', '55 1234 5678', ''],
    ]);
  });

  it('handles CRLF, a UTF-8 BOM and a trailing newline', () => {
    assert.deepEqual(parseCsv('\uFEFFa,b\r\n1,2\r\n'), [
      ['a', 'b'],
      ['1', '2'],
    ]);
  });

  it('quoted fields keep commas and "" escapes a quote', () => {
    assert.deepEqual(parseCsv('"Pérez, Juan","dice ""hola""",9.8'), [
      ['Pérez, Juan', 'dice "hola"', '9.8'],
    ]);
  });

  it('numbers stay text — pesosToCentavos parses strings like ExcelJS text', () => {
    const rows = parseCsv('concepto,monto\nventa,9.8');
    assert.equal(rows[1]?.[1], '9.8');
  });

  it('an empty file yields no rows', () => {
    assert.deepEqual(parseCsv(''), []);
  });
});
