import type { Money } from '../../money/index.js';
import type { AccountKey } from './accounts.js';
import { AsientoDesbalanceadoError, MontoInvalidoError, MotivoRequeridoError } from './errors.js';
import type {
  Ajuste,
  Cobro,
  Gasto,
  JournalLine,
  Movement,
  MovimientoSocio,
  PagoImpuestos,
  Payout,
  Socio,
} from './movements.js';

/**
 * Movement → balanced journal lines (E-02, ADR-124 §4). The one place the
 * founders' capture becomes double entry; every branch ends in `balanced()`.
 */
const debe = (cuenta: AccountKey, monto: Money, socio?: Socio): JournalLine =>
  socio === undefined
    ? { cuenta, debe: monto, haber: 0n }
    : { cuenta, debe: monto, haber: 0n, socio };
const haber = (cuenta: AccountKey, monto: Money, socio?: Socio): JournalLine =>
  socio === undefined
    ? { cuenta, debe: 0n, haber: monto }
    : { cuenta, debe: 0n, haber: monto, socio };

function positive(value: Money, what: string): Money {
  if (value <= 0n) throw new MontoInvalidoError(`${what} debe ser mayor a cero`);
  return value;
}

function nonNegative(value: Money, what: string): Money {
  if (value < 0n) throw new MontoInvalidoError(`${what} no puede ser negativo`);
  return value;
}

/** Lines with a zero amount on both sides say nothing; they are dropped. */
const meaningful = (lines: readonly JournalLine[]) =>
  lines.filter((l) => l.debe !== 0n || l.haber !== 0n);

export const sumDebe = (lines: readonly JournalLine[]): Money =>
  lines.reduce((acc, l) => acc + l.debe, 0n);
export const sumHaber = (lines: readonly JournalLine[]): Money =>
  lines.reduce((acc, l) => acc + l.haber, 0n);

function balanced(lines: readonly JournalLine[]): readonly JournalLine[] {
  const kept = meaningful(lines);
  const d = sumDebe(kept);
  const h = sumHaber(kept);
  if (d !== h || d === 0n) throw new AsientoDesbalanceadoError(d, h);
  return kept;
}

function cobro(m: Cobro): readonly JournalLine[] {
  const subtotal = positive(m.subtotal, 'el subtotal');
  const iva = nonNegative(m.iva, 'el IVA');
  return [
    debe(m.destino, subtotal + iva),
    haber('ingresos', subtotal),
    haber('iva_trasladado', iva),
  ];
}

function payout(m: Payout): readonly JournalLine[] {
  const bruto = positive(m.bruto, 'el depósito');
  const comision = nonNegative(m.comision, 'la comisión');
  if (comision >= bruto) throw new MontoInvalidoError('la comisión no puede igualar el depósito');
  return [
    debe('bancos', bruto - comision),
    debe('costo_servicio', comision),
    haber('stripe_por_depositar', bruto),
  ];
}

function gasto(m: Gasto): readonly JournalLine[] {
  const subtotal = positive(m.subtotal, 'el subtotal');
  const iva = nonNegative(m.iva, 'el IVA');
  const retenido =
    nonNegative(m.retencionIsr, 'la retención de ISR') +
    nonNegative(m.retencionIva, 'la retención de IVA');
  const total = subtotal + iva;
  if (retenido >= total)
    throw new MontoInvalidoError('las retenciones no pueden igualar la factura');
  const acreditable = m.tratamientoIva === 'acreditable';
  return [
    debe(m.categoria, acreditable ? subtotal : total),
    debe('iva_acreditable', acreditable ? iva : 0n),
    haber('retenciones_por_pagar', retenido),
    haber(m.pagado ? 'bancos' : 'proveedores', total - retenido),
  ];
}

function pagoImpuestos(m: PagoImpuestos): readonly JournalLine[] {
  const isr = nonNegative(m.isr, 'el ISR');
  const iva = nonNegative(m.iva, 'el IVA');
  const ret = nonNegative(m.retenciones, 'las retenciones');
  positive(isr + iva + ret, 'el pago');
  return [
    debe('isr_por_pagar', isr),
    debe('iva_por_pagar', iva),
    debe('retenciones_por_pagar', ret),
    haber('bancos', isr + iva + ret),
  ];
}

const CONTRA: Record<MovimientoSocio['kind'], AccountKey> = {
  aportacion_capital: 'capital_social',
  fondeo_mitades: 'afac',
  aportacion_adicional: 'afac',
  prestamo_socio: 'prestamos_socios',
  reembolso_socio: 'prestamos_socios',
};

function socio(m: MovimientoSocio): readonly JournalLine[] {
  const monto = positive(m.monto, 'el monto');
  const cuenta = CONTRA[m.kind];
  return m.kind === 'reembolso_socio'
    ? [debe(cuenta, monto, m.socio), haber('bancos', monto)]
    : [debe('bancos', monto), haber(cuenta, monto, m.socio)];
}

function ajuste(m: Ajuste): readonly JournalLine[] {
  if (m.motivo.trim() === '') throw new MotivoRequeridoError();
  for (const l of m.lines) {
    nonNegative(l.debe, 'un cargo');
    nonNegative(l.haber, 'un abono');
  }
  return m.lines;
}

export function postMovement(m: Movement): readonly JournalLine[] {
  switch (m.kind) {
    case 'cobro':
      return balanced(cobro(m));
    case 'payout':
      return balanced(payout(m));
    case 'gasto':
      return balanced(gasto(m));
    case 'pago_impuestos':
      return balanced(pagoImpuestos(m));
    case 'comision_bancaria':
      return balanced([
        debe('financiero', positive(m.monto, 'la comisión')),
        haber('bancos', m.monto),
      ]);
    case 'excedente_a_prestamo': {
      const monto = positive(m.monto, 'el excedente');
      return balanced([debe('afac', monto, m.socio), haber('prestamos_socios', monto, m.socio)]);
    }
    case 'ajuste':
      return balanced(ajuste(m));
    default:
      return balanced(socio(m));
  }
}
