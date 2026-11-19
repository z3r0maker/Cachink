import type { Money } from '../../money/index.js';
import type { CategoriaGasto } from '../ledger/accounts.js';

/**
 * MEXIA's third-party services (E-24, boards CD-18, CD-18c and CD-18d): what
 * each one is for, how it charges, what pays it and what it has cost. A
 * service that charges every month or every year owns its recurring template
 * (E-02), and its cost is what those charges posted.
 */
export const COBROS_SERVICIO = ['fijo', 'uso', 'comision', 'gratis', 'anual'] as const;

/**
 * - `fijo`: the same amount each month, in pesos or dollars.
 * - `uso`: changes each month; a founder types the month so far.
 * - `comision`: a share of each payment, which Stripe's payouts post.
 * - `gratis`: no charge, up to a plan's limit.
 * - `anual`: one charge a year.
 */
export type CobroServicio = (typeof COBROS_SERVICIO)[number];

/** `por_contratar`: planned and not yet paid; `baja`: no longer used, its history stays. */
export type EstadoServicio = 'activo' | 'por_contratar' | 'baja';

export interface Servicio {
  readonly id: string;
  readonly nombre: string;
  /** «Para qué lo usamos», e.g. «Claude para los agentes». */
  readonly para: string | null;
  readonly categoria: CategoriaGasto;
  readonly cobro: CobroServicio;
  readonly estado: EstadoServicio;
  /** The currency of `monto`. */
  readonly moneda: 'MXN' | 'USD';
  /** `fijo`: each month's charge; `anual`: the year's. IVA included, `moneda` centavos. */
  readonly monto: Money | null;
  /** `fijo` and `uso`: 1–31; a shorter month charges on its last day. */
  readonly diaCargo: number | null;
  /** `anual`: the next renewal, `YYYY-MM-DD`. */
  readonly renueva: string | null;
  /** `comision`: as the provider words it, e.g. «3.6 % + $3 por pago». */
  readonly tarifa: string | null;
  /** `uso`: the month's cost that raises a signal, MXN centavos. */
  readonly aviso: Money | null;
  /** `gratis`: the plan's limit and today's use, in `unidad` («MB», «correos»). */
  readonly limite: number | null;
  readonly usoPlan: number | null;
  readonly unidad: string | null;
  /** `uso`: what the month has cost up to `gastoAl`, MXN centavos, as a founder read it. */
  readonly gastoMes: Money | null;
  readonly gastoAl: string | null;
  /** «Tarjeta •••• 4821», «Transferencia». Never a full card number. */
  readonly pagaCon: string | null;
  /** Its recurring template, when it has one. */
  readonly plantillaId: string | null;
}
