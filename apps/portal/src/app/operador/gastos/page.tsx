import { GASTOS_FIXTURE } from '@/operador/gastos/fixture';
import { GastosScreen } from '@/operador/gastos/screen';
import type { GastosScreenProps } from '@/operador/gastos/types';

const STATES = ['happy', 'loading', 'empty', 'error'] as const;

/** Development-only forcing of the design's `dataState` (ADR-058 §9). */
function forced(dataState: string | undefined): GastosScreenProps['state'] {
  if (process.env.NODE_ENV === 'production') return 'happy';
  return STATES.find((s) => s === dataState) ?? 'happy';
}

/** Operador · Gastos (O-23). Fixture data until the register runtime (O-06). */
export default async function OperadorGastosPage({
  searchParams,
}: {
  readonly searchParams: Promise<{ readonly dataState?: string }>;
}) {
  const { dataState } = await searchParams;
  return <GastosScreen state={forced(dataState)} data={GASTOS_FIXTURE} />;
}
