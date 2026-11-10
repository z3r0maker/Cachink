/**
 * xangarro.mx/.well-known/security.txt (RFC 9116, audit privacidad 2026-09-22):
 * the two required fields, and an `Expires` far enough ahead. A file past its
 * date tells researchers to ignore it, so this fails a month before it lapses.
 */
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, it } from 'vitest';

const FILE = join(process.cwd(), 'apps/landing/public/.well-known/security.txt');
const MONTH_MS = 30 * 24 * 60 * 60 * 1000;
const YEAR_MS = 366 * 24 * 60 * 60 * 1000;

function field(text: string, name: string): string | undefined {
  return text
    .split('\n')
    .find((l) => l.startsWith(`${name}: `))
    ?.slice(name.length + 2)
    .trim();
}

describe('security.txt', () => {
  const text = readFileSync(FILE, 'utf8');

  it('names a contact', () => {
    assert.match(field(text, 'Contact') ?? '', /^(mailto:|https:\/\/)/);
  });

  it('expires between a month and a year from now: renew it before the test fails', () => {
    const expires = Date.parse(field(text, 'Expires') ?? '');
    assert.ok(Number.isFinite(expires), 'Expires is an ISO-8601 date');
    const left = expires - Date.now();
    assert.ok(left > MONTH_MS, 'security.txt lapses within a month: move Expires a year ahead');
    assert.ok(left < YEAR_MS, 'RFC 9116: Expires no more than a year ahead');
  });

  it('points at its own canonical address', () => {
    assert.equal(field(text, 'Canonical'), 'https://xangarro.mx/.well-known/security.txt');
  });
});
