import assert from 'node:assert/strict';
import { describe, it } from 'vitest';

import {
  ArchivoInvalidoError,
  assertArchivo,
  MAX_BYTES_EVIDENCIA,
  retenerHasta,
} from '../../src/corp/index.js';

/** E-04's evidence files: what is accepted, and how long it is kept. */
describe('assertArchivo', () => {
  it('accepts the SAT PDF', () => {
    assert.doesNotThrow(() => assertArchivo('acuse.pdf', 'application/pdf', 120_000));
  });

  it('refuses an empty file', () => {
    assert.throws(() => assertArchivo('acuse.pdf', 'application/pdf', 0), ArchivoInvalidoError);
  });

  it('refuses a kind of file that is not evidence', () => {
    assert.throws(() => assertArchivo('macro.xlsm', 'application/vnd.ms-excel', 10), /PDF/);
  });

  it('refuses a file over 4 MB', () => {
    assert.throws(() => assertArchivo('scan.png', 'image/png', MAX_BYTES_EVIDENCIA + 1), /4 MB/);
  });
});

describe('retenerHasta', () => {
  it('keeps a document five years (CFF art. 30)', () => {
    assert.equal(retenerHasta('2026-10-08'), '2031-10-08');
  });

  it('keeps a leap-day upload to the 28th', () => {
    assert.equal(retenerHasta('2028-02-29'), '2033-02-28');
  });
});
