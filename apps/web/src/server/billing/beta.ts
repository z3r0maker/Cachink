import 'server-only';

/**
 * P-36 D-1 (owner, 2026-09-25): no charge during the beta. While this is on,
 * no Stripe Checkout opens — the paid CTAs keep the choice and show the
 * «pronto» notice — and a business stays on the plan it has. Unset (or any
 * value but `1`) is the launch behaviour.
 */
export const betaNoCharge = (): boolean => process.env.BILLING_BETA_NO_CHARGE === '1';

export const BETA_NO_CHARGE_MESSAGE =
  'Durante la beta no cobramos: guardamos tu elección y te avisamos cuando abramos los planes de pago.';
