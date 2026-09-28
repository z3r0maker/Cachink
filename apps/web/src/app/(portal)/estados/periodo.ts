import {
  cabeEnMeses,
  esIsoDate,
  TOPE_MESES_ESTADOS,
  formatDateSlash,
  rangoDelAnio,
  rangoDelMes,
  rangoDelTrimestre,
  type IsoDate,
  type Rango,
} from '@xangarro/domain';

/**
 * The statements' period (P-14): Mensual, Trimestral, Anual or Personalizado,
 * carried in the URL (`?p=trimestral`, `?p=personalizado&desde=…&hasta=…`) so
 * a period can be linked, reloaded and printed. Relative to the business's
 * today; a malformed custom range — including a day that does not exist, like
 * `2026-02-30` (R3-14) — falls back to the month.
 *
 * A custom range is capped at {@link TOPE_MESES} months (DB3-EST-01, DS-09):
 * `desde=2000-01-01&hasta=2099-12-31` used to read the whole history into
 * memory. Past the cap the period is kept, so the picker can show what was
 * asked for, but marked `excedido`, and nothing is computed for it.
 */
export const PERIODOS = [
  { value: 'mensual', label: 'Mensual' },
  { value: 'trimestral', label: 'Trimestral' },
  { value: 'anual', label: 'Anual' },
  { value: 'personalizado', label: 'Personalizado' },
] as const;

export type TipoPeriodo = (typeof PERIODOS)[number]['value'];

/** The longest Personalizado the statements compute (the domain's rule). */
export const TOPE_MESES = TOPE_MESES_ESTADOS;
export const ERROR_TOPE = `Elige un periodo de hasta ${TOPE_MESES} meses.`;

export interface Periodo {
  readonly tipo: TipoPeriodo;
  readonly rango: Rango;
  readonly etiqueta: string;
  /** A Personalizado longer than {@link TOPE_MESES}: refused, not computed. */
  readonly excedido: boolean;
}

/** Whether the custom range is within the cap — the picker and the server ask the same. */
export const dentroDelTope = (rango: Rango): boolean => cabeEnMeses(rango, TOPE_MESES);

function rangoDe(tipo: TipoPeriodo, hoy: IsoDate, desde?: string, hasta?: string): Rango {
  if (tipo === 'trimestral') return rangoDelTrimestre(hoy);
  if (tipo === 'anual') return rangoDelAnio(hoy);
  if (tipo === 'personalizado' && esIsoDate(desde) && esIsoDate(hasta) && desde <= hasta) {
    return { desde, hasta };
  }
  return rangoDelMes(hoy);
}

export function periodoDe(
  hoy: IsoDate,
  params: { readonly p?: string; readonly desde?: string; readonly hasta?: string },
): Periodo {
  const tipo = PERIODOS.find((x) => x.value === params.p)?.value ?? 'mensual';
  const rango = rangoDe(tipo, hoy, params.desde, params.hasta);
  return {
    tipo,
    rango,
    etiqueta: `${formatDateSlash(rango.desde)} – ${formatDateSlash(rango.hasta)}`,
    excedido: tipo === 'personalizado' && !dentroDelTope(rango),
  };
}
