/**
 * Shared test helper: a phone activated for the business the test
 * entitlements are signed for. Since audit F-15c a stored plan verifies only
 * on a device of its own business, so a test that seeds a plan with
 * `seedTestEntitlement` (signed for «TEST») activates the device for it too.
 */

import type { AppConfigRepository } from '@xangarro/data';
import { APP_CONFIG_KEYS } from '../src/app-config/index';

/** The business `@xangarro/testing` signs its entitlements for. */
export const TEST_ENTITLEMENT_BUSINESS = 'TEST';

export async function activateTestDevice(appConfig: AppConfigRepository): Promise<void> {
  const record = {
    deviceId: 'TEST-DEVICE',
    businessId: TEST_ENTITLEMENT_BUSINESS,
    activatedAt: '2026-09-16T00:00:00.000Z',
  };
  await appConfig.set(APP_CONFIG_KEYS.activation, JSON.stringify(record));
}
