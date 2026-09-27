import { TURNO_FIXTURE, type TurnoScreenProps } from '@xangarro/caja/turno';
import { TurnoViva } from '@/operador/turno/viva';

const STATES = ['happy', 'loading', 'empty', 'error'] as const;

/** Development-only `?dataState=…`, as the design's control panel (ADR-058 §9). */
function forcedState(q: string | undefined): TurnoScreenProps['state'] {
  if (process.env.NODE_ENV === 'production') return 'happy';
  return STATES.find((s) => s === q) ?? 'happy';
}

/**
 * Operador · Turno (O-15, real data O-39). Fixture for an unlinked browser; a
 * linked register reads its own open turno.
 */
export default async function OperadorTurnoPage({
  searchParams,
}: {
  readonly searchParams: Promise<{ readonly dataState?: string }>;
}) {
  const { dataState } = await searchParams;
  return <TurnoViva fixture={TURNO_FIXTURE} forzado={forcedState(dataState)} />;
}
