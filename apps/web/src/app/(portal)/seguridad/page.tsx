import type { Metadata } from 'next';
import { redirect } from 'next/navigation';

import { accessDeps } from '@/server/acceso/live';
import { estadoSeguridad } from '@/server/acceso/seguridad';
import { requireSession } from '@/server/auth';
import { reportError } from '@/server/observability/report';

import { SeguridadPantalla } from './pantalla';

export const metadata: Metadata = { title: 'Seguridad · Xangarro' };

/**
 * Seguridad (N-83, ADR-142; board SgSeguridad): each person's own second
 * factor, from the account menu. Owner and admin only: a read-only member has
 * no page here, as the menu has no item for them, and lands on Inicio.
 */
export const dynamic = 'force-dynamic';

export default async function SeguridadPage() {
  const session = await requireSession();
  if (session.member_role === 'viewer') redirect('/');
  const estado = await estadoSeguridad(accessDeps(), session.sub).catch((error: unknown) => {
    reportError(error, { endpoint: 'seguridad' });
    return null;
  });
  return <SeguridadPantalla estado={estado} />;
}
