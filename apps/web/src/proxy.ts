import { NextResponse, type NextRequest } from 'next/server';
import { newNonce } from '@xangarro/config/security';

import { portalCsp } from './server/security/csp';

/**
 * Every page request gets a fresh nonce and the portal's CSP (SEC-WEB-01).
 * The request carries the policy so Next stamps the nonce on its own scripts;
 * the response carries it **report-only** until the violation log is clean
 * (see `server/security/csp.ts`). Next 16 names this file `proxy.ts`.
 *
 * Authentication is not here: the portal gates in its layouts and actions.
 */
export function proxy(request: NextRequest): NextResponse {
  const nonce = newNonce();
  const csp = portalCsp(nonce, process.env.NODE_ENV === 'development');
  const headers = new Headers(request.headers);
  headers.set('x-nonce', nonce);
  headers.set('Content-Security-Policy-Report-Only', csp);
  const response = NextResponse.next({ request: { headers } });
  response.headers.set('Content-Security-Policy-Report-Only', csp);
  return response;
}

export const config = {
  // Pages only: API responses are JSON, and static files carry no scripts.
  matcher: [
    '/((?!api/|_next/static|_next/image|favicon.ico|icon.svg|apple-icon.png|sw.js|sql-wasm.wasm|sin-conexion.html).*)',
  ],
};
