/**
 * The text of a cover sits in bands over the art. Two things can go wrong with
 * them without anyone seeing it until Word opens the file: a band that sits on
 * another, and text that reaches the bottom margin, which Word answers with a
 * second page.
 */

import assert from 'node:assert/strict';
import { describe, it } from 'vitest';

import { assertFits, BOTTOM_SLACK, place } from './layout.js';
import { LETTER } from './sources.js';

describe('assertFits: the text stays on one page', () => {
  it('accepts bands in order that end above the bottom margin', () => {
    assert.doesNotThrow(() =>
      assertFits(
        [
          { from: 1.62, to: 2.12 },
          { from: 2.12, to: 8.6 },
          { from: 9.2, to: 9.95 },
        ],
        LETTER,
        1,
      ),
    );
  });

  it('accepts a band that ends exactly at the slack above the margin', () => {
    assert.doesNotThrow(() => assertFits([{ from: 9, to: 10 - BOTTOM_SLACK }], LETTER, 1));
  });

  it('refuses a band that ends before it starts', () => {
    assert.throws(() => assertFits([{ from: 5, to: 4 }], LETTER, 1), /ends before it starts/);
  });

  it('refuses a band that overlaps the one above', () => {
    assert.throws(
      () =>
        assertFits(
          [
            { from: 2, to: 5 },
            { from: 4.9, to: 6 },
          ],
          LETTER,
          1,
        ),
      /overlaps the one above/,
    );
  });

  it('refuses text that reaches the bottom margin: Word would add a second page', () => {
    assert.throws(() => assertFits([{ from: 9, to: 10 }], LETTER, 1), /second page/);
  });

  it('measures the margin from the sheet it is given, not from a letter page', () => {
    const folder = { w: 9.25, h: 11.61 };
    assert.doesNotThrow(() => assertFits([{ from: 10.05, to: 10.45 }], folder, 0.79));
    assert.throws(() => assertFits([{ from: 10.05, to: 10.45 }], LETTER, 0.79), /second page/);
  });
});

describe('place: the gap above each band', () => {
  it('starts at the first band, where the table floats from', () => {
    const [first] = place([{ from: 4.38, to: 5.5 }]);
    assert.deepEqual(first, { gap: 0, height: 5.5 - 4.38, band: { from: 4.38, to: 5.5 } });
  });

  it('measures the space between two bands that do not touch', () => {
    const [, second] = place([
      { from: 5.5, to: 8.3 },
      { from: 9.16, to: 9.86 },
    ]);
    assert.ok(second);
    assert.ok(Math.abs(second.gap - 0.86) < 1e-9);
    assert.ok(Math.abs(second.height - 0.7) < 1e-9);
  });

  it('leaves no gap between bands that touch', () => {
    const placed = place([
      { from: 4.38, to: 5.5 },
      { from: 5.5, to: 8.3 },
    ]);
    assert.deepEqual(
      placed.map(({ gap }) => gap),
      [0, 0],
    );
  });

  it('answers nothing for no bands', () => {
    assert.deepEqual(place([]), []);
  });
});
