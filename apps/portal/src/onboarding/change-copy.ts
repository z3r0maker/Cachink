/**
 * The "esto cambiará" lines of N-15, one per `ConfigurationChange`.
 *
 * Turning a feature off reassures where data is involved: switching
 * Inventario off hides stock, it does not delete a single product.
 */

import type { ConfigurationChange, FeatureFlagKey } from '@xangarro/domain';

import { FLAG_LABEL } from '../fixtures/negocio';

const KEEPS_DATA: Partial<Record<FeatureFlagKey, string>> = {
  stock: 'tus productos no se borran',
  ventasCredito: 'tus cuentas por cobrar no se borran',
  merma: 'las mermas registradas no se borran',
};

export function changeLine(change: ConfigurationChange): string {
  if (change.kind === 'paymentType') {
    return change.enabled
      ? `Se agregará ${change.method} como forma de cobro`
      : `Se quitará ${change.method} de tus formas de cobro`;
  }
  const label = FLAG_LABEL[change.key];
  if (change.enabled) return `Se activará ${label}`;
  const keeps = KEEPS_DATA[change.key];
  return keeps === undefined ? `Se desactivará ${label}` : `Se desactivará ${label} — ${keeps}`;
}
