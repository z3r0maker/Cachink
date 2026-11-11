import { NextResponse, type NextRequest } from 'next/server';
import { newNonce } from '@xangarro/config/security';

import { portalCsp } from './server/security/csp';

/**
 * Every page request gets a fresh nonce and the portal's CSP (SEC-WEB-01),
 * **enforced** (audit F-04). The request carries the policy so Next stamps
 * the nonce on its own scripts; the response carries it so the browser holds
 * the page to it. Violations still reach `/api/csp-report` through the
 * policy's `report-uri`. Next 16 names this file `proxy.ts`.
 *
 * This is the only writer of a page's Content-Security-Policy: the static
 * rules in `next.config.mjs` cover exactly the paths the matcher below skips,
 * so a page never has two policies to reconcile.
 *
 * Authentication is not here: the portal gates in its layouts and actions.
 */
const CSP = 'Content-Security-Policy';

const LOOPBACK = new Set(['localhost', '127.0.0.1', '[::1]']);

/**
 * A page this server sent over plain http to this machine: the E2E suite's
 * `next start`. `upgrade-insecure-requests` there sends every script to an
 * https nobody serves, and WebKit (unlike Chromium, which exempts localhost)
 * obeys, so the portal ran with no JavaScript in Safari. Production is https
 * on a real host and keeps the directive.
 */
function plainOnLoopback(url: URL): boolean {
  return url.protocol === 'http:' && LOOPBACK.has(url.hostname);
}

export function proxy(request: NextRequest): NextResponse {
  const nonce = newNonce();
  const csp = portalCsp(
    nonce,
    process.env.NODE_ENV === 'development',
    !plainOnLoopback(request.nextUrl),
  );
  const headers = new Headers(request.headers);
  headers.set('x-nonce', nonce);
  headers.set(CSP, csp);
  const response = NextResponse.next({ request: { headers } });
  response.headers.set(CSP, csp);
  return response;
}

export const config = {
  // Pages only: API responses are JSON, and static files carry no scripts.
  // A literal, because Next reads it at build time; `PROXY_SKIPS` in
  // `next.config.mjs` is the same list, and a test keeps the two equal.
  matcher: [
    '/((?!api/|_next/static|_next/image|favicon.ico|icon.svg|apple-icon.png|sw.js|sql-wasm.wasm|sin-conexion.html).*)',
  ],
};
