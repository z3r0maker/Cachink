import { calcularIsrPorRegimen } from '../../financials/isr-regimen.js';
import type { Money } from '../../money/index.js';
import { TASA_ISR_PM_BPS } from '../resultados/cascada.js';
import type { Declaracion } from './declaracion.js';
import { ImpuestosInvalidosError } from './errors.js';

/**
 * The month's taxes as the ledger estimates them (E-13, board CD-09). RESICO
 * is cash basis, so every figure is what was collected or paid in the month.
 *
 * - **ISR provisional** (LISR art. 211): the year's income collected less its
 *   deductions paid, at 30 % through the portal's own `calcularIsrPorRegimen`
 *   (RESICO persona moral), less the provisional payments of the year's
 *   earlier months: the contador's figure once declared, the estimate before.
 * - **IVA del mes** (LIVA art. 5-D): IVA trasladado collected less IVA
 *   acreditable paid and less the saldo a favor of earlier months.
 * - **Retenciones**: the ISR and IVA withheld from suppliers, paid with it.
 *
 * Amounts are MXN centavos; a month's sum may be negative after a reversal.
 */
export interface MesFiscal {
  /** `YYYY-MM`. */
  readonly mes: string;
  /** Income collected in the month, IVA aside. */
  readonly ingresos: Money;
  /** Deductible expenses paid in the month, IVA acreditable aside. */
  readonly deducciones: Money;
  readonly ivaTrasladado: Money;
  readonly ivaAcreditable: Money;
  readonly retencionIsr: Money;
  readonly retencionIva: Money;
}

export interface IsrProvisional {
  readonly ingresosAnio: Money;
  readonly deduccionesAnio: Money;
  /** Negative while the year is at a loss. */
  readonly utilidad: Money;
  /** 30 % of a positive utilidad. */
  readonly causado: Money;
  readonly pagosAnteriores: Money;
  readonly aPagar: Money;
}

export interface IvaDelMes {
  readonly trasladado: Money;
  readonly acreditable: Money;
  readonly aFavorAnterior: Money;
  readonly aPagar: Money;
  /** What carries to the next month when the credits exceed the IVA collected. */
  readonly aFavor: Money;
}

export interface RetencionesDelMes {
  readonly isr: Money;
  readonly iva: Money;
  readonly total: Money;
}

export interface EstimadoDelMes {
  readonly mes: string;
  readonly isr: IsrProvisional;
  readonly iva: IvaDelMes;
  readonly retenciones: RetencionesDelMes;
  /** ISR + IVA + retenciones to pay. */
  readonly total: Money;
}

const MES = /^(\d{4})-(0[1-9]|1[0-2])$/;
const max0 = (v: Money): Money => (v > 0n ? v : 0n);

function indiceDe(mes: string): number {
  const m = MES.exec(mes);
  if (m === null) throw new ImpuestosInvalidosError(`«${mes}» no es un mes`);
  return Number(m[1]) * 12 + Number(m[2]) - 1;
}

function assertConsecutivos(meses: readonly MesFiscal[]): void {
  meses.forEach((m, i) => {
    const anterior = meses[i - 1];
    if (anterior !== undefined && indiceDe(m.mes) !== indiceDe(anterior.mes) + 1) {
      throw new ImpuestosInvalidosError(`${m.mes} no sigue a ${anterior.mes}`);
    }
    indiceDe(m.mes);
  });
}

interface Acumulado {
  anio: string;
  ingresos: Money;
  deducciones: Money;
  pagos: Money;
  aFavor: Money;
}

function isrDe(m: MesFiscal, a: Acumulado): IsrProvisional {
  const ingresosAnio = a.ingresos + m.ingresos;
  const deduccionesAnio = a.deducciones + m.deducciones;
  const utilidad = ingresosAnio - deduccionesAnio;
  const causado = calcularIsrPorRegimen({
    regimenSat: '626',
    persona: 'moral',
    ingresos: ingresosAnio,
    utilidad,
    isrTasa: TASA_ISR_PM_BPS,
  }).isr;
  const aPagar = max0(causado - a.pagos);
  return { ingresosAnio, deduccionesAnio, utilidad, causado, pagosAnteriores: a.pagos, aPagar };
}

function ivaDe(m: MesFiscal, aFavorAnterior: Money): IvaDelMes {
  const neto = m.ivaTrasladado - m.ivaAcreditable - aFavorAnterior;
  return {
    trasladado: m.ivaTrasladado,
    acreditable: m.ivaAcreditable,
    aFavorAnterior,
    aPagar: max0(neto),
    aFavor: max0(-neto),
  };
}

function estimadoDe(m: MesFiscal, a: Acumulado): EstimadoDelMes {
  const isr = isrDe(m, a);
  const iva = ivaDe(m, a.aFavor);
  const total = m.retencionIsr + m.retencionIva;
  const retenciones = { isr: m.retencionIsr, iva: m.retencionIva, total };
  return { mes: m.mes, isr, iva, retenciones, total: isr.aPagar + iva.aPagar + total };
}

/**
 * Each month's estimate, from consecutive months starting at the company's
 * first. The ISR accumulates from January; the IVA a favor carries on.
 */
export function estimadosDeImpuestos(
  meses: readonly MesFiscal[],
  declaradas: ReadonlyMap<string, Declaracion>,
): readonly EstimadoDelMes[] {
  assertConsecutivos(meses);
  let a: Acumulado = { anio: '', ingresos: 0n, deducciones: 0n, pagos: 0n, aFavor: 0n };
  return meses.map((m) => {
    const anio = m.mes.slice(0, 4);
    if (anio !== a.anio) a = { ...a, anio, ingresos: 0n, deducciones: 0n, pagos: 0n };
    const e = estimadoDe(m, a);
    a = {
      anio,
      ingresos: e.isr.ingresosAnio,
      deducciones: e.isr.deduccionesAnio,
      pagos: a.pagos + (declaradas.get(m.mes)?.isr ?? e.isr.aPagar),
      aFavor: e.iva.aFavor,
    };
    return e;
  });
}
