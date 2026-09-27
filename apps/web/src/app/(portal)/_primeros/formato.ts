import { formatMoney } from '@xangarro/domain';

import { pesosToCentavos } from '@/lib/money';

/** Formatting shared by the first-day screens: long dates and pesos. */
export const MESES = [
  'enero',
  'febrero',
  'marzo',
  'abril',
  'mayo',
  'junio',
  'julio',
  'agosto',
  'septiembre',
  'octubre',
  'noviembre',
  'diciembre',
] as const;

/** «31 de julio de 2026» from `2026-07-31` (or a timestamp starting so); '' when unparseable. */
export function fechaLarga(iso: string): string {
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(iso);
  if (m === null) return '';
  const mes = MESES[Number(m[2]) - 1];
  return mes === undefined ? '' : `${Number(m[3])} de ${mes} de ${m[1]}`;
}

/** Centavos of a typed amount; 0 when blank or not a number yet. */
export function centavosDe(pesos: string): bigint {
  return pesosToCentavos(pesos) ?? 0n;
}

/** «$1,234.00». */
export const dinero = (centavos: bigint): string => formatMoney(centavos);

/** Keeps only what an amount can hold while the owner types: digits, commas and a dot. */
export const soloMonto = (v: string): string => v.replace(/[^\d.,]/g, '');

/** Commas are for reading; the server gets the bare amount. */
export const sinComas = (v: string): string => v.replace(/,/g, '').trim();
