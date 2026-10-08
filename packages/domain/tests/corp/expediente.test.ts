import assert from 'node:assert/strict';
import { describe, it } from 'vitest';

import {
  carpetaDeAutoridad,
  CARPETAS,
  historial,
  isCarpeta,
  periodoValido,
  vigentes,
} from '../../src/corp/index.js';

/** E-05: the Expediente's folders and every document's versions. */
describe('the folders', () => {
  it('are the board’s eight, in order', () => {
    assert.deepEqual(
      CARPETAS.map((c) => c.nombre),
      [
        'Constitución',
        'SAT',
        'Secretaría de Economía',
        'IMPI',
        'Estados financieros',
        'Contratos',
        'Acuerdo de socios',
        'Comprobantes',
      ],
    );
    assert.equal(isCarpeta('sat'), true);
    assert.equal(isCarpeta('papelera'), false);
  });

  it('file an obligation’s evidence under its authority', () => {
    assert.equal(carpetaDeAutoridad('SAT'), 'sat');
    assert.equal(carpetaDeAutoridad('Economía'), 'economia');
    assert.equal(carpetaDeAutoridad('IMPI'), 'impi');
  });

  it('take a month or a year as the period, or none', () => {
    assert.equal(periodoValido('2026-09'), true);
    assert.equal(periodoValido('2026'), true);
    assert.equal(periodoValido(''), true);
    assert.equal(periodoValido('sept'), false);
    assert.equal(periodoValido('2026-13'), false);
  });
});

describe('versions', () => {
  // a ← b ← c is one document in three versions; d stands alone.
  const docs = [
    { id: 'a', reemplazaA: null },
    { id: 'b', reemplazaA: 'a' },
    { id: 'c', reemplazaA: 'b' },
    { id: 'd', reemplazaA: null },
  ];

  it('keeps only the newest version of each document current, with its number', () => {
    assert.deepEqual(
      vigentes(docs).map((v) => [v.doc.id, v.version]),
      [
        ['c', 3],
        ['d', 1],
      ],
    );
  });

  it('shows the whole history of a document from any of its versions, newest first', () => {
    assert.deepEqual(
      historial(docs, 'a').map((v) => [v.doc.id, v.version, v.reemplazadoPor]),
      [
        ['c', 3, null],
        ['b', 2, 'c'],
        ['a', 1, 'b'],
      ],
    );
  });

  it('has no history for an unknown document', () => {
    assert.deepEqual(historial(docs, 'zz'), []);
  });

  it('has nothing current when there is nothing kept', () => {
    assert.deepEqual(vigentes([]), []);
  });
});
