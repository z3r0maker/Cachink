import { INVENTARIO_FIXTURE } from '@/operador/inventario/fixture';
import { InventarioViva } from '@/operador/inventario/viva';
import type { InventarioScreenProps } from '@/operador/inventario/types';

const STATES = ['happy', 'loading', 'empty', 'error'] as const;
const TABS = ['existencias', 'movimientos'] as const;

type Query = Readonly<Record<'dataState' | 'startTab', string | undefined>>;

/** Development-only forcing of the design's `dataState` and `startTab` (ADR-058 §9). */
function forced(q: Query): Pick<InventarioScreenProps, 'state' | 'tab'> {
  if (process.env.NODE_ENV === 'production') return { state: 'happy', tab: 'existencias' };
  return {
    state: STATES.find((s) => s === q.dataState) ?? 'happy',
    tab: TABS.find((t) => t === q.startTab) ?? 'existencias',
  };
}

/**
 * Operador · Inventario (O-24). Fixtures for an unlinked browser; a linked
 * caja reads and writes its own database.
 */
export default async function OperadorInventarioPage({
  searchParams,
}: {
  readonly searchParams: Promise<Query>;
}) {
  const f = forced(await searchParams);
  return <InventarioViva fixture={INVENTARIO_FIXTURE} forzado={f.state} tab={f.tab} />;
}
