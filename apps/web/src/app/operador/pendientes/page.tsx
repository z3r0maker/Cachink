import { COLA_FIXTURE, type PendientesScreenProps } from '@xangarro/caja/pendientes';
import { PendientesViva } from '@/operador/pendientes/viva';

const STATES = ['happy', 'loading', 'empty', 'error'] as const;

/** Development-only forcing of the design's `dataState` (ADR-058 §9); `connection` is the shell's. */
function forced(dataState: string | undefined): PendientesScreenProps['state'] {
  if (process.env.NODE_ENV === 'production') return 'happy';
  return STATES.find((s) => s === dataState) ?? 'happy';
}

/**
 * Operador · Registros por enviar (O-27). The design's queue for an unlinked
 * browser; a linked caja lists and sends its own outbox.
 */
export default async function OperadorPendientesPage({
  searchParams,
}: {
  readonly searchParams: Promise<{ readonly dataState?: string }>;
}) {
  const { dataState } = await searchParams;
  return <PendientesViva fixture={COLA_FIXTURE} forzado={forced(dataState)} />;
}
