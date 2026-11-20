import type { Money } from '../../money/index.js';
import { CargoMxnFaltanteError, MontoInvalidoError } from './errors.js';

/**
 * A USD expense paid from a peso account (E-42, owner decision 2026-11-20):
 * the books carry what the bank charged in pesos, its fee included; the
 * dollars and the rate that resulted travel with the entry. No published
 * rate is involved. Integer arithmetic only (CLAUDE.md §2.8).
 */
const DIEZ_MIL = 10_000n;

/** Half up, in non-negative integers. */
const dividir = (a: bigint, b: bigint): bigint => (a * 2n + b) / (b * 2n);

/** «18.6050»: the pesos charged per dollar invoiced, to four decimals. */
export function tipoCambioDelCargo(usd: Money, cargoMxn: Money): string {
  if (cargoMxn <= 0n) throw new CargoMxnFaltanteError();
  if (usd <= 0n) throw new MontoInvalidoError('el monto en dólares debe ser mayor a cero');
  const r = dividir(cargoMxn * DIEZ_MIL, usd);
  return `${r / DIEZ_MIL}.${String(r % DIEZ_MIL).padStart(4, '0')}`;
}

/** Outside 15–25 pesos per dollar the charge was likely mistyped; it is still allowed. */
export function tipoCambioRaro(tipoCambio: string): boolean {
  const n = Number(tipoCambio);
  return !(n >= 15 && n <= 25);
}

export interface MontosDeFactura {
  readonly subtotal: Money;
  readonly iva: Money;
  readonly retencionIsr: Money;
  readonly retencionIva: Money;
}

/**
 * A USD invoice's amounts, booked at its own rate, brought to what the bank
 * charged: IVA and retentions in the same proportion, and the subtotal takes
 * the rounding, so the total paid is exactly the charge.
 */
export function aCargo(m: MontosDeFactura, cargoMxn: Money): MontosDeFactura {
  if (cargoMxn <= 0n) throw new CargoMxnFaltanteError();
  const total = m.subtotal + m.iva - m.retencionIsr - m.retencionIva;
  if (total <= 0n) throw new MontoInvalidoError('la factura no tiene monto que pagar');
  const escala = (x: Money) => (x === 0n ? 0n : dividir(x * cargoMxn, total));
  const iva = escala(m.iva);
  const retencionIsr = escala(m.retencionIsr);
  const retencionIva = escala(m.retencionIva);
  return {
    subtotal: cargoMxn - iva + retencionIsr + retencionIva,
    iva,
    retencionIsr,
    retencionIva,
  };
}

/** A USD amount of a receipt in pesos, in proportion to the charge. */
export const enProporcion = (parte: Money, total: Money, cargoMxn: Money): Money =>
  parte === 0n ? 0n : dividir(parte * cargoMxn, total);
