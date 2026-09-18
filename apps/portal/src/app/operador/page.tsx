import { INICIO_FIXTURE } from '@/operador/inicio/fixture';
import { InicioScreen } from '@/operador/inicio/screen';
import type { InicioData, InicioScreenProps, Situacion } from '@/operador/inicio/types';

const STATES = ['happy', 'loading', 'empty', 'error'] as const;
const SITUACIONES: readonly Situacion[] = [
  'vendiendo',
  'turno-cerrado',
  'hora-de-cerrar',
  'corte-por-aclarar',
];

type Query = Readonly<Record<'dataState' | 'situacion' | 'connection', string | undefined>>;

/**
 * Development-only forcing of the design's control-panel props
 * (`?dataState=…&situacion=…&connection=sin-conexion`, ADR-058 §9).
 */
function forced(q: Query): { state: InicioScreenProps['state']; data: InicioData } {
  if (process.env.NODE_ENV === 'production') return { state: 'happy', data: INICIO_FIXTURE };
  return {
    state: STATES.find((s) => s === q.dataState) ?? 'happy',
    data: {
      ...INICIO_FIXTURE,
      situacion: SITUACIONES.find((s) => s === q.situacion) ?? INICIO_FIXTURE.situacion,
      offline: q.connection === 'sin-conexion',
    },
  };
}

/** Operador · Inicio (O-14). Fixture data until the register runtime (O-06). */
export default async function OperadorInicioPage({
  searchParams,
}: {
  readonly searchParams: Promise<Query>;
}) {
  const { state, data } = forced(await searchParams);
  return <InicioScreen state={state} data={data} />;
}
