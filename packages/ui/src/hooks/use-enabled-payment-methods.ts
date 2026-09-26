/**
 * useEnabledPaymentMethods — the methods this business takes at the
 * mostrador, read with the domain's own parser so a retired method
 * (QR/CoDi, ADR-108) never reaches a picker. Every configurable method
 * when no business is loaded.
 */
import { parseMetodosPago, type PaymentMethod } from '@xangarro/domain';
import { useCurrentBusiness } from './use-current-business';

export function useEnabledPaymentMethods(): readonly PaymentMethod[] {
  return parseMetodosPago(useCurrentBusiness().data?.enabledPaymentMethods);
}
