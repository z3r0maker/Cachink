import { CUENTAS } from '@/operador/cobranza/cuentas';
import { HOY } from '@/operador/fixtures';
import { CobranzaScreen } from '@/operador/cobranza/screen';
import type { CobranzaScreenProps } from '@/operador/cobranza/types';

const STATES = ['happy', 'loading', 'empty', 'error'] as const;

/** Development-only forcing of the design's `dataState` (ADR-058 §9). */
function forced(dataState: string | undefined): CobranzaScreenProps['state'] {
  if (process.env.NODE_ENV === 'production') return 'happy';
  return STATES.find((s) => s === dataState) ?? 'happy';
}

/** Operador · Cobranza (O-25). Fixture data until the register runtime (O-06). */
export default async function OperadorCobranzaPage({
  searchParams,
}: {
  readonly searchParams: Promise<{ readonly dataState?: string }>;
}) {
  const { dataState } = await searchParams;
  return <CobranzaScreen state={forced(dataState)} data={{ cuentas: CUENTAS, hoy: HOY }} />;
}
