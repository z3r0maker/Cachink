import { formatMoney, type Money } from '@xangarro/domain';
import {
  estadoDeSolicitud,
  LIMITE_MINIMO,
  montoAprobado,
  totalMensual,
  usadoDelLimite,
  type SolicitudGasto,
} from '@xangarro/domain/corp';

import { diaDe } from './fechas';
import type { Calculo } from './presupuesto-calculo';
import { solicitudesDe } from './presupuesto-tablero';
import {
  efectoEnElMes,
  nombreCategoria,
  nombreDe,
  type VistaPresupuesto,
} from './presupuesto-view';

/**
 * Board CD-15d's two lower panels: each founder's Límite and what they used
 * of it this month, and «Fuera del presupuesto»: the requests waiting on this
 * founder, with their effect on the month, and the rest with their state.
 * Pure.
 */
export interface LimiteSocio {
  readonly id: string;
  readonly nombre: string;
  readonly usado: string;
  /** 0–100 of the Límite. */
  readonly avance: number;
  readonly detalle: string;
}

export interface LimiteVista {
  readonly monto: string;
  readonly texto: string;
  readonly socios: readonly LimiteSocio[];
}

export type EstadoFila = 'Sin aprobación' | 'Aprobado' | 'Rechazado' | 'Por aprobar';

export interface FilaFuera {
  readonly id: string;
  readonly concepto: string;
  readonly detalle: string;
  readonly monto: string;
  readonly estado: EstadoFila;
}

export interface PorAprobar {
  readonly id: string;
  readonly concepto: string;
  readonly monto: string;
  readonly detalle: string;
  readonly efecto: string;
}

function textoLimite(c: Calculo): string {
  if (c.ingresoPromedio <= 0n) {
    return `Sin ingresos en los últimos 3 meses aplica el mínimo: ${formatMoney(LIMITE_MINIMO)}. Sube solo cuando lleguen los ingresos.`;
  }
  return `El mayor entre ${formatMoney(LIMITE_MINIMO)} y el 10 % del ingreso promedio de 3 meses sin IVA (${formatMoney(c.ingresoPromedio)}). Sube solo cuando crecen los ingresos.`;
}

function detalleSocio(c: Calculo, ss: readonly SolicitudGasto[], id: string, founderId: string) {
  const yo = id === founderId;
  const espera = ss.find((s) => s.founderId === id && estadoDeSolicitud(s) === 'pendiente');
  if (espera !== undefined) {
    return yo
      ? `Tu solicitud de ${formatMoney(espera.monto)} espera la aprobación del otro socio.`
      : `Tiene una solicitud de ${formatMoney(espera.monto)} esperando tu aprobación.`;
  }
  const usado = usadoDelLimite(ss, id, c.mes);
  const queda = formatMoney(c.limite > usado ? c.limite - usado : 0n);
  const ultima = ss.filter((s) => s.automatica && s.founderId === id).at(-1);
  const antes =
    ultima === undefined
      ? 'Nada fuera del presupuesto este mes.'
      : `${ultima.concepto} el ${diaDe(ultima.at)}.`;
  return `${antes} ${yo ? 'Te quedan' : 'Le quedan'} ${queda} este mes.`;
}

export function limiteDe(
  c: Calculo,
  todas: readonly SolicitudGasto[],
  socios: ReadonlyMap<string, string>,
  founderId: string,
): LimiteVista {
  const ss = todas.filter((s) => s.periodo === c.mes);
  return {
    monto: formatMoney(c.limite),
    texto: textoLimite(c),
    socios: [...socios].map(([id, nombre]) => {
      const usado = usadoDelLimite(ss, id, c.mes);
      return {
        id,
        nombre,
        usado: formatMoney(usado),
        avance: Math.min(100, Number((usado * 100n) / c.limite)),
        detalle: detalleSocio(c, ss, id, founderId),
      };
    }),
  };
}

export function efectoDe(c: Calculo, monto: Money): string {
  return efectoEnElMes({
    mes: c.mes,
    proyeccion: totalMensual(c.delMes.proyeccion),
    presupuesto: c.vigente === null ? null : totalMensual(c.vigente.montos),
    monto,
  });
}

const ESTADO: Record<ReturnType<typeof estadoDeSolicitud>, EstadoFila> = {
  automatica: 'Sin aprobación',
  aprobada: 'Aprobado',
  rechazada: 'Rechazado',
  pendiente: 'Por aprobar',
};

function detalleFila(s: SolicitudGasto, socios: ReadonlyMap<string, string>): string {
  const quien = `${nombreDe(socios, s.founderId)} · ${diaDe(s.at)}`;
  const r = s.respuesta;
  if (s.automatica) return `${quien} · dentro de su límite, no requirió aprobación`;
  if (r === null)
    return `${quien} · espera la aprobación de ${nombreDe(socios, [...socios.keys()].find((id) => id !== s.founderId) ?? '')}`;
  const por = `por ${nombreDe(socios, r.founderId)} el ${diaDe(r.at)}`;
  if (r.kind === 'rechazada') return `${quien} · rechazado ${por}`;
  const menos = r.monto !== null && r.monto < s.monto ? ` · pidió ${formatMoney(s.monto)}` : '';
  return `${quien} · aprobado ${por}${menos}`;
}

export function fueraDe(
  c: Calculo,
  todas: readonly SolicitudGasto[],
  socios: ReadonlyMap<string, string>,
  founderId: string,
  vista: VistaPresupuesto,
): { readonly porAprobar: readonly PorAprobar[]; readonly filas: readonly FilaFuera[] } {
  const ss = solicitudesDe(todas, c, vista);
  const mias = (s: SolicitudGasto) =>
    estadoDeSolicitud(s) === 'pendiente' && s.founderId !== founderId;
  return {
    porAprobar: ss.filter(mias).map((s) => ({
      id: s.id,
      concepto: s.concepto,
      monto: formatMoney(s.monto),
      detalle: `Pedida por ${nombreDe(socios, s.founderId)} el ${diaDe(s.at)} · ${nombreCategoria(s.categoria)} · rebasa su límite de ${formatMoney(c.limite)}, así que necesita tu aprobación.`,
      efecto: efectoDe(c, s.monto),
    })),
    filas: ss
      .filter((s) => !mias(s))
      .reverse()
      .map((s) => ({
        id: s.id,
        concepto: s.concepto,
        detalle: detalleFila(s, socios),
        monto: formatMoney(montoAprobado(s) > 0n ? montoAprobado(s) : s.monto),
        estado: ESTADO[estadoDeSolicitud(s)],
      })),
  };
}
