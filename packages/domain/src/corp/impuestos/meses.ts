import type { Money } from '../../money/index.js';
import type { ImporteResultados } from '../resultados/cascada.js';
import { ImpuestosInvalidosError } from './errors.js';
import type { MesFiscal } from './estimado.js';

/**
 * The ledger read into months of cash-basis tax figures (E-13). Income and
 * deductions are Resultados' own P&L lines on the day their money moved; the
 * IVA and the withholdings are the lines of their accounts, a reversal
 * netting in its own month. The withheld ISR comes from each movement as
 * captured, and the withheld IVA is the rest of the payable. Pure.
 */
export interface LineaFiscal {
  readonly fecha: string;
  readonly cuenta: 'iva_trasladado' | 'iva_acreditable' | 'retenciones_por_pagar';
  readonly debe: Money;
  readonly haber: Money;
}

/** ISR withheld by a movement on its day; negative for a reversal. */
export interface RetencionIsr {
  readonly fecha: string;
  readonly monto: Money;
}

export interface FuentesFiscales {
  /** `YYYY-MM`, inclusive. */
  readonly desde: string;
  readonly hasta: string;
  readonly importes: readonly ImporteResultados[];
  readonly lineas: readonly LineaFiscal[];
  readonly retencionesIsr: readonly RetencionIsr[];
}

const MES = /^(\d{4})-(0[1-9]|1[0-2])$/;

function rango(desde: string, hasta: string): string[] {
  const a = MES.exec(desde);
  const b = MES.exec(hasta);
  if (a === null || b === null)
    throw new ImpuestosInvalidosError(`«${desde}–${hasta}» no son meses`);
  const de = Number(a[1]) * 12 + Number(a[2]) - 1;
  const a2 = Number(b[1]) * 12 + Number(b[2]) - 1;
  if (a2 < de) throw new ImpuestosInvalidosError(`${hasta} es antes que ${desde}`);
  return Array.from({ length: a2 - de + 1 }, (_, i) => {
    const n = de + i;
    return `${Math.floor(n / 12)}-${String((n % 12) + 1).padStart(2, '0')}`;
  });
}

type Suma = { -readonly [K in Exclude<keyof MesFiscal, 'mes'>]: Money } & { retenciones: Money };

const vacia = (): Suma => ({
  ingresos: 0n,
  deducciones: 0n,
  ivaTrasladado: 0n,
  ivaAcreditable: 0n,
  retencionIsr: 0n,
  retencionIva: 0n,
  retenciones: 0n,
});

function sumarImporte(s: Suma, i: ImporteResultados): void {
  if (i.cuenta === 'ingresos') s.ingresos += i.importe;
  else if (i.deducible !== false) s.deducciones += i.importe;
}

function sumarLinea(s: Suma, l: LineaFiscal): void {
  if (l.cuenta === 'iva_trasladado') s.ivaTrasladado += l.haber - l.debe;
  else if (l.cuenta === 'iva_acreditable') s.ivaAcreditable += l.debe - l.haber;
  else s.retenciones += l.haber - l.debe;
}

export function mesesFiscales(f: FuentesFiscales): readonly MesFiscal[] {
  const sumas = new Map(rango(f.desde, f.hasta).map((m) => [m, vacia()]));
  const de = (fecha: string | null) => (fecha === null ? undefined : sumas.get(fecha.slice(0, 7)));
  for (const i of f.importes) {
    const s = de(i.fechaFlujo);
    if (s !== undefined) sumarImporte(s, i);
  }
  for (const l of f.lineas) {
    const s = de(l.fecha);
    if (s !== undefined) sumarLinea(s, l);
  }
  for (const r of f.retencionesIsr) {
    const s = de(r.fecha);
    if (s !== undefined) s.retencionIsr += r.monto;
  }
  return [...sumas].map(([mes, { retenciones, ...s }]) => ({
    mes,
    ...s,
    retencionIva: retenciones - s.retencionIsr,
  }));
}
