import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { NextRequest } from 'next/server';
import { describe, it } from 'vitest';

import { UPLOADED_BYTES_CSP } from '@xangarro/config/security';

import { HEADER_RULES, PROXY_SKIPS, SECURITY_HEADERS } from '../next.config.mjs';
import { config as proxyConfig, proxy } from '../src/proxy';
import { parseViolations } from '../src/server/security/csp-report';
import { portalCsp } from '../src/server/security/csp';

/**
 * SEC-WEB-01 (N-26) and audit F-01/F-04: the portal's headers and its
 * enforced policy. Every response carries exactly one Content-Security-Policy
 * and exactly one layer writes it, so the answer never depends on how a host
 * merges a header set twice: the proxy on pages, `next.config.mjs` on
 * everything the proxy skips.
 */
const directives = (csp: string) =>
  new Map(csp.split('; ').map((d) => [d.split(' ')[0] ?? '', d.split(' ').slice(1).join(' ')]));

/** Next's own compiler for a `source` and a proxy `matcher`. */
const { pathToRegexp } = createRequire(import.meta.url)('next/dist/compiled/path-to-regexp') as {
  pathToRegexp: (path: string, keys: unknown[], options: Record<string, unknown>) => RegExp;
};
const compile = (source: string) => {
  const re = pathToRegexp(source, [], { strict: true, sensitive: false, delimiter: '/' });
  // As Next's `modifyRouteRegex` does: a trailing slash never changes a match.
  return new RegExp(re.source.replace(/\$$/, String.raw`(?:\/)?$`), re.flags);
};

const CSP = 'Content-Security-Policy';

/** What `headers()` leaves on a path: a later rule overrides an earlier one. */
function configured(path: string): Map<string, string> {
  const out = new Map<string, string>();
  for (const rule of HEADER_RULES) {
    if (!compile(rule.source).test(path)) continue;
    for (const h of rule.headers) out.set(h.key, h.value);
  }
  return out;
}

const proxied = (path: string) => proxyConfig.matcher.some((m) => compile(m).test(path));

const PAGES = ['/', '/login', '/ventas', '/negocio/comprobantes', '/operador/caja', '/apis'];
const STATIC = [
  '/api/v1/sync/push',
  '/api/csp-report',
  '/api/export/ventas',
  '/_next/static/chunks/main.js',
  '/_next/image',
  '/favicon.ico',
  '/sw.js',
  '/sql-wasm.wasm',
  '/sin-conexion.html',
];
const UPLOADS = [
  '/api/logos/01HZ8XQN9GZJXV8AKQ5X0PRD01',
  '/api/productos/01HZ8XQN9GZJXV8AKQ5X0PRD01/imagen',
];

describe('portal security headers', () => {
  const byKey = new Map(SECURITY_HEADERS.map((h) => [h.key, h.value]));

  it('forbids framing and MIME sniffing on every path', () => {
    assert.equal(byKey.get('X-Frame-Options'), 'DENY');
    assert.equal(byKey.get('X-Content-Type-Options'), 'nosniff');
    for (const path of [...PAGES, ...STATIC, ...UPLOADS]) {
      assert.equal(configured(path).get('X-Frame-Options'), 'DENY', path);
      assert.equal(configured(path).get('X-Content-Type-Options'), 'nosniff', path);
    }
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

describe('who writes the Content-Security-Policy', () => {
  it('the proxy matcher is the one next.config.mjs describes', () => {
    assert.deepEqual(proxyConfig.matcher, [`/((?!${PROXY_SKIPS.join('|')}).*)`]);
  });

  it('pages: the proxy, and the static rules stay out of its way', () => {
    for (const path of PAGES) {
      assert.equal(proxied(path), true, `${path} is proxied`);
      assert.equal(configured(path).has(CSP), false, `${path} has no static policy`);
    }
  });

  it('everything the proxy skips still refuses to be framed', () => {
    for (const path of STATIC) {
      assert.equal(proxied(path), false, `${path} is not proxied`);
      assert.equal(configured(path).get(CSP), "frame-ancestors 'none'", path);
    }
  });

  it('uploaded bytes are sandboxed, whatever the route handler does (audit F-01)', () => {
    for (const path of UPLOADS) {
      assert.equal(proxied(path), false, `${path} is not proxied`);
      assert.equal(configured(path).get(CSP), UPLOADED_BYTES_CSP, path);
    }
    const d = directives(UPLOADED_BYTES_CSP);
    assert.equal(d.get('default-src'), `'none'`);
    assert.equal(d.has('sandbox'), true);
    assert.equal(d.get('sandbox'), '', 'no allow-* token: no script, an opaque origin');
    assert.equal(d.get('frame-ancestors'), `'none'`);
    assert.equal(d.has('script-src'), false);
  });
});

describe('the proxy (audit F-04: the policy is enforced)', () => {
  const response = proxy(new NextRequest('https://app.xangarro.mx/ventas'));
  const csp = response.headers.get(CSP) ?? '';

  it('sends the policy enforcing, never report-only', () => {
    assert.notEqual(csp, '');
    assert.equal(response.headers.has('Content-Security-Policy-Report-Only'), false);
  });

  it('is one coherent policy: scripts by nonce, no framing, violations still reported', () => {
    const d = directives(csp);
    assert.match(d.get('script-src') ?? '', /^'self' 'nonce-[A-Za-z0-9+/=]+' 'strict-dynamic'/);
    assert.equal(d.get('frame-ancestors'), `'none'`);
    assert.equal(d.get('report-uri'), '/api/csp-report');
  });

  it('hands Next the same policy on the request, so it stamps the nonce', () => {
    const forwarded = response.headers.get('x-middleware-request-content-security-policy');
    assert.equal(forwarded, csp);
    const nonce = response.headers.get('x-middleware-request-x-nonce') ?? '';
    assert.ok(csp.includes(`'nonce-${nonce}'`));
    assert.equal(
      response.headers.has('x-middleware-request-content-security-policy-report-only'),
      false,
    );
  });

  it('mints a fresh nonce per request', () => {
    const again = proxy(new NextRequest('https://app.xangarro.mx/ventas'));
    assert.notEqual(again.headers.get(CSP), csp);
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
