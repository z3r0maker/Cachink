import {
  INICIO_FIXTURE,
  type InicioData,
  type InicioScreenProps,
  type Situacion,
} from '@xangarro/caja/inicio';
import { InicioViva } from '@/operador/inicio/viva';

const STATES = ['happy', 'loading', 'empty', 'error'] as const;
const SITUACIONES: readonly Situacion[] = [
  'vendiendo',
  'turno-cerrado',
  'hora-de-cerrar',
  'corte-por-aclarar',
];

type Query = Readonly<
  Record<'dataState' | 'situacion' | 'connection' | 'ultimoCorte', string | undefined>
>;

/** The file's «Con faltante» last turno (`ultimoCorte: faltante`). */
const FALTANTE = { tipo: 'falto', monto: 6_000n, motivo: 'cambio mal dado' } as const;

/**
 * Development-only forcing of the design's control-panel props
 * (`?dataState=…&situacion=…&connection=sin-conexion&ultimoCorte=faltante`,
 * ADR-058 §9).
 */
function forced(q: Query): { state: InicioScreenProps['state']; data: InicioData } {
  if (process.env.NODE_ENV === 'production') return { state: 'happy', data: INICIO_FIXTURE };
  return {
    state: STATES.find((s) => s === q.dataState) ?? 'happy',
    data: {
      ...INICIO_FIXTURE,
      situacion: SITUACIONES.find((s) => s === q.situacion) ?? INICIO_FIXTURE.situacion,
      offline: q.connection === 'sin-conexion',
      ultimoTurno:
        q.ultimoCorte === 'faltante'
          ? { ...INICIO_FIXTURE.ultimoTurno, resultado: FALTANTE }
          : INICIO_FIXTURE.ultimoTurno,
    },
  };
}

/**
 * Operador · Inicio (O-14, real data O-39). Fixture for an unlinked browser; a
 * linked register reads its own open turno.
 */
export default async function OperadorInicioPage({
  searchParams,
}: {
  readonly searchParams: Promise<Query>;
}) {
  const { state, data } = forced(await searchParams);
  return <InicioViva fixture={data} forzado={state} />;
}
