import assert from 'node:assert/strict';
import { describe, it } from 'vitest';

import { conSello, parseSello } from '../src/server/empresa/sello';

/** «Sello»'s one-time flag on an action's redirect (E-46, ADR-161 §3). */
describe('the stamp’s flag', () => {
  it('rides on the redirect and is read back by the page', () => {
    assert.equal(
      conSello('/empresa/cierre?mes=2026-10', 'cerrado'),
      '/empresa/cierre?mes=2026-10&sello=cerrado',
    );
    assert.equal(parseSello('cerrado'), 'cerrado');
  });

  it('starts the query when the redirect has none', () => {
    assert.equal(
      conSello('/empresa/presupuesto', 'presupuesto'),
      '/empresa/presupuesto?sello=presupuesto',
    );
  });

  it('is nothing when the page opens without it', () => {
    assert.equal(parseSello(undefined), null);
    assert.equal(parseSello(''), null);
  });

  it('refuses any value an action never sends', () => {
    assert.equal(parseSello('Cerrado'), null);
    assert.equal(parseSello('cerrado '), null);
    assert.equal(parseSello('<script>'), null);
  });
});
