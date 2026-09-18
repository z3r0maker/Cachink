/**
 * Billing refusals. Each carries a `code` the portal maps to a toast, and a
 * message written for the owner (CLAUDE.md §8).
 */

export const BILLING_ERROR_CODES = [
  'NOT_A_PAID_PLAN',
  'INVALID_INTERVAL',
  'ALREADY_SUBSCRIBED',
  'NO_BILLING_CUSTOMER',
  'MISSING_EMAIL',
] as const;
export type BillingErrorCode = (typeof BILLING_ERROR_CODES)[number];

const MESSAGES: Record<BillingErrorCode, string> = {
  NOT_A_PAID_PLAN: 'Ese plan no se contrata: Xangarrito es gratis.',
  INVALID_INTERVAL: 'Elige pago mensual o anual.',
  ALREADY_SUBSCRIBED:
    'Tu negocio ya tiene una suscripción. Cámbiala desde «Administrar suscripción».',
  NO_BILLING_CUSTOMER: 'Todavía no tienes una suscripción que administrar.',
  MISSING_EMAIL: 'Necesitamos el correo del dueño para enviarte los recibos.',
};

export class BillingError extends Error {
  readonly code: BillingErrorCode;
  constructor(code: BillingErrorCode) {
    super(MESSAGES[code]);
    this.name = 'BillingError';
    this.code = code;
  }
}
