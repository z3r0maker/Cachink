import {
  formatDateSlash,
  parseIsoDate,
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
 * today; a malformed custom range falls back to the month.
 */
export const PERIODOS = [
  { value: 'mensual', label: 'Mensual' },
  { value: 'trimestral', label: 'Trimestral' },
  { value: 'anual', label: 'Anual' },
  { value: 'personalizado', label: 'Personalizado' },
] as const;

export type TipoPeriodo = (typeof PERIODOS)[number]['value'];

export interface Periodo {
  readonly tipo: TipoPeriodo;
  readonly rango: Rango;
  readonly etiqueta: string;
}

const isDate = (v: string | undefined): v is string => /^\d{4}-\d{2}-\d{2}$/.test(v ?? '');

function rangoDe(tipo: TipoPeriodo, hoy: IsoDate, desde?: string, hasta?: string): Rango {
  if (tipo === 'trimestral') return rangoDelTrimestre(hoy);
  if (tipo === 'anual') return rangoDelAnio(hoy);
  if (tipo === 'personalizado' && isDate(desde) && isDate(hasta) && desde <= hasta) {
    return { desde: parseIsoDate(desde), hasta: parseIsoDate(hasta) };
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
  };
}
