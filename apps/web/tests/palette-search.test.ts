import assert from 'node:assert/strict';
import { describe, it } from 'vitest';

import { matches } from '../src/shell/palette-search';

const labels = (q: string) => matches(q).map((d) => d.item.label);

describe('⌘K palette search', () => {
  it('lists every destination, menu then account, for an empty query', () => {
    const all = labels('  ');
    assert.equal(all[0], 'Hoy');
    assert.ok(all.includes('Mi negocio'));
    assert.equal(new Set(all).size, all.length);
  });

  it('ignores accents and case', () => {
    assert.deepEqual(labels('REVISION'), ['Revisión de caja']);
  });

  it('matches the group name, so «dinero» finds both money screens', () => {
    assert.deepEqual(labels('dinero'), ['Ventas y gastos', 'Estados financieros']);
  });

  it('finds nothing for nonsense', () => {
    assert.deepEqual(labels('zzz'), []);
  });
});
