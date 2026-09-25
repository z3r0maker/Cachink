import type { PaymentMethod } from '../entities/sale.js';

/**
 * Tipos de pago (P-08): which methods a business takes. Stored as the JSON
 * array phones already read (`Business.enabledPaymentMethods`). Crédito is not
 * here: it is a Función (`ventasCredito`), because it needs clientes and
 * cobranza, not just a button.
 */
export const METODOS_CONFIGURABLES = ['Efectivo', 'Transferencia', 'Tarjeta', 'QR/CoDi'] as const;
export type MetodoConfigurable = (typeof METODOS_CONFIGURABLES)[number];

const isConfigurable = (m: string): m is MetodoConfigurable =>
  (METODOS_CONFIGURABLES as readonly string[]).includes(m);

export type MetodosPagoResult =
  | { readonly ok: true; readonly value: string }
  | { readonly ok: false; readonly error: string };

/** At least one, all known, in catalogue order — as the JSON to store. */
export function validateMetodosPago(chosen: readonly string[]): MetodosPagoResult {
  if (!chosen.every(isConfigurable)) {
    return { ok: false, error: 'Ese tipo de pago no se configura aquí.' };
  }
  const value = METODOS_CONFIGURABLES.filter((m) => chosen.includes(m));
  if (value.length === 0) return { ok: false, error: 'Deja al menos un tipo de pago.' };
  return { ok: true, value: JSON.stringify(value) };
}

/**
 * The stored JSON as methods; all four when it is missing, unreadable or names
 * nothing configurable. An entry that is not configurable (a row the wizard
 * wrote with «Crédito» before P-36) is ignored, not a reason to fall back.
 */
export function parseMetodosPago(json: string | null | undefined): PaymentMethod[] {
  try {
    const parsed: unknown = JSON.parse(json ?? '');
    if (Array.isArray(parsed)) {
      const known = parsed.filter(
        (m): m is MetodoConfigurable => typeof m === 'string' && isConfigurable(m),
      );
      if (known.length > 0) return METODOS_CONFIGURABLES.filter((m) => known.includes(m));
    }
  } catch {
    // Unreadable is the same as unset: take every method.
  }
  return [...METODOS_CONFIGURABLES];
}
