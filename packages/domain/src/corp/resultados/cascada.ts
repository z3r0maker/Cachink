import { calcularIsrPorRegimen } from '../../financials/isr-regimen.js';
import type { Money } from '../../money/index.js';
import type { AccountKey } from '../ledger/accounts.js';
import { CuentaFueraDeResultadosError } from './errors.js';
import { enPeriodo, type Periodo } from './periodo.js';

/**
 * §4's cascade (E-12, board CD-07), from ingresos to utilidad neta. The
 * ledger posts each P&L line when it is invoiced; a line also carries the day
 * its money moved (`fechaFlujo`), null while an invoice on credit is unpaid.
 * Devengado reads the first date, flujo the second (OD-1: devengado by
 * default). ISR is always estimated on cash, as RESICO persona moral pays it.
 */
export type Base = 'devengado' | 'flujo';

export const CUENTAS_RESULTADOS = [
  'ingresos',
  'costo_servicio',
  'ventas_marketing',
  'desarrollo',
  'administracion',
  'depreciacion',
  'financiero',
] as const satisfies readonly AccountKey[];

export type CuentaResultados = (typeof CUENTAS_RESULTADOS)[number];

/** The four costs that tell a month has its expenses captured. */
const GASTOS = ['costo_servicio', 'ventas_marketing', 'desarrollo', 'administracion'] as const;

/** One P&L line of the ledger, on its account's own side, centavos. */
export interface ImporteResultados {
  readonly entryId: string;
  readonly concepto: string;
  readonly cuenta: CuentaResultados;
  /** Positive when it grows the account: income in, a cost or a financial loss. */
  readonly importe: Money;
  readonly fecha: string;
  readonly fechaFlujo: string | null;
}

export type RenglonId =
  | CuentaResultados
  | 'utilidad_bruta'
  | 'ebitda'
  | 'utilidad_operacion'
  | 'utilidad_antes_impuestos'
  | 'isr_estimado'
  | 'utilidad_neta';

export interface EstadoResultados {
  readonly periodo: Periodo;
  readonly base: Base;
  /** Each line's effect on the result: income positive, costs negative. */
  readonly renglones: Readonly<Record<RenglonId, Money>>;
  /** Basis points of income; null without income or without costs captured. */
  readonly margenBruto: number | null;
  readonly margenEbitda: number | null;
  /** No cost captured in the period: its margins would read 100 %. */
  readonly faltanGastos: boolean;
  readonly movimientos: ReadonlyMap<CuentaResultados, readonly ImporteResultados[]>;
}

/** ISR rate of a persona moral in RESICO (LISR art. 9 via art. 196), basis points. */
export const TASA_ISR_PM_BPS = 3_000;

/** Whether an account is one of the income statement's. */
export const esCuentaResultados = (c: string): c is CuentaResultados =>
  (CUENTAS_RESULTADOS as readonly string[]).includes(c);

/** A journal line read on its P&L account's own side. */
export function importeDeLinea(cuenta: AccountKey, debe: Money, haber: Money): Money {
  if (!esCuentaResultados(cuenta)) throw new CuentaFueraDeResultadosError(cuenta);
  return cuenta === 'ingresos' ? haber - debe : debe - haber;
}

const fechaDe = (i: ImporteResultados, base: Base) =>
  base === 'devengado' ? i.fecha : i.fechaFlujo;

function totales(importes: readonly ImporteResultados[], periodo: Periodo, base: Base) {
  const suma = Object.fromEntries(CUENTAS_RESULTADOS.map((c) => [c, 0n])) as Record<
    CuentaResultados,
    Money
  >;
  const dentro = importes.filter((i) => {
    const f = fechaDe(i, base);
    return f !== null && enPeriodo(f, periodo);
  });
  for (const i of dentro) suma[i.cuenta] += i.importe;
  return { suma, dentro };
}

function cascada(s: Record<CuentaResultados, Money>) {
  const utilidad_bruta = s.ingresos - s.costo_servicio;
  const ebitda = utilidad_bruta - s.ventas_marketing - s.desarrollo - s.administracion;
  const utilidad_operacion = ebitda - s.depreciacion;
  return { utilidad_bruta, ebitda, utilidad_operacion, uai: utilidad_operacion - s.financiero };
}

const margen = (parte: Money, ingresos: Money, faltanGastos: boolean) =>
  ingresos <= 0n || faltanGastos ? null : Number((parte * 10_000n) / ingresos);

function agrupar(dentro: readonly ImporteResultados[]) {
  const out = new Map<CuentaResultados, ImporteResultados[]>();
  for (const i of dentro) out.set(i.cuenta, [...(out.get(i.cuenta) ?? []), i]);
  return out;
}

export function estadoDeResultados(
  importes: readonly ImporteResultados[],
  periodo: Periodo,
  base: Base,
): EstadoResultados {
  const { suma: s, dentro } = totales(importes, periodo, base);
  const c = cascada(s);
  const flujo = base === 'flujo' ? c : cascada(totales(importes, periodo, 'flujo').suma);
  const isr = calcularIsrPorRegimen({
    regimenSat: null,
    ingresos: s.ingresos,
    utilidad: flujo.uai,
    isrTasa: TASA_ISR_PM_BPS,
  }).isr;
  const faltanGastos = !dentro.some((i) => (GASTOS as readonly string[]).includes(i.cuenta));
  return {
    periodo,
    base,
    renglones: {
      ingresos: s.ingresos,
      costo_servicio: -s.costo_servicio,
      utilidad_bruta: c.utilidad_bruta,
      ventas_marketing: -s.ventas_marketing,
      desarrollo: -s.desarrollo,
      administracion: -s.administracion,
      ebitda: c.ebitda,
      depreciacion: -s.depreciacion,
      utilidad_operacion: c.utilidad_operacion,
      financiero: -s.financiero,
      utilidad_antes_impuestos: c.uai,
      isr_estimado: -isr,
      utilidad_neta: c.uai - isr,
    },
    margenBruto: margen(c.utilidad_bruta, s.ingresos, faltanGastos),
    margenEbitda: margen(c.ebitda, s.ingresos, faltanGastos),
    faltanGastos,
    movimientos: agrupar(dentro),
  };
}
