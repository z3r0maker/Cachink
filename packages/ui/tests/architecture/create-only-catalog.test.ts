/**
 * Products and clients are create-only on the device (A-09): edits and
 * deletes happen in the portal and arrive by pull. No UI source that reaches
 * those repositories may call `update`/`delete` on them.
 */

import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

const SRC = join(__dirname, '../../src');
const REPO_ACCESS = /use(Products|Clients)Repository\(\)|repos\.(products|clients)\b/;
const WRITE_CALL = /\b(products|clients|productsRepo|clientsRepo|repo)\.(update|delete)\(/;

/**
 * The UI sources that reach the products/clients repositories, with their
 * text. Walked and read **once** for both cases: each used to walk `src/`
 * (~485 files) with a `statSync` per entry and read every file again, 140 ms
 * alone per case and over 1 s under `pnpm test`, next to a 5 s timeout.
 */
const REACHING = readdirSync(SRC, { recursive: true, encoding: 'utf8' })
  .filter((name) => /\.(ts|tsx)$/.test(name))
  .map((name) => ({ file: join(SRC, name), text: readFileSync(join(SRC, name), 'utf8') }))
  .filter(({ text }) => REPO_ACCESS.test(text));

describe('create-only catalog (A-09)', () => {
  it('no UI file that reaches the products/clients repositories edits or deletes', () => {
    const offenders = REACHING.filter(({ text }) => WRITE_CALL.test(text)).map((f) => f.file);
    expect(offenders).toEqual([]);
  });

  it('the scan sees the repository hooks it guards (sanity)', () => {
    expect(REACHING.length).toBeGreaterThan(0);
  });
});
