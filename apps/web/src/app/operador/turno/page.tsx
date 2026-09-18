import { TURNO_FIXTURE } from '@/operador/turno/fixture';
import { TurnoScreen } from '@/operador/turno/screen';
import type { TurnoScreenProps } from '@/operador/turno/types';

const STATES = ['happy', 'loading', 'empty', 'error'] as const;

/** Development-only `?dataState=…`, as the design's control panel (ADR-058 §9). */
function forcedState(q: string | undefined): TurnoScreenProps['state'] {
  if (process.env.NODE_ENV === 'production') return 'happy';
  return STATES.find((s) => s === q) ?? 'happy';
}

/** Operador · Turno (O-15). Fixture data until the register runtime (O-06). */
export default async function OperadorTurnoPage({
  searchParams,
}: {
  readonly searchParams: Promise<{ readonly dataState?: string }>;
}) {
  const { dataState } = await searchParams;
  return <TurnoScreen state={forcedState(dataState)} data={TURNO_FIXTURE} />;
}
