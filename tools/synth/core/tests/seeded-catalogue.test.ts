import assert from 'node:assert/strict';

import { API_PATHS } from '@xangarro/contracts';
import { describe, it } from 'vitest';

import { SEEDED_BUGS, seededBug } from '../src/seeded/bugs';
import { catalogueScenario } from './catalogue-scenario';

/**
 * Spec §9's eight seeded bugs (S-12): each a runtime mutation of the real app,
 * aimed at a scenario the smoke matrix runs, and declaring what the judge
 * should find, so S-13 can measure recall.
 */
describe('SEEDED_BUGS', () => {
  it('has the spec’s eight, each id once', () => {
    assert.equal(SEEDED_BUGS.length, 8);
    assert.equal(new Set(SEEDED_BUGS.map((b) => b.id)).size, 8);
  });

  it('declares a category the judge uses and an área/acción prefix in its key style', () => {
    for (const b of SEEDED_BUGS) {
      assert.ok(['bug', 'friction', 'comprehension'].includes(b.expected_category), b.id);
      assert.match(b.expected_dedupe_prefix, /^[a-z0-9-]+\/[a-z0-9-]+$/, b.id);
    }
  });

  it('aims each at a web scenario that exists, and a phone variant at a phone one', () => {
    for (const b of SEEDED_BUGS) {
      assert.equal(catalogueScenario(b.scenario).runner, 'web', `${b.id} on ${b.scenario}`);
      if (b.phone) assert.equal(catalogueScenario(b.phone.scenario).runner, 'phone', b.id);
    }
  });

  it('reaches the phone only through the API, for the 500 and the slow save', () => {
    const phone = SEEDED_BUGS.filter((b) => b.phone !== undefined).map((b) => b.id);
    assert.deepEqual(phone.sort(), ['guardado-lento', 'guardar-500']);
    for (const b of SEEDED_BUGS) {
      assert.deepEqual(b.runners, b.phone ? ['web', 'phone'] : ['web'], b.id);
      // One rule on both runners, so the bug means the same on either.
      if (b.phone) assert.ok('net' in b.web && b.web.net === b.phone.net, b.id);
    }
  });

  it('aims its network rules at the API the register and phone really call', () => {
    const paths = new Set<string>(Object.values(API_PATHS));
    for (const b of SEEDED_BUGS) {
      if (!('net' in b.web)) continue;
      const all = Array.isArray(b.web.net.match) ? b.web.net.match : [b.web.net.match];
      for (const m of all) assert.ok(paths.has(m.path), `${b.id}: ${m.path}`);
    }
  });

  it('finds a bug by id, and names the ids it knows when it cannot', () => {
    assert.equal(seededBug('guardar-500').expected_category, 'bug');
    assert.throws(() => seededBug('boton-rosa'), /no seeded bug «boton-rosa».*guardar-500/);
  });
});
