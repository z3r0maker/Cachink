import { requireSession } from '@/server/auth';
import { listarPendientes } from '@/server/revision';

import { RevisionScreen } from './screen';
import type { Pestana, RevisionData } from './types';

/**
 * Revisión de caja (O-30). Owner-only, like every portal screen. Fixture data
 * until the review status on products and clients exists (ADR-074 §2, C-18);
 * `?startTab=clientes` is the design's forcing, development only.
 */
export const dynamic = 'force-dynamic';

export default async function RevisionCajaPage({
  searchParams,
}: {
  readonly searchParams: Promise<{ readonly startTab?: string }>;
}) {
  const session = await requireSession();
  const { startTab } = await searchParams;
  const tab: Pestana =
    process.env.NODE_ENV !== 'production' && startTab === 'clientes' ? 'clientes' : 'productos';
  const pendientes = await listarPendientes(session.business_id);
  const sinNull = <
    T extends { readonly pareceA: string | null; readonly pareceAId: string | null },
  >(
    x: T,
  ) => {
    const { pareceA, pareceAId, ...rest } = x;
    return {
      ...rest,
      ...(pareceA === null ? {} : { pareceA }),
      ...(pareceAId === null ? {} : { pareceAId }),
    };
  };
  const data: RevisionData = {
    vendidoSinCosto: pendientes.vendidoSinCosto,
    productos: pendientes.productos.map(sinNull),
    clientes: pendientes.clientes.map(sinNull),
  };
  return <RevisionScreen data={data} tab={tab} />;
}
