import { ChevronLeft } from 'lucide-react';
import Link from 'next/link';
import { redirect } from 'next/navigation';

import { requireSession } from '@/server/auth';
import { loadEliminar } from '@/server/cuenta/pagina';
import { reportError } from '@/server/observability/report';

import { Contenido } from './contenido';
import * as s from './eliminar.css';

/**
 * «Eliminar tu cuenta» (ElEliminar, ADR-136), owner only: download, what is
 * erased and what is kept, then the password. The account and every business
 * it owns close today and are erased in 30 days.
 */
export const dynamic = 'force-dynamic';

async function cargar(userId: string, email: string) {
  try {
    return await loadEliminar(userId, email, new Date());
  } catch (error) {
    reportError(error, { endpoint: 'negocio/eliminar' });
    return null;
  }
}

export default async function EliminarPage() {
  const session = await requireSession();
  if (session.member_role !== 'owner') redirect('/negocio');
  const data = await cargar(session.sub, session.email);
  return (
    <div className={s.pila}>
      <Link href="/negocio" className={s.volver}>
        <ChevronLeft size={18} aria-hidden="true" />
        Mi negocio
      </Link>
      <h1 className={s.titulo}>Eliminar tu cuenta</h1>
      <p className={s.bajada}>
        Tu cuenta y tus negocios se cierran hoy y se borran en 30 días. Hasta entonces puedes
        arrepentirte desde el correo que te mandamos.
      </p>
      <Contenido data={data} actual={session.business_id} />
    </div>
  );
}
