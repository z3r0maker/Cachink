import 'server-only';

import { cookies } from 'next/headers';

/**
 * What `/eliminacion/programada` shows right after «Eliminar mi cuenta»: the
 * folio, the erase day and the businesses. The session is gone by then, so the
 * action hands them over in a short-lived cookie, readable only by that page
 * and only by this browser, instead of the URL (never personal data in a URL).
 */
export interface Programada {
  readonly folio: string;
  readonly eraseAt: string;
  readonly negocios: readonly string[];
}

const NAME = 'xg_eliminacion';
const PATH = '/eliminacion';

export async function guardarProgramada(p: Programada): Promise<void> {
  (await cookies()).set(NAME, Buffer.from(JSON.stringify(p)).toString('base64url'), {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: PATH,
    maxAge: 600,
  });
}

function parse(raw: string): Programada | null {
  try {
    const v = JSON.parse(Buffer.from(raw, 'base64url').toString('utf8')) as Partial<Programada>;
    const ok =
      typeof v.folio === 'string' &&
      typeof v.eraseAt === 'string' &&
      Array.isArray(v.negocios) &&
      v.negocios.every((n) => typeof n === 'string');
    return ok ? (v as Programada) : null;
  } catch {
    return null;
  }
}

export async function leerProgramada(): Promise<Programada | null> {
  const raw = (await cookies()).get(NAME)?.value;
  return raw === undefined ? null : parse(raw);
}
