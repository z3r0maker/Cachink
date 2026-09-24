import { NextResponse, type NextRequest } from 'next/server';

import { ADMIN_COOKIE } from './server/auth/config';
import { FORBIDDEN_PATH, isMachinePath, isPublicPath, type GateDecision } from './server/gate';
import { resolveGate } from './server/resolve-gate';
import { buildCsp, newNonce } from './server/security/csp';

/**
 * Every page request: a fresh CSP nonce and the staff gate (`decideAccess`)
 * over the console's own server-side session (ADR-080). Next 16 names this
 * file `proxy.ts` (formerly `middleware.ts`) and runs it on the Node.js
 * runtime, which is what lets it resolve the session in Postgres.
 */
async function gate(request: NextRequest): Promise<GateDecision> {
  const path = request.nextUrl.pathname;
  if (isPublicPath(path) || isMachinePath(path)) return { kind: 'allow' };
  const token = request.cookies.get(ADMIN_COOKIE)?.value;
  return (await resolveGate(token, path)).decision;
}

function respond(decision: GateDecision, request: NextRequest, headers: Headers): NextResponse {
  switch (decision.kind) {
    case 'allow':
      return NextResponse.next({ request: { headers } });
    case 'redirect':
      return NextResponse.redirect(new URL(decision.to, request.url));
    case 'forbidden':
      return NextResponse.rewrite(new URL(FORBIDDEN_PATH, request.url), {
        status: 403,
        request: { headers },
      });
  }
}

export async function proxy(request: NextRequest): Promise<NextResponse> {
  const nonce = newNonce();
  const csp = buildCsp(nonce, process.env.NODE_ENV === 'development');
  const headers = new Headers(request.headers);
  headers.set('x-nonce', nonce);
  headers.set('Content-Security-Policy', csp);

  const response = respond(await gate(request), request, headers);
  // Every console page is per-staff-member; none may be cached by anyone.
  response.headers.set('Cache-Control', 'private, no-store');
  response.headers.set('Content-Security-Policy', csp);
  return response;
}

export const config = {
  // Prefetches are gated too: a `purpose: prefetch` header is caller-supplied,
  // so exempting it would be a way around the gate. The icons are exempt so
  // the login page — which no session has reached yet — still shows them.
  matcher: ['/((?!_next/static|_next/image|favicon.ico|icon.svg|apple-icon.png|robots.txt).*)'],
};
