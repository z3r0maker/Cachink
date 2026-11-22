import assert from 'node:assert/strict';

import { describe, it } from 'vitest';

import { inVocabulary, KEY_VOCABULARY, vocabularyText } from '../src/judge/keys';
import { SEEDED_BUGS } from '../src/seeded/bugs';

/**
 * The judge's `dedupe_key` vocabulary (S-13): a fixed list of `área/acción`
 * across the app, so two corridas that hit the same thing give the same key.
 * The first sensitivity run found the judge naming one total `caja/total` in
 * one run and `caja/ticket-total` in another.
 */
describe('KEY_VOCABULARY', () => {
  it('is kebab-case áreas, each with its acciones', () => {
    for (const [area, acciones] of Object.entries(KEY_VOCABULARY)) {
      assert.match(area, /^[a-z]+(?:-[a-z]+)*$/, area);
      assert.ok(acciones.length > 0, area);
      for (const a of acciones) assert.match(a, /^[a-z]+(?:-[a-z]+)*$/, `${area}/${a}`);
    }
  });

  it('holds every seeded bug’s expected prefix, so recall measures the judge, not the naming', () => {
    for (const b of SEEDED_BUGS)
      assert.ok(inVocabulary(b.expected_dedupe_prefix), `${b.id}: ${b.expected_dedupe_prefix}`);
  });

  it('knows a prefix only as área/acción', () => {
    assert.equal(inVocabulary('caja/total'), true);
    assert.equal(inVocabulary('caja/ticket-total'), false);
    assert.equal(inVocabulary('caja'), false);
    assert.equal(inVocabulary('nada/total'), false);
  });

  it('renders as one line per área for the prompt', () => {
    const text = vocabularyText();
    assert.equal(text.split('\n').length, Object.keys(KEY_VOCABULARY).length);
    assert.match(text, /^- `caja`: .*`total`/m);
  });
});
