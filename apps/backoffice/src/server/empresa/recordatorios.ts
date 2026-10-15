import type { ObligacionVista } from '@xangarro/application/corp';
import { formatDateLong, parseIsoDate } from '@xangarro/domain';
import type { RecurrenteDelMes } from '@xangarro/domain/corp';
import type { GenericNoticeProps } from '@xangarro/email';

import { hrefDe } from './agenda-view';
import { diasEntre } from './fechas';
import { tituloDe } from './obligacion-view';
import { montoEstimado } from './recurrentes-view';

/**
 * The founders' morning email (E-04, E-02): an obligation still open 7, 3 and
 * 1 days before it is due, and a recurring expense on its charge day («Te
 * recordamos registrarlo cada 28», board CD-03).
 */
export const AVISOS = [7, 3, 1] as const;

export interface Recordatorio {
  readonly titulo: string;
  readonly vence: string;
  readonly dias: number;
  readonly href: string;
}

/** A recurring charge to register today. */
export interface CargoDeHoy {
  readonly nombre: string;
  /** In the template's currency: «USD 20.00». */
  readonly monto: string;
}

export function recordatoriosDe(
  vistas: readonly ObligacionVista[],
  hoy: string,
): readonly Recordatorio[] {
  return vistas
    .filter((o) => !o.cumplida)
    .map((o) => ({ o, dias: diasEntre(hoy, o.vence) }))
    .filter(({ dias }) => (AVISOS as readonly number[]).includes(dias))
    .map(({ o, dias }) => ({ titulo: tituloDe(o), vence: o.vence, dias, href: hrefDe(o) }))
    .sort((a, b) => a.dias - b.dias);
}

/** Only on the day itself: a charge left unregistered is in Movimientos as «Sugerido». */
export function cargosDeHoy(
  recurrentes: readonly RecurrenteDelMes[],
  hoy: string,
): readonly CargoDeHoy[] {
  return recurrentes
    .filter((r) => r.estado === 'sugerido' && r.fecha === hoy)
    .map((r) => ({ nombre: r.plantilla.nombre, monto: montoEstimado(r.plantilla) }));
}

const cuando = (dias: number) => (dias === 1 ? 'mañana' : `en ${dias} días`);

function asuntoDe(recordatorios: readonly Recordatorio[], cargos: readonly CargoDeHoy[]): string {
  const primero = recordatorios[0];
  if (recordatorios.length === 1 && primero !== undefined) {
    return `MEXIA: ${primero.titulo} vence ${cuando(primero.dias)}`;
  }
  if (recordatorios.length > 1) return `MEXIA: ${recordatorios.length} obligaciones vencen pronto`;
  const cargo = cargos[0];
  return cargos.length === 1 && cargo !== undefined
    ? `MEXIA: hoy toca registrar ${cargo.nombre}`
    : `MEXIA: hoy toca registrar ${cargos.length} gastos recurrentes`;
}

function parrafosDe(
  recordatorios: readonly Recordatorio[],
  cargos: readonly CargoDeHoy[],
): readonly string[] {
  const agenda =
    recordatorios.length === 0
      ? []
      : [
          'Esto vence pronto en la agenda de MEXIA:',
          ...recordatorios.map(
            (r) =>
              `${r.titulo}: vence ${cuando(r.dias)}, el ${formatDateLong(parseIsoDate(r.vence))}.`,
          ),
          'Recuerda: se marca presentada con su acuse y pagada con su comprobante.',
        ];
  const gastos =
    cargos.length === 0
      ? []
      : [
          `Hoy toca registrar: ${cargos.map((c) => `${c.nombre} (${c.monto})`).join(', ')}.`,
          'Regístralo con el monto de tu estado de cuenta.',
        ];
  return [...agenda, ...gastos];
}

export function correoDe(
  recordatorios: readonly Recordatorio[],
  consoleUrl: string,
  cargos: readonly CargoDeHoy[] = [],
): GenericNoticeProps {
  const subject = asuntoDe(recordatorios, cargos);
  return {
    subject,
    preview: subject,
    paragraphs: [...parrafosDe(recordatorios, cargos)],
    cta:
      recordatorios.length === 0
        ? { label: 'Abrir Movimientos', href: `${consoleUrl}/empresa/movimientos?ver=recurrentes` }
        : { label: 'Abrir la agenda', href: `${consoleUrl}/empresa/agenda` },
    reason: 'Te llega porque eres socio de MEXIA, S.A.S.',
  };
}
