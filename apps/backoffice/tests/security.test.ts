import assert from 'node:assert/strict';
import { describe, it } from 'vitest';

import { buildCsp, newNonce } from '@/server/security/csp';

import { SECURITY_HEADERS } from '../next.config.mjs';

function directives(csp: string): Map<string, string> {
  return new Map(
    csp.split('; ').map((d) => {
      const [name = '', ...rest] = d.split(' ');
      return [name, rest.join(' ')];
    }),
  );
}

describe('buildCsp', () => {
  it('allows scripts only with the nonce, and nothing inline or eval in production', () => {
    const d = directives(buildCsp('abc', false));
    assert.equal(d.get('script-src'), `'self' 'nonce-abc' 'strict-dynamic'`);
    assert.equal(d.get('frame-ancestors'), `'none'`);
    assert.equal(d.get('object-src'), `'none'`);
    assert.ok(d.has('upgrade-insecure-requests'));
  });

  it('never allows unsafe-inline, and allows unsafe-eval only in development', () => {
    assert.doesNotMatch(buildCsp('n', false), /unsafe-inline|unsafe-eval/);
    assert.doesNotMatch(buildCsp('n', true), /unsafe-inline/);
    assert.match(directives(buildCsp('n', true)).get('script-src') ?? '', /'unsafe-eval'/);
  });

  it('names no third-party origin', () => {
    assert.doesNotMatch(buildCsp('n', false), /https?:|\*/);
  });

  it('lets the browser reach the document store only when one is configured (E-26)', () => {
    const blob = 'https://mexiacorp.blob.core.windows.net';
    const d = directives(buildCsp('n', false, [blob]));
    assert.equal(d.get('connect-src'), `'self' ${blob}`);
    // Only fetches: no script, frame or form may come from or go to it.
    assert.equal(buildCsp('n', false, [blob]).split(blob).length, 2);
    assert.equal(directives(buildCsp('n', false)).get('connect-src'), `'self'`);
  });
});

describe('newNonce', () => {
  it('is fresh per call and at least 128 bits', () => {
    const a = newNonce();
    assert.notEqual(a, newNonce());
    assert.ok(atob(a).length >= 16);
  });
});

describe('static security headers', () => {
  const byKey = new Map(SECURITY_HEADERS.map((h) => [h.key, h.value]));

  it('tells crawlers not to index anything', () => {
    assert.match(byKey.get('X-Robots-Tag') ?? '', /noindex/);
  });

  it('forbids framing and MIME sniffing', () => {
    assert.equal(byKey.get('X-Frame-Options'), 'DENY');
    assert.equal(byKey.get('X-Content-Type-Options'), 'nosniff');
  });
});
