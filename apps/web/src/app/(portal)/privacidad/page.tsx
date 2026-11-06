import { requireSession } from '@/server/auth';
import { reportError } from '@/server/observability/report';

import { loadPrivacidad } from './datos';
import { PrivacidadPantalla } from './pantalla';

/**
 * Privacidad y mis datos (PvPagina, ADR-137): every member's own page, from the
 * account menu. The aviso accepted and its text, the novedades switch, the
 * data rights, and how to withdraw consent.
 */
export const dynamic = 'force-dynamic';

export default async function PrivacidadPage() {
  const session = await requireSession();
  const data = await loadPrivacidad(session.sub, session.member_role === 'owner').catch(
    (error: unknown) => {
      reportError(error, { endpoint: 'privacidad' });
      return null;
    },
  );
  return <PrivacidadPantalla data={data} />;
}
