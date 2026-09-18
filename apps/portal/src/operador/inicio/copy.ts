import { colors } from '@xangarro/tokens';
import { formatMoney } from '@xangarro/domain';

import { ICONS, OPERADOR_BASE } from '../shell/nav';
import type { CorteReciente, InicioData, TurnoAbierto } from './types';

/**
 * Every string on Inicio, derived from its data. The wording is copied from
 * `Operador Inicio.dc.html` — the plan forbids rewriting it (§1.5).
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

const ALERTA = 'M12 3l9 16H3l9-16Zm0 6v4m0 3h.01';
const NUBE = 'M21 11a9 9 0 0 0-15-5.5L3 8m0-5v5h5m-5 3a9 9 0 0 0 15 5.5l3-2.5m0 5v-5h-5';
const CANDADO = 'M4 11h16v10H4V11Zm4 0V7a4 4 0 0 1 8 0v4';

export interface Hero {
  readonly eyebrow: string;
  readonly icon: string;
  readonly title: string;
  readonly body: string;
  readonly cta: string;
  readonly href: string;
  readonly bg: string;
  readonly ctaBg: string;
}

const cerrado = (): Hero => ({
  eyebrow: 'Antes de cobrar',
  icon: CANDADO,
  title: 'Abre tu turno para empezar',
  body: 'Cuenta el efectivo con el que inicias. Contra ese fondo se cuadra tu corte al cerrar.',
  cta: 'Abrir turno',
  href: `${OPERADOR_BASE}/acceso`,
  bg: colors.white,
  ctaBg: colors.yellow,
});

const aclarar = (d: InicioData): Hero => ({
  eyebrow: 'Atiende esto',
  icon: ALERTA,
  title: `${d.dueno} te pidió aclarar el corte del ${d.corteAclarar.dia}`,
  body: `Faltaron ${formatMoney(d.corteAclarar.monto)} en la ${d.corteAclarar.caja}. Escribe qué pasó y queda cerrado.`,
  cta: 'Responder',
  href: `${OPERADOR_BASE}/avisos`,
  bg: colors.redSoft,
  ctaBg: colors.yellow,
});

const cerrar = (d: InicioData, horas: number): Hero => ({
  eyebrow: 'Lo primero',
  icon: ICONS.turno,
  title: 'Es hora de cerrar tu turno',
  body: `Llevas ${horas} horas con la caja abierta. Cuenta el efectivo y cierra para que ${d.dueno} tenga el día completo.`,
  cta: 'Cerrar turno',
  href: `${OPERADOR_BASE}/cierre`,
  bg: colors.peachSoft,
  ctaBg: colors.yellow,
});

const sinConexion = (d: InicioData): Hero => ({
  eyebrow: 'Atiende esto',
  icon: NUBE,
  title: `Hay ${d.pendientes} registros sin enviar`,
  body: 'Puedes seguir cobrando, pero no podrás cerrar el turno hasta que suban.',
  cta: 'Ver la cola',
  href: `${OPERADOR_BASE}/pendientes`,
  bg: colors.warningSoft,
  ctaBg: colors.white,
});

const vendiendo = (t: TurnoAbierto): Hero => ({
  eyebrow: 'Lo primero',
  icon: ICONS.caja,
  title: 'La caja está lista',
  body: `Llevas ${t.ventas} ventas en este turno. La última fue hace ${t.ultimaVentaHace}.`,
  cta: 'Cobrar',
  href: `${OPERADOR_BASE}/caja`,
  bg: colors.yellow,
  ctaBg: colors.white,
});

/** «Lo primero»: one action. Offline only overrides the plain selling case. */
export function heroFor(d: InicioData): Hero {
  const t = d.turno;
  if (d.situacion === 'turno-cerrado' || !t) return cerrado();
  if (d.situacion === 'corte-por-aclarar') return aclarar(d);
  if (d.situacion === 'hora-de-cerrar') return cerrar(d, t.horasAbierto);
  return d.offline ? sinConexion(d) : vendiendo(t);
}

export function corteChip(c: CorteReciente): { label: string; bg: string; color: string } {
  const r = c.resultado;
  if (r.tipo === 'cuadro') {
    return { label: 'Cuadró', bg: colors.greenSoft, color: colors.greenText };
  }
  if (r.tipo === 'sobro') {
    return {
      label: `Sobró ${formatMoney(r.monto)}`,
      bg: colors.blueSoft,
      color: colors.blueText,
    };
  }
  return {
    label: `Faltó ${formatMoney(r.monto)}`,
    bg: colors.redSoft,
    color: colors.redText,
  };
}

/** «Tus cuatro cortes anteriores: tres cuadraron y uno sobró $20.00.» */
export function cortesNota(cortes: readonly CorteReciente[]): string {
  const cuadraron = cortes.filter((c) => c.resultado.tipo === 'cuadro').length;
  const partes = cortes.flatMap((c) =>
    c.resultado.tipo === 'cuadro'
      ? []
      : [
          `uno ${c.resultado.tipo === 'sobro' ? 'sobró' : 'faltó'} ${formatMoney(c.resultado.monto)}`,
        ],
  );
  const total = enPalabras(cortes.length).toLowerCase();
  const base = `Tus ${total} cortes anteriores: ${enPalabras(cuadraron).toLowerCase()} cuadraron`;
  return partes.length ? `${base} y ${partes.join(' y ')}.` : `${base}.`;
}
