/**
 * Tenant configuration the wizard touches, and the "esto cambiará" diff that
 * N-15 shows before re-applying the wizard (ADR-067).
 */

import {
  FEATURE_FLAG_KEYS,
  type FeatureFlagKey,
  type FeatureFlags,
} from '../entities/feature-flags.js';
import { PaymentMethodEnum, type PaymentMethod } from '../entities/sale.js';
import { canonicalPaymentTypes, type WizardConfiguration } from './answers-to-configuration.js';

export interface TenantConfiguration {
  /** The tenant layer of the flags (not the effective flags). */
  readonly toggles: FeatureFlags;
  /** Enabled payment methods; treated as a set. */
  readonly paymentTypes: readonly PaymentMethod[];
}

export type ConfigurationChange =
  | { readonly kind: 'feature'; readonly key: FeatureFlagKey; readonly enabled: boolean }
  | { readonly kind: 'paymentType'; readonly method: PaymentMethod; readonly enabled: boolean };

/** The configuration that results from applying the wizard to `current`. Pure. */
export function applyConfiguration(
  current: TenantConfiguration,
  result: Pick<WizardConfiguration, 'toggles' | 'paymentTypes'>,
): TenantConfiguration {
  const { set, add, remove } = result.paymentTypes;
  const methods = new Set<PaymentMethod>([...(set ?? current.paymentTypes), ...add]);
  for (const m of remove) methods.delete(m);
  return {
    toggles: { ...current.toggles, ...result.toggles },
    paymentTypes: canonicalPaymentTypes(methods),
  };
}

/** Every change from `current` to `next`: features first, then payment types. `[]` = no-op. */
export function diffConfiguration(
  current: TenantConfiguration,
  next: TenantConfiguration,
): ConfigurationChange[] {
  const features: ConfigurationChange[] = FEATURE_FLAG_KEYS.filter(
    (key) => current.toggles[key] !== next.toggles[key],
  ).map((key) => ({ kind: 'feature', key, enabled: next.toggles[key] }));
  const before = new Set(current.paymentTypes);
  const after = new Set(next.paymentTypes);
  const payments: ConfigurationChange[] = PaymentMethodEnum.options
    .filter((m) => before.has(m) !== after.has(m))
    .map((method) => ({ kind: 'paymentType', method, enabled: after.has(method) }));
  return [...features, ...payments];
}
