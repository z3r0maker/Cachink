/**
 * Which Términos y condiciones an owner accepted in Stripe Checkout
 * (LFPC art. 76 Bis II, ADR-132). Source text:
 * `docs/legal/aviso/terminos-borrador.md`. Any edit to the published text is a
 * new version: bump it, because `billing_consents` must say which one was
 * accepted.
 */
export const TERMINOS_VERSION = '0.1-borrador' as const;
