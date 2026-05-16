/**
 * useEnabledPaymentMethods — reads the business's enabled payment
 * methods and returns a filtered readonly array.
 *
 * Falls back to the default set (all 4) when no business is loaded.
 */
import type { PaymentMethod } from '@cachink/domain';
import { useCurrentBusiness } from './use-current-business';

const DEFAULT_METHODS: readonly PaymentMethod[] = [
  'Efectivo',
  'Transferencia',
  'Tarjeta',
  'QR/CoDi',
] as const;

export function useEnabledPaymentMethods(): readonly PaymentMethod[] {
  const business = useCurrentBusiness().data;
  if (!business?.enabledPaymentMethods) return DEFAULT_METHODS;
  try {
    return JSON.parse(business.enabledPaymentMethods) as PaymentMethod[];
  } catch {
    return DEFAULT_METHODS;
  }
}
