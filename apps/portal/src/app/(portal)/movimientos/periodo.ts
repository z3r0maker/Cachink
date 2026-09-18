import {
  nombreDelMes,
  rangoDelMes,
  rangoDeSemana,
  type IsoDate,
  type Rango,
} from '@xangarro/domain';

/**
 * The four range chips (P-09): Hoy, Semana (Monday to Sunday), the current
 * month by name, and Personalizado with two dates. Each chip **is** a range —
 * the rows are filtered by it; a chip that only highlights is a bug.
 */
export type RangoChip = 'hoy' | 'semana' | 'mes' | 'personalizado';

export interface Personalizado {
  readonly desde: string;
  readonly hasta: string;
}

export const chips = (hoy: IsoDate): readonly { value: RangoChip; label: string }[] => [
  { value: 'hoy', label: 'Hoy' },
  { value: 'semana', label: 'Semana' },
  { value: 'mes', label: nombreDelMes(hoy) },
  { value: 'personalizado', label: 'Personalizado' },
];

/** The range to filter by; a half-filled Personalizado is open on that side. */
export function rangoDe(chip: RangoChip, hoy: IsoDate, custom: Personalizado): Rango {
  if (chip === 'hoy') return { desde: hoy, hasta: hoy };
  if (chip === 'semana') return rangoDeSemana(hoy);
  if (chip === 'mes') return rangoDelMes(hoy);
  return {
    desde: (custom.desde || '0000-01-01') as IsoDate,
    hasta: (custom.hasta || '9999-12-31') as IsoDate,
  };
}
