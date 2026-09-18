import { COLA_FIXTURE } from '@/operador/pendientes/fixture';
import { PendientesScreen } from '@/operador/pendientes/screen';
import type { PendientesScreenProps } from '@/operador/pendientes/types';

const STATES = ['happy', 'loading', 'empty', 'error'] as const;

/** Development-only forcing of the design's `dataState` (ADR-058 §9); `connection` is the shell's. */
function forced(dataState: string | undefined): PendientesScreenProps['state'] {
  if (process.env.NODE_ENV === 'production') return 'happy';
  return STATES.find((s) => s === dataState) ?? 'happy';
}

/** Operador · Registros por enviar (O-27). Fixture queue until the outbox (O-06). */
export default async function OperadorPendientesPage({
  searchParams,
}: {
  readonly searchParams: Promise<{ readonly dataState?: string }>;
}) {
  const { dataState } = await searchParams;
  return <PendientesScreen state={forced(dataState)} cola={COLA_FIXTURE} />;
}
