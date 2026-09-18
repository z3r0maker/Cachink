import { describe, it } from 'vitest';
import assert from 'node:assert/strict';

import { ICON_CATEGORIES, ProductIconEnum } from '../../src/index.js';

/** P-07: one picker list for both clients — 66 icons in 7 tabs, each icon once. */
describe('ICON_CATEGORIES', () => {
  const all = ICON_CATEGORIES.flatMap((c) => c.icons);

  it('has 7 tabs and 66 icons', () => {
    assert.equal(ICON_CATEGORIES.length, 7);
    assert.equal(all.length, 66);
  });

  it('lists every product icon exactly once, and nothing else', () => {
    assert.equal(new Set(all).size, all.length, 'an icon appears in two tabs');
    assert.deepEqual([...all].sort(), [...ProductIconEnum.options].sort());
  });
});
