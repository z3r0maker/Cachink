import { parseLookupKey, totalCentavos } from '@xangarro/application/billing';
import { AVISO_PUBLICO_URL, formatMoney, PROVEEDOR, PROVEEDOR_LINEA } from '@xangarro/domain';
import type Stripe from 'stripe';

import { TERMINOS_URL } from '@/legal/aviso-simplificado';

/**
 * Our words inside Stripe Checkout (LFPC art. 76 Bis, ADR-132): a required
 * «Acepto…» box that states the amount with IVA, how often it is charged and
 * how to cancel, and the supplier under the pay button. No screen of ours.
 *
 * Stripe refuses `terms_of_service: 'required'` until the Términos URL is set
 * in the Dashboard (Settings › Public details): an operator step, listed in
 * `docs/launch/production-readiness.md`.
 */
const CADA = {
  month: 'hoy y el mismo día de cada mes',
  year: 'hoy y en la misma fecha cada año',
} as const;

export function consentText(lookupKey: string): string {
  const price = parseLookupKey(lookupKey);
  if (price === null) throw new Error(`Unknown price ${lookupKey}`);
  const total = formatMoney(BigInt(totalCentavos(price.planId, price.interval)));
  return (
    `Acepto que se cobren ${total} MXN (IVA incluido) a esta tarjeta ${CADA[price.interval]}, ` +
    'hasta que cancele. Cancelo en un clic en Mi negocio › Plan y pagos o desde el correo que ' +
    'me llega al menos 5 días hábiles antes de cada cobro. Acepto los ' +
    `[Términos](${TERMINOS_URL}) y el [Aviso de privacidad](${AVISO_PUBLICO_URL}).`
  );
}

export function checkoutConsent(
  lookupKey: string,
): Pick<Stripe.Checkout.SessionCreateParams, 'consent_collection' | 'custom_text'> {
  return {
    consent_collection: { terms_of_service: 'required' },
    custom_text: {
      terms_of_service_acceptance: { message: consentText(lookupKey) },
      submit: { message: `${PROVEEDOR_LINEA} · Dudas y quejas: ${PROVEEDOR.correo}` },
    },
  };
}
