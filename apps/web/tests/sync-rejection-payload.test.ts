import assert from 'node:assert/strict';
import { describe, it } from 'vitest';

import { rejectionPayload } from '../src/server/sync/rejection-payload';

/**
 * A rejection's payload is cast to `jsonb`, which refuses a `\u0000` escape
 * (22P05) and an unpaired surrogate's: one such row used to fail the whole push
 * (audit DB3-SYNC-01 a). What is kept must always be storable.
 */
const LONE_ESCAPE = /\\ud[89a-f][0-9a-f]{2}/i;

describe('rejectionPayload', () => {
  it('keeps a preview the shopkeeper recognises, and the row', () => {
    const payload = JSON.parse(rejectionPayload('expenses', { id: 'E1', concepto: 'Renta' }));
    assert.deepEqual(payload, { preview: 'Gasto · Renta', row: { id: 'E1', concepto: 'Renta' } });
  });

  it('drops NUL characters, from values and keys alike', () => {
    const text = rejectionPayload('expenses', {
      id: 'E1',
      concepto: 'Refresco\u0000',
      'x\u0000': 1,
    });
    assert.equal(text.includes('\\u0000'), false, text);
    const payload = JSON.parse(text) as { preview: string; row: Record<string, unknown> };
    assert.equal(payload.preview, 'Gasto · Refresco');
    assert.deepEqual(payload.row, { id: 'E1', concepto: 'Refresco', x: 1 });
  });

  it('replaces unpaired surrogates, nested ones included, and keeps real pairs', () => {
    const text = rejectionPayload('products', {
      id: 'P1',
      nombre: 'Caf\uD83D',
      atributos: { color: ['\uDC00rojo', '😀'] },
    });
    assert.equal(LONE_ESCAPE.test(text), false, text);
    const payload = JSON.parse(text) as { row: { nombre: string; atributos: unknown } };
    assert.equal(payload.row.nombre, 'Caf�');
    assert.deepEqual(payload.row.atributos, { color: ['�rojo', '😀'] });
  });

  it('encodes a bigint as its decimal string', () => {
    const payload = JSON.parse(rejectionPayload('sales', { id: 'S1', total: 12345678901234n }));
    assert.equal(payload.row.total, '12345678901234');
  });
});
