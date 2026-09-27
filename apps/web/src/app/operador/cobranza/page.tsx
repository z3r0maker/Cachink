import { CUENTAS, type CobranzaScreenProps } from '@xangarro/caja/cobranza';
import { HOY } from '@xangarro/caja';
import { CobranzaScreen } from '@/operador/cobranza/screen';

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
  return (
    <CobranzaScreen
      state={forced(dataState)}
      data={{ cuentas: CUENTAS, hoy: HOY, negocio: 'Taquería Don Pedro' }}
    />
  );
}
