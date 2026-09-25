import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

import { GUIA_OMITIDA_COOKIE } from '@/onboarding/guia';

/**
 * «Ir a mi portal» while «Para vender» is not done (P-36 D-2): remember on
 * this browser that the owner wants the portal, not the guide, for 30 days.
 * The guide stays reachable from Inicio's card and from /como-empiezo.
 */
export async function GET(request: Request): Promise<NextResponse> {
  (await cookies()).set(GUIA_OMITIDA_COOKIE, '1', {
    path: '/',
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    maxAge: 60 * 60 * 24 * 30,
  });
  return NextResponse.redirect(new URL('/', request.url));
}
