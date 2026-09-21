import assert from 'node:assert/strict';
import { describe, it } from 'vitest';

import { OFFLINE_URL, replaceableNavigation } from '../../public/sw.js';

/**
 * N-23's rule, imported from the service worker itself — the single source.
 * Importing the module under Node also proves the listener guard: a plain
 * import attaches nothing and throws nothing.
 */
describe('replaceableNavigation', () => {
  it('lets Director-surface navigations fall back to the offline page', () => {
    assert.equal(replaceableNavigation('/'), true);
    assert.equal(replaceableNavigation('/ventas'), true);
    assert.equal(replaceableNavigation('/estados?p=mensual'), true);
  });

  it('never replaces the operator register (ADR-071)', () => {
    assert.equal(replaceableNavigation('/operador'), false);
    assert.equal(replaceableNavigation('/operador/ventas'), false);
  });

  it('never answers API paths, and the offline URL is the branded page', () => {
    assert.equal(replaceableNavigation('/api/export/informe-mensual'), false);
    assert.equal(OFFLINE_URL, '/sin-conexion.html');
  });
});
