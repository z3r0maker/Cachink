import { requireSession } from '@/server/auth';

import { CORTES_FIXTURE } from './fixture';
import { CortesScreen } from './screen';
import type { FiltroCortes } from './types';

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
  await requireSession();
  const { startFilter } = await searchParams;
  const filtro =
    process.env.NODE_ENV === 'production'
      ? 'Todos'
      : (FILTROS.find((f) => f === startFilter) ?? 'Todos');
  return <CortesScreen cortes={CORTES_FIXTURE} filtro={filtro} />;
}
