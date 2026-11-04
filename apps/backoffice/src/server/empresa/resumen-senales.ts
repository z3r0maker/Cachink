import { formatMoneyEntero } from '@xangarro/domain';
import type { Autonomia, Certificado } from '@xangarro/domain/corp';

import type { GrupoAgenda, ItemAgenda } from './agenda-view';
import { puntos } from './resumen-view';

/**
 * Resumen's «Señales» and «Próximos vencimientos» (E-16, board CD-12b). A
 * signal says what crossed which line and links to the screen that explains
 * it (plan E-16's acceptance). The infra ÷ MRR and SAS-cap signals wait for
 * E-10 and E-15. Pure.
 */
export type TonoSenal = 'info' | 'warn' | 'bad';

export interface Senal {
  readonly titulo: string;
  readonly porque: string;
  readonly accion: string;
  readonly href: string;
  readonly tono: TonoSenal;
}

/** Plan E-16: gross margin under 70 %, runway under 6 months. */
export const UMBRAL_MARGEN_BPS = 7000;
export const UMBRAL_MESES = 6;

export interface EntradaSenales {
  readonly margenBruto: number | null;
  /** The period on screen, for the margin's link. */
  readonly periodo: string;
  readonly autonomia: Autonomia;
  readonly certificados: readonly { readonly certificado: Certificado; readonly dias: number }[];
  readonly vencidas: readonly ItemAgenda[];
}

function margen(bps: number | null, periodo: string): Senal[] {
  if (bps === null || bps >= UMBRAL_MARGEN_BPS) return [];
  const pts = puntos(bps);
  return [
    {
      titulo: `El margen bruto está en ${pts} %`,
      porque: `La señal se enciende abajo de 70 %. El costo del servicio es ${100 - pts} % de los ingresos.`,
      accion: 'Ver resultados',
      href: `/empresa/resultados?periodo=${periodo}`,
      tono: 'info',
    },
  ];
}

function runway(a: Autonomia): Senal[] {
  const m = a.mesesDeCaja;
  if (m === null || m >= UMBRAL_MESES) return [];
  const meses = `${m.toLocaleString('es-MX', { maximumFractionDigits: 1 })} ${m === 1 ? 'mes' : 'meses'}`;
  return [
    {
      titulo: m === 0 ? 'La caja ya no alcanza' : `La caja alcanza para ${meses}`,
      porque: `La señal se enciende abajo de 6 meses. Cada mes salen ${formatMoneyEntero(-a.neto)} más de los que entran.`,
      accion: 'Ver movimientos',
      href: '/empresa/movimientos',
      tono: 'bad',
    },
  ];
}

const TITULAR: Record<Certificado['titular'], string> = {
  mexia: 'de MEXIA',
  f1: 'del Fundador 1',
  f2: 'del Fundador 2',
};

function cuando(dias: number): string {
  if (dias < 0) return dias === -1 ? 'venció ayer' : `venció hace ${-dias} días`;
  if (dias === 0) return 'vence hoy';
  return dias === 1 ? 'vence mañana' : `vence en ${dias} días`;
}

function certificado(c: Certificado, dias: number): Senal {
  const csd = c.tipo === 'csd';
  return {
    titulo: csd ? `El CSD ${cuando(dias)}` : `La e.firma ${TITULAR[c.titular]} ${cuando(dias)}`,
    porque: csd
      ? 'Si vence, no se puede facturar.'
      : 'Sin e.firma no se renueva el CSD ni se presentan trámites ante el SAT.',
    accion: 'Ver certificados',
    href: '/empresa/corporativo',
    tono: dias < 0 ? 'bad' : 'warn',
  };
}

/** Late items arrive oldest first (`grupos`), so the first is the oldest. */
function vencidas(items: readonly ItemAgenda[]): Senal[] {
  const [primera] = items;
  if (primera === undefined) return [];
  const comun = { accion: 'Ver agenda', href: '/empresa/agenda', tono: 'bad' as const };
  if (items.length === 1) {
    return [{ titulo: primera.titulo, porque: `Vencida desde el ${primera.fecha}.`, ...comun }];
  }
  return [
    {
      titulo: `${items.length} obligaciones vencidas`,
      porque: `La más antigua, ${primera.titulo}, venció el ${primera.fecha}.`,
      ...comun,
    },
  ];
}

export function senalesDe(e: EntradaSenales): Senal[] {
  return [
    ...margen(e.margenBruto, e.periodo),
    ...runway(e.autonomia),
    ...e.certificados.map((c) => certificado(c.certificado, c.dias)),
    ...vencidas(e.vencidas),
  ];
}

/** «Próximos vencimientos»: the next three open items; the late ones are signals. */
export function proximos(grupos: readonly GrupoAgenda[]): ItemAgenda[] {
  return grupos
    .filter((g) => g.label !== 'Vencidas')
    .flatMap((g) => g.items)
    .slice(0, 3);
}
