import { CAJA_FIXTURE } from '@/operador/caja/fixture';
import { CajaScreen } from '@/operador/caja/screen';
import type { CajaData, CajaScreenProps, CobroPaso } from '@/operador/caja/types';

const STATES = ['happy', 'loading', 'empty', 'error'] as const;
const PASOS: readonly CobroPaso[] = ['catalogo', 'metodo', 'efectivo', 'credito'];

type Query = Readonly<Record<'dataState' | 'startView' | 'ticketSeed', string | undefined>>;

/** Development-only forcing of the design's control panel (ADR-058 §9). */
function forced(q: Query): Omit<CajaScreenProps, 'data'> & { data: CajaData } {
  if (process.env.NODE_ENV === 'production') {
    return { state: 'happy', paso: 'catalogo', data: CAJA_FIXTURE };
  }
  return {
    state: STATES.find((s) => s === q.dataState) ?? 'happy',
    paso: PASOS.find((p) => p === q.startView) ?? 'catalogo',
    data: q.ticketSeed === 'vacio' ? { ...CAJA_FIXTURE, ticket: [] } : CAJA_FIXTURE,
  };
}

/** Operador · Caja (O-20, fase 11). Fixture data until the register runtime (O-06). */
export default async function OperadorCajaPage({
  searchParams,
}: {
  readonly searchParams: Promise<Query>;
}) {
  const props = forced(await searchParams);
  return <CajaScreen {...props} />;
}
