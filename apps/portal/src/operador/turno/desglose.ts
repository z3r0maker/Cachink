import { efectivoEsperado, formatMoney, type Money } from '@xangarro/domain';

/** The four parts of the turno's expected cash (ADR-074 §3). */
export interface PartesEsperado {
  readonly fondo: Money;
  readonly ventasEfectivo: Money;
  readonly abonosEfectivo: Money;
  readonly gastosEfectivo: Money;
}

/** The domain calculator over the four parts (O-03). */
export const esperadoDe = (p: PartesEsperado): Money =>
  efectivoEsperado({
    fondo: p.fondo,
    ventasEfectivo: [p.ventasEfectivo],
    abonosEfectivo: [p.abonosEfectivo],
    gastosCaja: [p.gastosEfectivo],
  });

/** Its rows, as Turno and Cierre show them under the figure. */
export const desglose = (p: PartesEsperado): readonly (readonly [string, string])[] => [
  ['Fondo de caja', formatMoney(p.fondo)],
  ['Ventas en efectivo', formatMoney(p.ventasEfectivo)],
  ['Abonos en efectivo', formatMoney(p.abonosEfectivo)],
  ['Gastos de caja chica', `−${formatMoney(p.gastosEfectivo)}`],
];
