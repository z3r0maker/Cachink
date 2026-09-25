/**
 * Reading a business's configuration as the wizard sees it, and clamping a
 * proposed one to what may actually be turned on.
 */

import {
  FEATURE_FLAG_KEYS,
  PaymentMethodEnum,
  canonicalPaymentTypes,
  parseFeatureFlags,
  type Business,
  type FeatureFlagKey,
  type PaymentMethod,
  type TenantConfiguration,
} from '@xangarro/domain';

function parsePaymentTypes(raw: string): PaymentMethod[] {
  try {
    const list = JSON.parse(raw) as unknown;
    if (!Array.isArray(list)) return [];
    return canonicalPaymentTypes(list.filter((m) => PaymentMethodEnum.safeParse(m).success));
  } catch {
    return [];
  }
}

/**
 * Crédito is not stored in `enabledPaymentMethods` (that list is what phones
 * offer at the mostrador; Crédito is the `ventasCredito` Función). The wizard
 * still reasons about it as a payment type, so it is read back from the flag:
 * that keeps a re-run a no-op (N-15) without ever writing it to the list.
 */
export function currentConfiguration(business: Business): TenantConfiguration {
  const toggles = parseFeatureFlags(business.featureFlags);
  const stored = parsePaymentTypes(business.enabledPaymentMethods).filter((m) => m !== 'Crédito');
  return {
    toggles,
    paymentTypes: toggles.ventasCredito ? canonicalPaymentTypes([...stored, 'Crédito']) : stored,
  };
}

/** What may be written to `enabledPaymentMethods`: everything but Crédito (see above). */
export const storablePaymentTypes = (methods: readonly PaymentMethod[]): PaymentMethod[] =>
  methods.filter((m) => m !== 'Crédito');

/**
 * `answersToConfiguration` knows the plan; it does not know the platform.
 * A feature the platform has not released (`PLATFORM_AVAILABLE`) is never
 * turned on here, whatever the plan — and Crédito is not offered as a payment
 * method while credit sales are off. Turning things off is never clamped.
 */
export function clampToAllowed(
  current: TenantConfiguration,
  next: TenantConfiguration,
  allowed: ReadonlySet<FeatureFlagKey>,
): TenantConfiguration {
  const toggles = { ...next.toggles };
  for (const key of FEATURE_FLAG_KEYS) {
    if (toggles[key] && !current.toggles[key] && !allowed.has(key)) toggles[key] = false;
  }
  const creditNew = !current.paymentTypes.includes('Crédito');
  const paymentTypes =
    !toggles.ventasCredito && creditNew
      ? next.paymentTypes.filter((m) => m !== 'Crédito')
      : next.paymentTypes;
  return { toggles, paymentTypes };
}
