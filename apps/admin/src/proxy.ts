import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

import { FORBIDDEN_PATH, isPublicPath, type GateDecision } from './server/gate';
import { resolveGate } from './server/resolve-gate';
import { buildCsp, newNonce } from './server/security/csp';
import { supabaseEnv } from './server/supabase/env';

/**
 * Every page request: a fresh CSP nonce, a refreshed Supabase session, and
 * the staff gate (`decideAccess`). Next 16 names this file `proxy.ts`
 * (formerly `middleware.ts`) and runs it on the Node.js runtime, which is
 * what lets it query the allowlist in Postgres.
 */
type CookieToSet = { name: string; value: string; options: CookieOptions };

async function gate(request: NextRequest, cookiesOut: CookieToSet[]): Promise<GateDecision> {
  const path = request.nextUrl.pathname;
  if (isPublicPath(path)) return { kind: 'allow' };

  const { url, anonKey } = supabaseEnv();
  const client = createServerClient(url, anonKey, {
    cookies: {
      getAll: () => request.cookies.getAll(),
      setAll: (toSet) => {
        for (const c of toSet) cookiesOut.push(c);
      },
    },
  });
  return (await resolveGate(client, path)).decision;
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

  const cookiesOut: CookieToSet[] = [];
  const response = respond(await gate(request, cookiesOut), request, headers);
  for (const { name, value, options } of cookiesOut) response.cookies.set(name, value, options);
  if (cookiesOut.length > 0) response.headers.set('Cache-Control', 'private, no-store');
  response.headers.set('Content-Security-Policy', csp);
  return response;
}

export const config = {
  // Prefetches are gated too: a `purpose: prefetch` header is caller-supplied,
  // so exempting it would be a way around the gate.
  matcher: ['/((?!_next/static|_next/image|favicon.ico|robots.txt).*)'],
};
