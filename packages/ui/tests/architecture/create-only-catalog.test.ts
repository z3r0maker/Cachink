/**
 * Products and clients are create-only on the device (A-09): edits and
 * deletes happen in the portal and arrive by pull. No UI source that reaches
 * those repositories may call `update`/`delete` on them.
 */

import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

const SRC = join(__dirname, '../../src');
const REPO_ACCESS = /use(Products|Clients)Repository\(\)|repos\.(products|clients)\b/;
const WRITE_CALL = /\b(products|clients|productsRepo|clientsRepo|repo)\.(update|delete)\(/;

function sourceFiles(dir: string): string[] {
  return readdirSync(dir).flatMap((name) => {
    const path = join(dir, name);
    if (statSync(path).isDirectory()) return sourceFiles(path);
    return /\.(ts|tsx)$/.test(name) ? [path] : [];
  });
}

describe('create-only catalog (A-09)', () => {
  it('no UI file that reaches the products/clients repositories edits or deletes', () => {
    const offenders = sourceFiles(SRC).filter((file) => {
      const text = readFileSync(file, 'utf8');
      return REPO_ACCESS.test(text) && WRITE_CALL.test(text);
    });
    expect(offenders).toEqual([]);
  });

  it('the scan sees the repository hooks it guards (sanity)', () => {
    const hits = sourceFiles(SRC).filter((f) => REPO_ACCESS.test(readFileSync(f, 'utf8')));
    expect(hits.length).toBeGreaterThan(0);
  });
});
