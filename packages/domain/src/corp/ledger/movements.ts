import type { Money } from '../../money/index.js';
import type { AccountKey, CategoriaGasto } from './accounts.js';

/**
 * What a founder captures (E-02, ADR-124 §4): single-entry movements. The
 * ledger turns each into balanced journal lines (`posting.ts`); nobody types a
 * debit or a credit except in an `ajuste`.
 *
 * Every amount is MXN centavos (CLAUDE.md §2.8). A USD charge is converted at
 * capture (`convertirAMxn`); its original amount and rate travel on the entry.
 */
export type Socio = 1 | 2;

export interface JournalLine {
  readonly cuenta: AccountKey;
  /** Cargo, centavos. */
  readonly debe: Money;
  /** Abono, centavos. */
  readonly haber: Money;
  /** The partner a partner-account line belongs to. */
  readonly socio?: Socio;
}

/** A subscription payment (from billing, E-10, or by hand). */
export interface Cobro {
  readonly kind: 'cobro';
  readonly subtotal: Money;
  readonly iva: Money;
  readonly destino: 'stripe_por_depositar' | 'bancos';
}

/** Stripe pays out: the bank receives the gross minus its fee. */
export interface Payout {
  readonly kind: 'payout';
  readonly bruto: Money;
  readonly comision: Money;
}

/** An expense or received invoice. */
export interface Gasto {
  readonly kind: 'gasto';
  readonly categoria: CategoriaGasto;
  readonly subtotal: Money;
  readonly iva: Money;
  readonly tratamientoIva: 'acreditable' | 'no_acreditable' | 'exento';
  readonly retencionIsr: Money;
  readonly retencionIva: Money;
  /** False: the invoice is owed to the supplier (proveedores) until paid. */
  readonly pagado: boolean;
}

export interface PagoImpuestos {
  readonly kind: 'pago_impuestos';
  readonly isr: Money;
  readonly iva: Money;
  readonly retenciones: Money;
}

/**
 * Partner money (E-03, agreement Quinta). `fondeo_mitades` is a partner's half
 * of a funding call: it adds nothing to the pool, because both put the same.
 * `aportacion_adicional` is money above that half: it counts 1:1 for the pool
 * up to the quarter's cap.
 */
export interface MovimientoSocio {
  readonly kind:
    | 'aportacion_capital'
    | 'fondeo_mitades'
    | 'aportacion_adicional'
    | 'prestamo_socio'
    | 'reembolso_socio';
  readonly socio: Socio;
  readonly monto: Money;
}

/**
 * The quarter's close moves the additional money over the cap from AFAC to a
 * loan to the partner: no bank movement, the money is already in.
 */
export interface ExcedenteAPrestamo {
  readonly kind: 'excedente_a_prestamo';
  readonly socio: Socio;
  readonly monto: Money;
}

export interface ComisionBancaria {
  readonly kind: 'comision_bancaria';
  readonly monto: Money;
}

/** Founder-only free lines; must balance and say why. */
export interface Ajuste {
  readonly kind: 'ajuste';
  readonly motivo: string;
  readonly lines: readonly JournalLine[];
}

export type Movement =
  | Cobro
  | Payout
  | Gasto
  | PagoImpuestos
  | MovimientoSocio
  | ExcedenteAPrestamo
  | ComisionBancaria
  | Ajuste;

export type MovementKind = Movement['kind'];

/** Every kind, so a stored one is parsed rather than asserted. */
export const MOVEMENT_KINDS = [
  'cobro',
  'payout',
  'gasto',
  'pago_impuestos',
  'aportacion_capital',
  'fondeo_mitades',
  'aportacion_adicional',
  'prestamo_socio',
  'reembolso_socio',
  'excedente_a_prestamo',
  'comision_bancaria',
  'ajuste',
] as const satisfies readonly MovementKind[];

// A kind added to the union but not to the list fails to compile here.
type Missing = Exclude<MovementKind, (typeof MOVEMENT_KINDS)[number]>;
const complete: Missing extends never ? true : never = true;
void complete;

export function isMovementKind(value: string): value is MovementKind {
  return (MOVEMENT_KINDS as readonly string[]).includes(value);
}
