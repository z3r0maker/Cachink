import type { Money } from '@xangarro/domain';
import {
  assertNuevoObjetivo,
  assertPuedeAvanzar,
  assertPuedeEnviar,
  assertPuedeResponderPlan,
  estadoDelPlan,
  resumenDelTrimestre,
  TableroError,
  tarjetasDelTrimestre,
  type Socio,
} from '@xangarro/domain/corp';

import type { DatosDelTablero } from './ports.js';
import type { TableroDeps } from './tarjetas.js';

/**
 * The plan's writes and the objectives (E-20, board CD-13d): one partner
 * sends the quarter's plan, the other approves or rejects it; objectives are
 * typed in and their progress updated by hand.
 */
export async function enviarPlan(
  deps: TableroDeps,
  input: {
    readonly trimestre: string;
    readonly socio: Socio;
    readonly hoy: string;
    readonly founderId: string;
  },
): Promise<void> {
  const { planes } = await deps.tablero.leer();
  assertPuedeEnviar({ ...input, plan: estadoDelPlan(planes, input.trimestre) });
  await deps.tablero.agregarAlPlan(
    { trimestre: input.trimestre, tipo: 'enviado', socio: input.socio, fecha: input.hoy },
    input.founderId,
  );
}

/** Deliverables alive in the plan's quarter that still lack a value. */
export function sinValorEnElPlan(datos: DatosDelTablero, trimestre: string, hoy: string): number {
  return tarjetasDelTrimestre(datos.tarjetas, trimestre, hoy).filter(
    (t) => t.tarjeta.tipo === 'entregable' && t.valor.valor === null,
  ).length;
}

export async function responderPlan(
  deps: TableroDeps,
  input: {
    readonly trimestre: string;
    readonly socio: Socio;
    readonly aprobar: boolean;
    readonly hoy: string;
    readonly founderId: string;
  },
): Promise<void> {
  const datos = await deps.tablero.leer();
  assertPuedeResponderPlan({
    ...input,
    plan: estadoDelPlan(datos.planes, input.trimestre),
    sinValor: sinValorEnElPlan(datos, input.trimestre, input.hoy),
  });
  await deps.tablero.agregarAlPlan(
    {
      trimestre: input.trimestre,
      tipo: input.aprobar ? 'aprobado' : 'rechazado',
      socio: input.socio,
      fecha: input.hoy,
    },
    input.founderId,
  );
}

export async function crearObjetivo(
  deps: TableroDeps,
  input: {
    readonly trimestre: string;
    readonly quien: Socio | null;
    readonly titulo: string;
    readonly meta: number;
    readonly unidad: string;
    readonly hoy: string;
    readonly founderId: string;
  },
): Promise<string> {
  const o = assertNuevoObjetivo(input);
  return deps.tablero.crearObjetivo(
    { trimestre: o.trimestre, quien: o.quien, titulo: o.titulo, meta: o.meta, unidad: o.unidad },
    input.founderId,
  );
}

export async function actualizarAvance(
  deps: TableroDeps,
  input: {
    readonly objetivoId: string;
    readonly valor: number;
    readonly socio: Socio;
    readonly hoy: string;
    readonly founderId: string;
  },
): Promise<void> {
  const { objetivos } = await deps.tablero.leer();
  const o = objetivos.find((x) => x.id === input.objetivoId);
  if (o === undefined) throw new TableroError('OBJETIVO_DESCONOCIDO');
  assertPuedeAvanzar(o, input);
  await deps.tablero.agregarAvance(
    o.id,
    { valor: input.valor, fecha: input.hoy, socio: input.socio },
    input.founderId,
  );
}

/**
 * What each partner had accepted in a quarter, for its money close (E-03):
 * the pool counts additional money up to this value. Only once the quarter is
 * decided; until then its reviews may still change it. A quarter from before
 * the Tablero (no plan, no card) is not `cubierto`: its close keeps the value
 * the founders type, rather than reading nothing delivered.
 */
export function aceptadoDelTrimestre(
  datos: DatosDelTablero,
  trimestre: string,
  hoy: string,
): {
  readonly cubierto: boolean;
  readonly decidido: boolean;
  readonly aceptado: Readonly<Record<Socio, Money>>;
} {
  const r = resumenDelTrimestre({ trimestre, tarjetas: datos.tarjetas, planes: datos.planes, hoy });
  const cubierto = r.tarjetas.length > 0 || datos.planes.some((p) => p.trimestre === trimestre);
  return {
    cubierto,
    decidido: r.decidido,
    aceptado: { 1: r.socios[0].aceptado, 2: r.socios[1].aceptado },
  };
}
