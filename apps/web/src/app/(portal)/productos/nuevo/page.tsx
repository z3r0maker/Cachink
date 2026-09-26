import { redirect } from 'next/navigation';

import { requireSession } from '@/server/auth';
import { canWrite } from '@/session/gating';

import { NuevoProducto } from './asistente';

/**
 * `/productos/nuevo` — «Nuevo producto» as its own page (ADR-107): three short
 * questions with the caja tile beside them, instead of a five-section drawer.
 * A read-only role has nothing to create here and goes back to the catalogue.
 */
export const dynamic = 'force-dynamic';

export default async function NuevoProductoPage() {
  const session = await requireSession();
  if (!canWrite(session.member_role)) redirect('/productos');
  return <NuevoProducto />;
}
