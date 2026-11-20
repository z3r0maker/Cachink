import type { Money } from '@xangarro/domain';
import {
  assertNuevaTarjeta,
  assertPuedeCotizar,
  assertPuedeProponer,
  assertPuedeQuitar,
  estadoDeTarjeta,
  estadoDelPlan,
  eventoDeMovimiento,
  nombreTrimestre,
  resumenDelTrimestre,
  TableroError,
  trimestreDe,
  type Accion,
  type EventoTarjeta,
  type Movimiento,
  type Socio,
  type Tarjeta,
  type TipoTarjeta,
} from '@xangarro/domain/corp';

import type { Adjunto, DatosDelTablero, TableroRepository } from './ports.js';

/**
 * The Tablero's card writes (E-20, board CD-13c): a new card, a partner's
 * value, the quote, leaving a plan, and each move through review. A file is
 * filed in the Expediente only once the write is known to be valid, and the
 * write itself is decided again on the card as read under its lock.
 */
export interface TableroDeps {
  readonly tablero: TableroRepository;
}

const PENDIENTE = 'pendiente';

function tarjetaDe(datos: DatosDelTablero, id: string): Tarjeta {
  const t = datos.tarjetas.find((x) => x.id === id);
  if (t === undefined) throw new TableroError('TARJETA_DESCONOCIDA');
  return t;
}

const hecho = <T>(r: T | null | false): T => {
  if (r === null || r === false) throw new TableroError('TARJETA_DESCONOCIDA');
  return r;
};

export async function crearTarjeta(
  deps: TableroDeps,
  input: {
    readonly trimestre: string;
    readonly tipo: TipoTarjeta;
    readonly titulo: string;
    readonly criterio: string;
    readonly responsable: Socio;
    readonly vence: string;
    readonly objetivoId: string | null;
    readonly valor: Money | null;
    readonly socio: Socio;
    readonly hoy: string;
    readonly founderId: string;
  },
): Promise<string> {
  const n = assertNuevaTarjeta(input);
  if (input.objetivoId !== null) {
    const { objetivos } = await deps.tablero.leer();
    const o = objetivos.find((x) => x.id === input.objetivoId);
    if (o?.trimestre !== n.trimestre) throw new TableroError('OBJETIVO_DESCONOCIDO');
  }
  const valores = { 1: null, 2: null, [input.socio]: n.valor };
  return deps.tablero.crearTarjeta(
    { ...n, responsable: input.responsable, objetivoId: input.objetivoId, valores },
    input.founderId,
  );
}

export async function proponerValor(
  deps: TableroDeps,
  input: {
    readonly tarjetaId: string;
    readonly socio: Socio;
    readonly valor: Money;
    readonly hoy: string;
    readonly founderId: string;
  },
): Promise<void> {
  const datos = await deps.tablero.leer();
  tarjetaDe(datos, input.tarjetaId);
  const ok = await deps.tablero.cambiar(
    input.tarjetaId,
    (t) => {
      assertPuedeProponer(t, { ...input, plan: estadoDelPlan(datos.planes, t.trimestre) });
      return { valores: { ...t.valores, [input.socio]: input.valor } };
    },
    input.founderId,
  );
  hecho(ok);
}

export async function usarCotizacion(
  deps: TableroDeps,
  input: {
    readonly tarjetaId: string;
    readonly monto: Money;
    readonly hoy: string;
    readonly founderId: string;
    readonly adjunto: Adjunto | null;
  },
): Promise<void> {
  const t = tarjetaDe(await deps.tablero.leer(), input.tarjetaId);
  const conDoc = input.adjunto === null ? null : PENDIENTE;
  assertPuedeCotizar(t, { monto: input.monto, documentoId: conDoc });
  const documentoId = await (input.adjunto as Adjunto)();
  const ok = await deps.tablero.cambiar(
    input.tarjetaId,
    (actual) => {
      assertPuedeCotizar(actual, { monto: input.monto, documentoId });
      return { cotizacion: { monto: input.monto, documentoId } };
    },
    input.founderId,
  );
  hecho(ok);
}

export async function quitarDelPlan(
  deps: TableroDeps,
  input: {
    readonly tarjetaId: string;
    readonly trimestre: string;
    readonly hoy: string;
    readonly founderId: string;
  },
): Promise<void> {
  const datos = await deps.tablero.leer();
  tarjetaDe(datos, input.tarjetaId);
  const plan = estadoDelPlan(datos.planes, input.trimestre);
  const ok = await deps.tablero.cambiar(
    input.tarjetaId,
    (t) => {
      assertPuedeQuitar(t, { trimestre: input.trimestre, plan, hoy: input.hoy });
      return { descartadaEn: input.trimestre };
    },
    input.founderId,
  );
  hecho(ok);
}

/** An objection reaches the mediator only while its quarter's close still waits. */
function assertMediadorAbierto(datos: DatosDelTablero, t: Tarjeta, hoy: string): void {
  const terminada = estadoDeTarjeta(t, hoy).terminadaEl;
  if (terminada === null) return;
  const trimestre = trimestreDe(terminada);
  const r = resumenDelTrimestre({ trimestre, tarjetas: datos.tarjetas, planes: datos.planes, hoy });
  if (r.decidido) throw new TableroError('MEDIADOR_CERRADO', nombreTrimestre(trimestre));
}

export async function moverTarjeta(
  deps: TableroDeps,
  input: Omit<Movimiento, 'documentoId'> & {
    readonly accion: Accion;
    readonly tarjetaId: string;
    readonly founderId: string;
    readonly adjunto: Adjunto | null;
  },
): Promise<EventoTarjeta> {
  const datos = await deps.tablero.leer();
  const t = tarjetaDe(datos, input.tarjetaId);
  eventoDeMovimiento(t, { ...input, documentoId: input.adjunto === null ? null : PENDIENTE });
  if (input.accion === 'mediador') assertMediadorAbierto(datos, t, input.hoy);
  const documentoId = input.adjunto === null ? null : await input.adjunto();
  const ev = await deps.tablero.mover(
    input.tarjetaId,
    (actual) => eventoDeMovimiento(actual, { ...input, documentoId }),
    input.founderId,
  );
  return hecho(ev);
}
