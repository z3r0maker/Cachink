import type { Money } from '../../money/index.js';
import type { Socio } from '../ledger/movements.js';
import { rangoDelTrimestre, trimestreAnterior, trimestreDe } from '../socios/dinero.js';
import { estadoDeTarjeta, type EstadoTarjeta, type Fase } from './estado.js';
import { estadoDelPlan, limiteDelPlan, type EstadoPlan } from './plan.js';
import { otroSocio, type EventoPlan, type Tarjeta } from './tipos.js';
import { valorDeTarjeta, type ValorDeTarjeta } from './valor.js';

/**
 * One quarter of the Tablero (OD-4 §4, §5): each partner's commitment, what
 * was accepted and what waits in review, and the close. A partner cumple with
 * at least half of the commitment accepted; what was finished in the quarter
 * counts once accepted, so the close waits for those reviews. Cards not
 * accepted roll into the next quarter with their value.
 */
export type Columna = 'por_hacer' | 'en_curso' | 'en_revision' | 'terminado';

const COLUMNA: Record<Fase, Columna> = {
  por_hacer: 'por_hacer',
  en_curso: 'en_curso',
  en_revision: 'en_revision',
  objetada: 'en_revision',
  al_mediador: 'en_revision',
  aceptada: 'terminado',
  hecha: 'terminado',
};

export interface TarjetaEnTrimestre {
  readonly tarjeta: Tarjeta;
  readonly estado: EstadoTarjeta;
  readonly valor: ValorDeTarjeta;
  readonly columna: Columna;
  /** It came from an earlier quarter. */
  readonly arrastrada: boolean;
}

export type FuenteCompromiso = 'plan' | 'borrador' | 'anterior';

export interface ResumenSocio {
  readonly socio: Socio;
  readonly comprometido: Money;
  readonly fuente: FuenteCompromiso;
  readonly aceptado: Money;
  readonly enRevision: Money;
  /** Accepted over committed, rounded; null with nothing committed. */
  readonly porcentaje: number | null;
  /** Null until the quarter is decided. */
  readonly cumple: boolean | null;
}

export interface ResumenTrimestre {
  readonly trimestre: string;
  readonly plan: EstadoPlan;
  readonly limitePlan: string;
  readonly tarjetas: readonly TarjetaEnTrimestre[];
  readonly socios: readonly [ResumenSocio, ResumenSocio];
  /** Its last day went by. */
  readonly terminado: boolean;
  /** Reviews of cards finished in it that still wait. */
  readonly pendientes: number;
  readonly decidido: boolean;
  /** When the last pending window ends; null when none waits, or one is with the mediator. */
  readonly cierraEl: string | null;
  /** Alive in it and not accepted in it: they rolled over. */
  readonly arrastre: readonly TarjetaEnTrimestre[];
  /** The partner whose commitment is under half the other's. */
  readonly desbalance: Socio | null;
  /** The only partner under the minimum, who gets a notice. */
  readonly incumple: Socio | null;
}

export interface EntradaTrimestre {
  readonly trimestre: string;
  readonly tarjetas: readonly Tarjeta[];
  readonly planes: readonly EventoPlan[];
  readonly hoy: string;
}

export function vivaEn(t: Tarjeta, e: EstadoTarjeta, trimestre: string): boolean {
  if (t.trimestre > trimestre) return false;
  if (t.descartadaEn !== null && t.descartadaEn <= trimestre) return false;
  return e.cuentaEn === null || e.cuentaEn >= trimestre;
}

export function tarjetasDelTrimestre(
  tarjetas: readonly Tarjeta[],
  trimestre: string,
  hoy: string,
): TarjetaEnTrimestre[] {
  return tarjetas.flatMap((tarjeta) => {
    const estado = estadoDeTarjeta(tarjeta, hoy);
    if (!vivaEn(tarjeta, estado, trimestre)) return [];
    const valor = valorDeTarjeta(tarjeta);
    const arrastrada = tarjeta.trimestre < trimestre;
    return [{ tarjeta, estado, valor, columna: COLUMNA[estado.fase], arrastrada }];
  });
}

const suma = (ts: readonly TarjetaEnTrimestre[]): Money =>
  ts.reduce((s, t) => s + (t.valor.valor ?? 0n), 0n);

const entregablesDe = (ts: readonly TarjetaEnTrimestre[], socio: Socio) =>
  ts.filter((t) => t.tarjeta.tipo === 'entregable' && t.tarjeta.responsable === socio);

const primerTrimestre = (e: EntradaTrimestre): string =>
  [...e.tarjetas.map((t) => t.trimestre), ...e.planes.map((p) => p.trimestre)].sort()[0] ??
  e.trimestre;

function compromiso(
  e: EntradaTrimestre,
  trimestre: string,
  socio: Socio,
): { readonly monto: Money; readonly fuente: FuenteCompromiso } {
  const plan = estadoDelPlan(e.planes, trimestre);
  const propio = () =>
    suma(entregablesDe(tarjetasDelTrimestre(e.tarjetas, trimestre, e.hoy), socio));
  if (plan.fase === 'aprobado') return { monto: propio(), fuente: 'plan' };
  if (e.hoy <= limiteDelPlan(trimestre)) return { monto: propio(), fuente: 'borrador' };
  const anterior = trimestreAnterior(trimestre);
  if (anterior < primerTrimestre(e)) return { monto: 0n, fuente: 'anterior' };
  return { monto: compromiso(e, anterior, socio).monto, fuente: 'anterior' };
}

const enRevision = (t: TarjetaEnTrimestre, trimestre: string) =>
  t.columna === 'en_revision' &&
  t.estado.terminadaEl !== null &&
  trimestreDe(t.estado.terminadaEl) === trimestre;

/** Rounded half up: 20 of 70 is 29 %. */
const porcentaje = (a: Money, c: Money): number | null =>
  c === 0n ? null : Number((a * 200n + c) / (c * 2n));

function resumenSocio(
  e: EntradaTrimestre,
  vivas: readonly TarjetaEnTrimestre[],
  socio: Socio,
  decidido: boolean,
): ResumenSocio {
  const { monto, fuente } = compromiso(e, e.trimestre, socio);
  const propias = entregablesDe(vivas, socio);
  const aceptado = suma(propias.filter((t) => t.estado.cuentaEn === e.trimestre));
  return {
    socio,
    comprometido: monto,
    fuente,
    aceptado,
    enRevision: suma(propias.filter((t) => enRevision(t, e.trimestre))),
    porcentaje: porcentaje(aceptado, monto),
    cumple: decidido ? aceptado * 2n >= monto : null,
  };
}

function cierre(vivas: readonly TarjetaEnTrimestre[], e: EntradaTrimestre) {
  const terminado = e.hoy >= rangoDelTrimestre(e.trimestre)[1];
  const espera = vivas.filter(
    (t) =>
      enRevision(t, e.trimestre) &&
      (t.estado.fase === 'en_revision' || t.estado.fase === 'al_mediador'),
  );
  const conMediador = espera.some((t) => t.estado.fase === 'al_mediador');
  const plazos = espera.map((t) => t.estado.plazo ?? '').sort();
  const cierraEl = terminado && !conMediador ? (plazos.at(-1) ?? null) : null;
  return {
    terminado,
    pendientes: espera.length,
    decidido: terminado && espera.length === 0,
    cierraEl,
  };
}

function quien(
  socios: readonly [ResumenSocio, ResumenSocio],
  f: (s: ResumenSocio, o: ResumenSocio) => boolean,
) {
  const [a, b] = socios;
  if (f(a, b) && !f(b, a)) return a.socio;
  if (f(b, a) && !f(a, b)) return b.socio;
  return null;
}

export function resumenDelTrimestre(e: EntradaTrimestre): ResumenTrimestre {
  const vivas = tarjetasDelTrimestre(e.tarjetas, e.trimestre, e.hoy);
  const c = cierre(vivas, e);
  const socios = [
    resumenSocio(e, vivas, 1, c.decidido),
    resumenSocio(e, vivas, otroSocio(1), c.decidido),
  ] as const;
  return {
    trimestre: e.trimestre,
    plan: estadoDelPlan(e.planes, e.trimestre),
    limitePlan: limiteDelPlan(e.trimestre),
    tarjetas: vivas,
    socios,
    ...c,
    arrastre: c.decidido ? vivas.filter((t) => t.estado.cuentaEn !== e.trimestre) : [],
    desbalance: quien(socios, (s, o) => s.comprometido * 2n < o.comprometido),
    incumple: quien(socios, (s) => s.cumple === false),
  };
}
