import { requireSession } from '@/server/auth';
import { listarCortes } from '@/server/cortes';

import { CortesScreen } from './screen';
import type { Corte, FiltroCortes } from './types';

const FILTROS: readonly FiltroCortes[] = ['Todos', 'Por aclarar', 'Con diferencia'];

/**
 * Cortes de turno (O-31). Owner-only. Fixture data until the close stores its
 * count (ADR-074 §4, C-18); `?startFilter=` is the design's forcing, development only.
 */
export const dynamic = 'force-dynamic';

export default async function CortesPage({
  searchParams,
}: {
  readonly searchParams: Promise<{ readonly startFilter?: string }>;
}) {
  const session = await requireSession();
  const { startFilter } = await searchParams;
  const filtro =
    process.env.NODE_ENV === 'production'
      ? 'Todos'
      : (FILTROS.find((f) => f === startFilter) ?? 'Todos');
  const filas = await listarCortes(session.business_id);
  const cortes: readonly Corte[] = filas.map((f) => {
    const { motivo, nota, ...rest } = f;
    return { ...rest, ...(motivo === null ? {} : { motivo }), ...(nota === null ? {} : { nota }) };
  });
  return <CortesScreen cortes={cortes} filtro={filtro} />;
}
