import type { Medidor, Nivel } from '@xangarro/domain/corp';

import type { TonoSenal } from './resumen-senales';

/**
 * What each line of a cap says (E-15, board CD-12d): 60 % informs, 80 % warns
 * and sends the founders to their adviser before 95 %, 95 % says to go now.
 * The same words are the drawer's alert and the Resumen's signal.
 */
export type CualTope = 'sas' | 'resico';

export interface Alerta {
  readonly titulo: string;
  readonly texto: string;
  readonly tono: TonoSenal;
}

const DEL: Record<CualTope, string> = { sas: 'de la SAS', resico: 'de RESICO' };

const SI_LO_PASA: Record<CualTope, string> = {
  sas: 'Si los ingresos del año pasan el tope, la SAS tiene que transformarse en otro tipo de sociedad',
  resico:
    'Si los ingresos del año pasan el tope, la empresa sale de RESICO y tributa en el régimen general',
};

const QUIEN: Record<CualTope, string> = { sas: 'el abogado', resico: 'el contador' };

const TONO: Record<Nivel, TonoSenal> = { 60: 'info', 80: 'warn', 95: 'bad' };

function consejo(cual: CualTope, nivel: Nivel): string {
  if (nivel === 95) return `${SI_LO_PASA[cual]}. Habla con ${QUIEN[cual]} hoy.`;
  if (nivel === 80) return `${SI_LO_PASA[cual]}: habla con ${QUIEN[cual]} antes del 95 %.`;
  return 'Avisa otra vez al 80 %.';
}

export function alertaDe(cual: CualTope, m: Medidor): Alerta | null {
  if (m.nivel === null) return null;
  const verbo = m.nivel === 95 ? 'Llegaste a' : 'Vas en';
  const ritmo = m.loPasa ? 'A este ritmo lo pasas antes de fin de año. ' : '';
  return {
    titulo: `${verbo} ${m.nivel} % del tope ${DEL[cual]}`,
    texto: `${ritmo}${consejo(cual, m.nivel)}`,
    tono: TONO[m.nivel],
  };
}
