import { GASTOS_FIXTURE } from '@/operador/gastos/fixture';
import { GastosViva } from '@/operador/gastos/viva';

const STATES = ['happy', 'loading', 'empty', 'error'] as const;

/** Development-only forcing of the design's `dataState` (ADR-058 §9). */
function forced(dataState: string | undefined): 'happy' | 'loading' | 'empty' | 'error' {
  if (process.env.NODE_ENV === 'production') return 'happy';
  return STATES.find((s) => s === dataState) ?? 'happy';
}

/**
 * Operador · Gastos (O-23, real data O-35). Fixtures for an unlinked
 * browser; a linked register reads and writes its own database.
 */
export default async function OperadorGastosPage({
  searchParams,
}: {
  readonly searchParams: Promise<{ readonly dataState?: string }>;
}) {
  const { dataState } = await searchParams;
  return <GastosViva fixture={GASTOS_FIXTURE} forzado={forced(dataState)} />;
}
