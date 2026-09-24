import assert from 'node:assert/strict';
import { addMapping, GenMapping, toEncodedMap } from '@jridgewell/gen-mapping';
import { describe, it } from 'vitest';

import { copiesOf, splitDuplicatedCopies, type ScriptCoverage } from '../e2e/coverage-split';

/**
 * A built chunk in miniature: `src/a.ts` compiled twice (the render layer's
 * dead copy, then the action layer's live one) with `src/b.ts` between them,
 * padded so the copies sit further apart than one file's code ever spans.
 */
const PAD = 'x'.repeat(3_000);
const A1 = 'function a(){return 1}';
const B = 'function b(){return 2}';
const A2 = 'function a(){return 1}';
const SOURCE = [A1, PAD, B, PAD, A2].join('\n');
const at = (line: number) => SOURCE.split('\n').slice(0, line).join('\n').length + (line ? 1 : 0);

function mapOf(): ReturnType<typeof toEncodedMap> {
  const gen = new GenMapping({ file: 'page.js' });
  const put = (line: number, source: string) => {
    addMapping(gen, {
      generated: { line: line + 1, column: 0 },
      source,
      original: { line: 1, column: 0 },
    });
    addMapping(gen, {
      generated: { line: line + 1, column: 20 },
      source,
      original: { line: 1, column: 20 },
    });
  };
  put(0, 'webpack://@xangarro/web/./src/a.ts');
  put(2, 'webpack://@xangarro/web/./src/b.ts');
  put(4, 'webpack://@xangarro/web/./src/a.ts');
  return toEncodedMap(gen);
}

const fn = (name: string, start: number, end: number, count: number) => ({
  functionName: name,
  isBlockCoverage: true,
  ranges: [{ startOffset: start, endOffset: end, count }],
});

const ENTRY: ScriptCoverage = {
  url: 'file:///app/.next/server/app/importar/page.js',
  source: SOURCE,
  sourceMap: mapOf(),
  functions: [
    fn('', 0, SOURCE.length, 1),
    fn('a', at(0), at(0) + A1.length, 0), // dead copy
    fn('b', at(2), at(2) + B.length, 4),
    fn('a', at(4), at(4) + A2.length, 3), // live copy
  ],
};

const counted = (name: string) => name.includes('/src/');

describe('splitDuplicatedCopies', () => {
  it('finds each copy of a file as its own span, and a single copy as one', () => {
    const spans = copiesOf(SOURCE, mapOf(), counted);
    // The map's `./src/a.ts` comes back resolved, as MCR sees it too.
    assert.equal(spans.get('webpack://@xangarro/web/src/a.ts')?.length, 2);
    assert.equal(spans.get('webpack://@xangarro/web/src/b.ts')?.length, 1);
  });

  it('hands over one entry per copy, each with the other copy marked unexecuted', () => {
    const [first, second] = splitDuplicatedCopies(ENTRY, counted);
    assert.ok(first !== undefined && second !== undefined);
    assert.notEqual(first.url, second.url);

    // Entry 1 keeps the dead copy (count 0) and zeroes the live one's span.
    const names1 = first.functions.map((f) => [f.functionName, f.ranges[0]?.count]);
    assert.deepEqual(names1, [
      ['', 1],
      ['a', 0],
      ['b', 4],
      ['', 0],
    ]);
    assert.equal(first.functions.at(-1)?.ranges[0]?.startOffset, at(4));

    // Entry 2 keeps the live copy (count 3) and zeroes the dead one's span.
    const names2 = second.functions.map((f) => [f.functionName, f.ranges[0]?.count]);
    assert.deepEqual(names2, [
      ['', 1],
      ['b', 4],
      ['a', 3],
      ['', 0],
    ]);
    assert.equal(second.functions.at(-1)?.ranges[0]?.startOffset, at(0));
  });

  it('leaves a script with no duplicated file exactly as it was', () => {
    const plain = { ...ENTRY, functions: ENTRY.functions.slice(0, 3) };
    const noDup = splitDuplicatedCopies(plain, (n) => n.endsWith('b.ts'));
    assert.deepEqual(noDup, [plain]);
  });

  it('leaves a script without a source map alone, and ignores files that do not count', () => {
    const { sourceMap: _dropped, ...unmapped } = ENTRY;
    assert.deepEqual(splitDuplicatedCopies(unmapped, counted), [unmapped]);
    assert.equal(splitDuplicatedCopies(ENTRY, () => false).length, 1);
  });
});
