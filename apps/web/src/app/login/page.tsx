import type { Metadata } from 'next';
import { redirect } from 'next/navigation';

import { readSession } from '@/server/session';

import { LoginDoor } from './door';
import { LoginForm } from './form';
import { PUERTA_DUENO } from './puertas';

/** One of the two portal pages a search engine may index (see app/robots.ts). */
export const metadata: Metadata = {
  title: 'Iniciar sesión · Xangarro',
  description:
    'Entra al portal de Xangarro para ver tu caja, tus ventas y tus estados financieros NIF. Si aún no tienes cuenta, créala gratis en un minuto.',
};

/**
 * Sign in.
 *
 * Outside the `(portal)` group on purpose: it must render without the shell,
 * and without the shell's database reads, so a signed-out visitor never touches
 * a tenant query. The two doors come first; the member form is one click in.
 *
 * The chosen door is a search param so that «‹ Volver» and the browser's Back
 * button both work: with it in component state there was nothing for either to
 * undo.
 */
export const dynamic = 'force-dynamic';

export default async function LoginPage({
  searchParams,
}: {
  readonly searchParams: Promise<{ puerta?: string }>;
}) {
  if ((await readSession()) !== null) redirect('/');
  const { puerta } = await searchParams;
  if (puerta === PUERTA_DUENO) {
    return <LoginForm backTo={{ href: '/login', label: '‹ Volver' }} />;
  }
  return <LoginDoor />;
}
