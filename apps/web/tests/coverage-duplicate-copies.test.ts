import assert from 'node:assert/strict';
import { mkdtemp, readFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';

import { addMapping, GenMapping, setSourceContent, toEncodedMap } from '@jridgewell/gen-mapping';
import MCR from 'monocart-coverage-reports';
import { describe, it } from 'vitest';

import { toSourcePath } from '../scripts/coverage-gate/options';

/**
 * ADR-102, and the reason for `patches/monocart-coverage-reports@2.13.0.patch`.
 *
 * Next compiles a module once per webpack layer, so one page chunk can hold the
 * render layer's copy of a file and the server action's; only one runs. Both
 * map to the same lines. Unpatched, MCR kept whichever copy it met first — the
 * dead one here, as it was for `server/import/templates.ts` — and dropped the
 * other's counts. Patched, repeated ranges add up: covered if either copy ran.
 * If an MCR upgrade drops the patch, this fails before the number does.
 */

interface V8Script {
  readonly url: string;
  readonly source: string;
  readonly sourceMap: ReturnType<typeof toEncodedMap>;
  readonly functions: readonly unknown[];
}

const fn = (name: string, start: number, end: number, count: number) => ({
  functionName: name,
  isBlockCoverage: true,
  ranges: [{ startOffset: start, endOffset: end, count }],
});

describe('a module compiled into two webpack layers of one chunk', () => {
  const SRC_A = 'webpack://@xangarro/web/./src/a.ts';
  const A = 'function a(){return 1}';

  /** A chunk holding `a.ts` twice, the dead copy first, with the original attached. */
  function twoCopies(): V8Script {
    const source = [A, 'x'.repeat(3_000), A].join('\n');
    const gen = new GenMapping({ file: 'page.js' });
    for (const line of [1, 3]) {
      for (const column of [0, 13]) {
        addMapping(gen, {
          generated: { line, column },
          source: SRC_A,
          original: { line: 1, column },
        });
      }
    }
    setSourceContent(gen, SRC_A, A);
    const second = source.lastIndexOf(A);
    return {
      url: 'file:///app/.next/server/app/importar/page.js',
      source,
      sourceMap: toEncodedMap(gen),
      functions: [
        fn('', 0, source.length, 1),
        fn('a', 0, A.length, 0),
        fn('a', second, second + A.length, 2),
      ],
    };
  }

  it('credits the copy that ran, not the one MCR meets first', async () => {
    const outputDir = await mkdtemp(path.join(tmpdir(), 'xg-split-'));
    const mcr = MCR({
      outputDir,
      reports: ['json'],
      sourcePath: (p: string) => toSourcePath(p),
      sourceFilter: (p: string) => toSourcePath(p) === 'src/a.ts',
    });
    await mcr.add([twoCopies()] as never);
    await mcr.generate();
    const final = JSON.parse(await readFile(path.join(outputDir, 'coverage-final.json'), 'utf8'));
    const file = final['src/a.ts'] as { f: Record<string, number>; s: Record<string, number> };
    assert.ok(file !== undefined, 'src/a.ts is in the report');
    assert.ok(
      Object.values(file.f).every((n) => n > 0),
      `function a ran: ${JSON.stringify(file.f)}`,
    );
    assert.ok(
      Object.values(file.s).every((n) => n > 0),
      `its statement ran: ${JSON.stringify(file.s)}`,
    );
  });
});
