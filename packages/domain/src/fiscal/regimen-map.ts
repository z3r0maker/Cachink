import { ISR_DEFAULTS_SEED, type RegimenFiscal } from '../entities/regimen-fiscal.js';
import { REGIMEN_FISCAL } from './regimen.js';

/**
 * The SAT régimen code is the business's régimen (owner decision 2026-09-18).
 * Everything else is derived from it here — the name people read, and the
 * four-bucket `RegimenFiscal` the ISR defaults are keyed by — so nothing
 * compares régimen strings anywhere else.
 */

/** SAT's c_RegimenFiscal descriptions (Anexo 20). */
export const REGIMEN_NOMBRE: Readonly<Record<string, string>> = {
  '601': 'General de Ley Personas Morales',
  '603': 'Personas Morales con Fines no Lucrativos',
  '605': 'Sueldos y Salarios e Ingresos Asimilados a Salarios',
  '606': 'Arrendamiento',
  '607': 'Enajenación o Adquisición de Bienes',
  '608': 'Demás ingresos',
  '610': 'Residentes en el Extranjero sin Establecimiento Permanente en México',
  '611': 'Ingresos por Dividendos (socios y accionistas)',
  '612': 'Personas Físicas con Actividades Empresariales y Profesionales',
  '614': 'Ingresos por intereses',
  '615': 'Ingresos por obtención de premios',
  '616': 'Sin obligaciones fiscales',
  '620': 'Sociedades Cooperativas de Producción que optan por diferir sus ingresos',
  '621': 'Incorporación Fiscal',
  '622': 'Actividades Agrícolas, Ganaderas, Silvícolas y Pesqueras',
  '623': 'Opcional para Grupos de Sociedades',
  '624': 'Coordinados',
  '625': 'Actividades Empresariales con ingresos a través de Plataformas Tecnológicas',
  '626': 'Régimen Simplificado de Confianza',
};

const BUCKET: Readonly<Record<string, RegimenFiscal>> = {
  '626': 'RESICO',
  '621': 'RIF',
  '605': 'Asalariados',
};

/** The ISR bucket of a code. Total: any code not named here is «Otro». */
export const regimenBucket = (code: string | null): RegimenFiscal =>
  (code !== null && BUCKET[code]) || 'Otro';

const LEGACY: Readonly<Record<string, string>> = { RESICO: '626', RIF: '621', Asalariados: '605' };

/**
 * A stored régimen from before the switch, as a code. «Otro» named no régimen
 * in particular, so it maps to null — the owner is asked, nobody guesses.
 */
export function regimenFromLegacy(value: string): string | null {
  if (REGIMEN_FISCAL[value] !== undefined) return value;
  return LEGACY[value] ?? null;
}

export class RegimenInvalidError extends Error {
  readonly code = 'REGIMEN_INVALID' as const;

  constructor(readonly regimen: string) {
    super('Ese régimen fiscal no existe en el catálogo del SAT.');
    this.name = 'RegimenInvalidError';
  }
}

/**
 * Choosing a régimen: the code, its derived bucket (kept in `regimenFiscal` for
 * phones that still read names), and the ISR rate to suggest for it.
 */
export function regimenPatch(code: string) {
  if (REGIMEN_FISCAL[code] === undefined) throw new RegimenInvalidError(code);
  const bucket = regimenBucket(code);
  return { regimenSat: code, regimenFiscal: bucket, isrSugerido: ISR_DEFAULTS_SEED[bucket] };
}
