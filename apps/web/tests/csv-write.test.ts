import assert from 'node:assert/strict';
import { describe, it } from 'vitest';

import { parseCsv } from '../src/lib/csv';
import { csvLine, csvNumber, csvText } from '../src/lib/csv-write';

/**
 * The portal's one CSV writer (audit F-15a). A spreadsheet runs a cell that
 * starts with `=`, `+`, `-` or `@` as a formula, and the cells here are typed
 * by an operator at a register, or come out of a file somebody uploaded. So
 * text is written as text, and only what the app computed is a number.
 */
describe('csvText — a cell somebody typed', () => {
  it('leaves ordinary text alone', () => {
    assert.equal(csvText('Ana Robledo'), 'Ana Robledo');
    assert.equal(csvText('14:00 a 20:30'), '14:00 a 20:30');
    assert.equal(csvText(''), '');
  });

  it('quotes what carries the format’s own separators, doubling a quote', () => {
    assert.equal(csvText('López "El Chief", Ana'), '"López ""El Chief"", Ana"');
    assert.equal(csvText('dos\nlíneas'), '"dos\nlíneas"');
    assert.equal(csvText('retorno\rsuelto'), '"retorno\rsuelto"');
  });

  for (const hostile of ['=1+1', '+52 55 1234', '-2+3', '@SUM(A1:A9)', '\t=1+1', '\r=1+1']) {
    it(`puts a quote before ${JSON.stringify(hostile)}, so it is read as text`, () => {
      const [[cell]] = parseCsv(csvText(hostile)) as [[string]];
      assert.equal(cell, `'${hostile}`);
    });
  }

  it('neutralises and quotes a formula that also carries a comma and quotes', () => {
    assert.equal(
      csvText('=HYPERLINK("http://evil.example","ver")'),
      `"'=HYPERLINK(""http://evil.example"",""ver"")"`,
    );
  });

  it('does not touch a sign that is not at the start', () => {
    assert.equal(csvText('Faltó cambio = 20'), 'Faltó cambio = 20');
    assert.equal(csvText('a-b'), 'a-b');
  });
});

describe('csvNumber — a number the app computed', () => {
  it('stays a number, sign and decimals included', () => {
    assert.equal(csvNumber('1234.50'), '1234.50');
    assert.equal(csvNumber('-100.00'), '-100.00');
    assert.equal(csvNumber('0'), '0');
  });

  it('is written as text the moment it is not one', () => {
    assert.equal(csvNumber('-1+1'), `'-1+1`);
    assert.equal(csvNumber('=1'), `'=1`);
    assert.equal(csvNumber('-'), `'-`);
    assert.equal(csvNumber('1,000.00'), '"1,000.00"');
  });
});

describe('csvLine', () => {
  it('joins cells that read back as they were written', () => {
    const line = csvLine([csvText('Pérez, Juan'), csvNumber('-12.50'), csvText('@nota')]);
    assert.deepEqual(parseCsv(line), [['Pérez, Juan', '-12.50', `'@nota`]]);
  });
});
