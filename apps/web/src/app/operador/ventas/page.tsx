import { VENTAS_FIXTURE } from '@/operador/ventas/fixture';
import { VentasScreen } from '@/operador/ventas/screen';
import type { VentasScreenProps } from '@/operador/ventas/types';

const STATES = ['happy', 'loading', 'empty', 'error'] as const;
const FILTROS = ['Todos', 'Efectivo', 'Fiado'] as const;

type Query = Readonly<Record<'dataState' | 'startFilter', string | undefined>>;

/** Development-only forcing of the design's `dataState` and `startFilter` (ADR-058 §9). */
function forced(q: Query): Pick<VentasScreenProps, 'state' | 'filtro'> {
  if (process.env.NODE_ENV === 'production') return { state: 'happy', filtro: 'Todos' };
  return {
    state: STATES.find((s) => s === q.dataState) ?? 'happy',
    filtro: FILTROS.find((f) => f === q.startFilter) ?? 'Todos',
  };
}

/** Operador · Ventas (O-21). Fixture data until the register runtime (O-06). */
export default async function OperadorVentasPage({
  searchParams,
}: {
  readonly searchParams: Promise<Query>;
}) {
  return <VentasScreen {...forced(await searchParams)} data={VENTAS_FIXTURE} />;
}
