import { colors } from '@xangarro/tokens';
import { formatMoney } from '@xangarro/domain';

import { OPERADOR_BASE } from '../shell/nav';
import type { CorteReciente, InicioData, TurnoAbierto } from './types';

/**
 * Every string on Inicio, derived from its data. The wording is copied from
 * `OpInicio.dc.html` and `OpInicioSituaciones.dc.html` (El Mostrador).
 */
const PALABRAS = [
  'Cero',
  'Uno',
  'Dos',
  'Tres',
  'Cuatro',
  'Cinco',
  'Seis',
  'Siete',
  'Ocho',
  'Nueve',
  'Diez',
];

/** «Dos clientes», «Una cancelada»: the design spells small counts out. */
export function enPalabras(n: number, femenino = false): string {
  const w = PALABRAS[n] ?? String(n);
  return femenino && n === 1 ? 'Una' : w;
}

const CAJA =
  'M6 3h12a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2ZM8 7h8M8 11h2M12 11h.01M16 11h.01M8 15h2M12 15h.01M16 15h.01';
const ALERTA = 'M12 3l9 16H3l9-16Zm0 6v4m0 3h.01';
const SIN_RED =
  'M12 20h.01M8.5 16.43a5 5 0 0 1 7 0M5 12.86a10 10 0 0 1 5.17-2.69M19 12.86a10 10 0 0 0-2-1.54M2 8.82a15 15 0 0 1 4.18-2.65M22 8.82a15 15 0 0 0-11.29-3.76M2 2l20 20';
const CANDADO = 'M4 11h16v10H4V11Zm4 0V7a4 4 0 0 1 8 0v4';
const RELOJ = 'M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18ZM12 7v5l3 2';

/** The hero's look, one per situation (`inicio.css` keys its variants on it). */
export type HeroTono = 'listo' | 'cerrado' | 'cerrar' | 'aclarar' | 'offline';

/** A line beside the action; `{ b }` pieces are figures, set bold. */
export type Nota = readonly (string | { readonly b: string })[];

export interface Hero {
  readonly tono: HeroTono;
  readonly eyebrow: string;
  readonly icon: string;
  readonly title: string;
  readonly body: string;
  readonly cta: string;
  readonly href: string;
  readonly nota?: Nota;
  readonly chip?: string;
  readonly extra?: { readonly label: string; readonly href: string };
}

const cerrado = (d: InicioData): Hero => ({
  tono: 'cerrado',
  eyebrow: 'Antes de cobrar',
  icon: CANDADO,
  title: 'Abre tu turno para empezar',
  body: 'Cuenta el efectivo con el que inicias. Contra ese fondo se cuadra tu corte al cerrar.',
  cta: 'Abrir turno',
  href: `${OPERADOR_BASE}/acceso`,
  nota: ['Ayer cerraste con ', { b: formatMoney(d.ultimoTurno.fondoSugerido) }, ' de fondo'],
});

const aclarar = (d: InicioData): Hero => ({
  tono: 'aclarar',
  eyebrow: 'Atiende esto',
  icon: ALERTA,
  title: `${d.dueno} te pidió aclarar el corte del ${d.corteAclarar.dia}`,
  body: `Faltaron ${formatMoney(d.corteAclarar.monto)} en la ${d.corteAclarar.caja}. Escribe qué pasó y queda cerrado.`,
  cta: 'Responderle',
  href: `${OPERADOR_BASE}/avisos`,
  nota: ['Te escribió hoy a las ', { b: d.corteAclarar.hora }],
});

/** «08:15» plus 12 hours: «20:15». */
export function sumarHoras(hhmm: string, horas: number): string {
  const [h = 0, m = 0] = hhmm.split(':').map(Number);
  const total = (h + horas) % 24;
  return `${String(total).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
}

const cerrar = (d: InicioData, t: TurnoAbierto): Hero => ({
  tono: 'cerrar',
  eyebrow: 'Lo primero',
  icon: RELOJ,
  title: `Llevas ${t.horasAbierto} horas con el turno abierto`,
  body: `Cuenta el efectivo y cierra para que ${d.dueno} tenga el día completo.`,
  cta: 'Cerrar mi turno',
  href: `${OPERADOR_BASE}/cierre`,
  nota: [
    'Abriste a las ',
    { b: t.desde },
    ' · ya son las ',
    { b: sumarHoras(t.desde, t.horasAbierto) },
  ],
});

const sinConexion = (d: InicioData): Hero => ({
  tono: 'offline',
  eyebrow: 'Atiende esto',
  icon: SIN_RED,
  chip: `${d.pendientes} sin enviar`,
  title: `Sin internet, sigue cobrando: ${d.pendientes} registros esperan`,
  body: 'Se envían solos cuando vuelva la señal. No podrás cerrar el turno hasta que suban.',
  cta: 'Ver pendientes',
  href: `${OPERADOR_BASE}/pendientes`,
  extra: { label: 'Seguir cobrando', href: `${OPERADOR_BASE}/caja` },
});

const vendiendo = (t: TurnoAbierto): Hero => ({
  tono: 'listo',
  eyebrow: 'Lo primero',
  icon: CAJA,
  title: 'La caja está lista',
  body: `Llevas ${t.ventas} ventas en este turno. La última fue hace ${t.ultimaVentaHace}.`,
  cta: 'Cobrar',
  href: `${OPERADOR_BASE}/caja`,
});

/** «Lo primero»: one action. Offline only overrides the plain selling case. */
export function heroFor(d: InicioData): Hero {
  const t = d.turno;
  if (d.situacion === 'turno-cerrado' || !t) return cerrado(d);
  if (d.situacion === 'corte-por-aclarar') return aclarar(d);
  if (d.situacion === 'hora-de-cerrar') return cerrar(d, t);
  return d.offline ? sinConexion(d) : vendiendo(t);
}

/** Don Cuentas' greeting: the time of day, plus «La caja está lista.» when it is. */
export function saludo(d: InicioData): string {
  const abierto = d.situacion !== 'turno-cerrado' && d.turno !== null;
  const hola = abierto ? `¡Buenas tardes, ${d.nombre}!` : `¡Buen día, ${d.nombre}!`;
  return heroFor(d).tono === 'listo' ? `${hola} La caja está lista.` : hola;
}

export function corteChip(c: CorteReciente): { label: string; bg: string; color: string } {
  const r = c.resultado;
  if (r.tipo === 'cuadro') {
    return { label: 'Cuadró', bg: colors.greenSoft, color: colors.greenText };
  }
  if (r.tipo === 'sobro') {
    return {
      label: `Sobraron ${formatMoney(r.monto)}`,
      bg: colors.blueSoft,
      color: colors.blueText,
    };
  }
  return { label: `Faltaron ${formatMoney(r.monto)}`, bg: colors.redSoft, color: colors.redText };
}
