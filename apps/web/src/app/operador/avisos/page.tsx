import { AVISOS_FIXTURE } from '@/operador/avisos/fixture';
import { AvisosScreen } from '@/operador/avisos/screen';
import type { AvisoGrupo, AvisosScreenProps } from '@/operador/avisos/types';

const STATES = ['happy', 'loading', 'empty', 'error'] as const;

type Query = Readonly<Record<'dataState' | 'startTab', string | undefined>>;

/** Development-only forcing of the design's `dataState` and `startTab` (ADR-058 §9). */
function forced(q: Query): { state: AvisosScreenProps['state']; tab: AvisoGrupo } {
  if (process.env.NODE_ENV === 'production') return { state: 'happy', tab: 'dueno' };
  return {
    state: STATES.find((s) => s === q.dataState) ?? 'happy',
    tab: q.startTab === 'sistema' ? 'caja' : 'dueno',
  };
}

/** Operador · Avisos (O-16). Fixture data until C-19 and the register runtime (O-06). */
export default async function OperadorAvisosPage({
  searchParams,
}: {
  readonly searchParams: Promise<Query>;
}) {
  const { state, tab } = forced(await searchParams);
  return <AvisosScreen state={state} data={AVISOS_FIXTURE} tab={tab} />;
}
