import { describe, it } from 'vitest';
import assert from 'node:assert/strict';

import { sealPath } from '../src/components/seal-path';

describe('sealPath', () => {
  it('closes the path', () => {
    assert.ok(sealPath(60, 60, 54, 12).endsWith(' Z'));
  });

  it('draws one arc per side', () => {
    const d = sealPath(60, 60, 54, 12);
    assert.equal((d.match(/ A/g) ?? []).length, 12);
  });

  it('starts at the top of the circle', () => {
    // −π/2 puts the first vertex directly above the centre.
    assert.ok(sealPath(60, 60, 54, 12).startsWith('M60.0 6.0'));
  });

  it('is deterministic — the same input yields the same path', () => {
    assert.equal(sealPath(60, 60, 54, 12), sealPath(60, 60, 54, 12));
  });
});
