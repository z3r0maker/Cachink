import assert from 'node:assert/strict';
import { describe, it } from 'vitest';

import { SECURITY_HEADERS } from '../next.config.mjs';
import { parseViolations } from '../src/server/security/csp-report';
import { portalCsp } from '../src/server/security/csp';

/** SEC-WEB-01 (N-26): the portal's headers and its report-only policy. */
const directives = (csp: string) =>
  new Map(csp.split('; ').map((d) => [d.split(' ')[0] ?? '', d.split(' ').slice(1).join(' ')]));

describe('portal security headers', () => {
  const byKey = new Map(SECURITY_HEADERS.map((h) => [h.key, h.value]));

  it('forbids framing twice over, and MIME sniffing', () => {
    assert.equal(byKey.get('X-Frame-Options'), 'DENY');
    assert.equal(byKey.get('Content-Security-Policy'), "frame-ancestors 'none'");
    assert.equal(byKey.get('X-Content-Type-Options'), 'nosniff');
  });

  it('sets HSTS and a referrer that never carries a path off the origin, and stays indexable', () => {
    assert.match(
      byKey.get('Strict-Transport-Security') ?? '',
      /max-age=63072000; includeSubDomains/,
    );
    assert.equal(byKey.get('Referrer-Policy'), 'strict-origin-when-cross-origin');
    assert.equal(byKey.has('X-Robots-Tag'), false, 'the portal is public, unlike the console');
  });
});

describe('portalCsp', () => {
  const d = directives(portalCsp('abc', false));

  it('runs scripts only with the nonce, plus WebAssembly for the register', () => {
    assert.equal(d.get('script-src'), `'self' 'nonce-abc' 'strict-dynamic' 'wasm-unsafe-eval'`);
    assert.doesNotMatch(d.get('script-src') ?? '', /'unsafe-inline'|'unsafe-eval'/);
  });

  it('lets the register and the offline page run their workers, and Stripe receive its redirect', () => {
    assert.equal(d.get('worker-src'), `'self' blob:`);
    assert.match(d.get('form-action') ?? '', /https:\/\/checkout\.stripe\.com/);
    assert.equal(d.get('frame-ancestors'), `'none'`);
    assert.equal(d.get('report-uri'), '/api/csp-report');
  });
});

describe('parseViolations', () => {
  it('keeps the directive, the blocked origin and the path — never a query or a sample', () => {
    const [v] = parseViolations({
      'csp-report': {
        'document-uri': 'https://app.xangarro.mx/equipo?code=K7M3P9RW',
        'effective-directive': 'script-src-elem',
        'blocked-uri': 'https://evil.example/x.js?token=secret',
        'script-sample': 'alert(1)',
      },
    });
    assert.deepEqual(v, {
      directive: 'script-src-elem',
      blocked: 'https://evil.example',
      path: '/equipo',
    });
  });

  it('reads the Reporting API shape and ignores junk', () => {
    const vs = parseViolations([
      {
        body: {
          effectiveDirective: 'style-src',
          blockedURL: 'inline',
          documentURL: 'https://app.xangarro.mx/',
        },
      },
      'nonsense',
    ]);
    assert.deepEqual(vs, [{ directive: 'style-src', blocked: 'inline', path: '/' }]);
    assert.deepEqual(parseViolations(null), []);
  });
});
