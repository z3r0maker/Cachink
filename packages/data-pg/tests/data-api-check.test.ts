import assert from 'node:assert/strict';
import { describe, it } from 'vitest';

import { intentos, veredicto } from '../scripts/hosted/data-api';

/** The hosted Data API check's verdict (audit SEC-DATA-01, ADR-138). */
describe('veredicto', () => {
  it('a refusal or an empty list is a closed door', () => {
    for (const s of [401, 403, 404]) assert.equal(veredicto(s, '{"message":"no"}'), 'cerrada');
    assert.equal(veredicto(200, ' [] '), 'cerrada');
  });

  it('any row is an open door', () => {
    assert.equal(veredicto(200, '[{"id":"x"}]'), 'abierta');
  });

  it('anything else is not proof either way, so it fails too', () => {
    assert.equal(veredicto(500, ''), 'dudosa');
    assert.equal(veredicto(200, 'not json'), 'abierta');
    assert.equal(veredicto(406, ''), 'dudosa');
  });

  it('tries the device token only when one is given', () => {
    assert.deepEqual(
      intentos('anon', undefined).map((i) => i.nombre),
      ['anon key'],
    );
    assert.deepEqual(
      intentos('anon', 'tok').map((i) => i.nombre),
      ['anon key', 'device token'],
    );
  });
});
