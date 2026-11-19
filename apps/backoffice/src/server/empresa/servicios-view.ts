import { formatMoney } from '@xangarro/domain';
import { proximoCargo, promedioMensual, type Servicio } from '@xangarro/domain/corp';

import { diasEntre, fechaCorta } from './fechas';
import {
  categoriaDe,
  cobroTexto,
  costosDe,
  estadoTexto,
  hrefServicio,
  promedioTexto,
  type DatosServicios,
  type EstadoTexto,
} from './servicios-textos';
import { lecturaDelMes } from './servicios-uso-view';

/**
 * Servicios' list (E-24, board CD-18): the five tiles, every service but the
 * dropped ones with its average, payment and next charge, the filter chips,
 * and the cards and accounts that pay them. Pure.
 */
export type VerServicios = 'todos' | 'uso' | 'fijos' | 'gratis' | 'por_contratar';

export const FILTROS_SERVICIOS: readonly { readonly id: VerServicios; readonly label: string }[] = [
  { id: 'todos', label: 'Todos' },
  { id: 'uso', label: 'Por uso' },
  { id: 'fijos', label: 'Fijos' },
  { id: 'gratis', label: 'Gratis' },
  { id: 'por_contratar', label: 'Por contratar' },
];

export function parseVer(value: string | undefined): VerServicios {
  return FILTROS_SERVICIOS.find((f) => f.id === value)?.id ?? 'todos';
}

export interface FilaServicio {
  readonly id: string;
  readonly href: string;
  readonly nombre: string;
  readonly para: string;
  readonly categoria: string;
  readonly categoriaKey: Servicio['categoria'];
  readonly cobro: string;
  readonly promedio: string;
  readonly pagaCon: string;
  readonly proximo: string;
  readonly estado: EstadoTexto;
}

function entra(s: Servicio, ver: VerServicios): boolean {
  if (ver === 'por_contratar') return s.estado === 'por_contratar';
  if (ver === 'uso') return s.cobro === 'uso' || s.cobro === 'comision';
  if (ver === 'fijos') return s.cobro === 'fijo' || s.cobro === 'anual';
  return ver === 'todos' || s.cobro === ver;
}

/** «28 oct», «10 sep 2027», or how a service without a day charges. */
export function proximoTexto(s: Servicio, hoy: string): string {
  if (s.estado === 'por_contratar') return 'Al contratar';
  if (s.cobro === 'comision') return 'Con cada pago';
  if (s.cobro === 'gratis') return 'Sin cargo';
  if (s.cobro === 'uso') return 'Cada mes';
  const f = proximoCargo(s, hoy);
  if (f === null) return '—';
  return f.slice(0, 4) === hoy.slice(0, 4) ? fechaCorta(f) : `${fechaCorta(f)} ${f.slice(0, 4)}`;
}

function pagaConTexto(s: Servicio): string {
  if (s.cobro === 'comision') return 'Se descuenta del pago';
  if (s.cobro === 'gratis') return 'Sin cargo';
  return s.pagaCon ?? '—';
}

export function filaDe(s: Servicio, d: DatosServicios): FilaServicio {
  const costos = costosDe(s, d);
  return {
    id: s.id,
    href: hrefServicio(s.id),
    nombre: s.nombre,
    para: s.para ?? '',
    categoria: categoriaDe(s),
    categoriaKey: s.categoria,
    cobro: cobroTexto(s),
    promedio: promedioTexto(s, costos, d.hoy.slice(0, 7)),
    pagaCon: pagaConTexto(s),
    proximo: proximoTexto(s, d.hoy),
    estado: estadoTexto(s, costos),
  };
}

/** The list on screen: every service not dropped, narrowed by the chip. */
export function filasServicios(d: DatosServicios, ver: VerServicios): readonly FilaServicio[] {
  return d.servicios.filter((s) => s.estado !== 'baja' && entra(s, ver)).map((s) => filaDe(s, d));
}

export interface Tile {
  readonly label: string;
  readonly valor: string;
  readonly nota: string;
  readonly aviso: boolean;
}

const nombres = (xs: readonly Servicio[], vacio: string) =>
  xs.length === 0 ? vacio : xs.map((s) => s.nombre).join(', ');

/** A fixed or annual charge within 30 days; usage ones charge every month by definition. */
function renuevan(servicios: readonly Servicio[], hoy: string): readonly Servicio[] {
  return servicios.filter((s) => {
    if (s.cobro !== 'fijo' && s.cobro !== 'anual') return false;
    const f = proximoCargo(s, hoy);
    return f !== null && diasEntre(hoy, f) <= 30;
  });
}

export function tilesServicios(d: DatosServicios): readonly Tile[] {
  const mes = d.hoy.slice(0, 7);
  const activos = d.servicios.filter((s) => s.estado === 'activo');
  const alMes = activos.reduce(
    (t, s) => t + (promedioMensual(s.cobro, costosDe(s, d), mes) ?? 0n),
    0n,
  );
  const uso = lecturaDelMes(activos, d.hoy);
  const cerca = activos.filter((s) => estadoTexto(s, costosDe(s, d)).tono === 'aviso');
  const contratar = d.servicios.filter((s) => s.estado === 'por_contratar');
  const r = renuevan(activos, d.hoy);
  return [
    {
      label: 'Servicios al mes',
      valor: formatMoney(alMes),
      nota: 'Promedio de los últimos 3 meses',
      aviso: false,
    },
    { label: uso.label, valor: uso.valor, nota: uso.nota, aviso: false },
    {
      label: 'Gratis cerca del límite',
      valor: String(cerca.length),
      nota: nombres(cerca, 'Ninguno pasa de 60 %'),
      aviso: cerca.length > 0,
    },
    {
      label: 'Por contratar',
      valor: String(contratar.length),
      nota: nombres(contratar, 'Nada pendiente'),
      aviso: false,
    },
    {
      label: 'Renuevan en 30 días',
      valor: String(r.length),
      nota: nombres(r, 'Ninguno'),
      aviso: false,
    },
  ];
}

/** «Tarjetas y cuentas de pago»: what pays each contracted service, with how many it pays. */
export function mediosDePago(d: DatosServicios): readonly { nombre: string; cuantos: string }[] {
  const cuenta = new Map<string, number>();
  for (const s of d.servicios) {
    if (
      s.estado !== 'activo' ||
      s.pagaCon === null ||
      s.cobro === 'gratis' ||
      s.cobro === 'comision'
    )
      continue;
    cuenta.set(s.pagaCon, (cuenta.get(s.pagaCon) ?? 0) + 1);
  }
  return [...cuenta].map(([nombre, n]) => ({
    nombre,
    cuantos: n === 1 ? '1 servicio ligado' : `${n} servicios ligados`,
  }));
}
