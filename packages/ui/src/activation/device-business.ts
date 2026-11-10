/**
 * The business this phone was activated for (audit F-15c), read from the
 * activation record in app_config. It is what the phone's plan and its
 * pulls are bound to: an entitlement signed for another business verifies
 * nothing here, and a pulled page that carries one is refused.
 */

import type { AppConfigRepository } from '@xangarro/data';
import { APP_CONFIG_KEYS } from '../app-config/index';
import { parseActivationRecord } from './activation-config';

/** `null` on a phone that is not activated, or whose record cannot be read. */
export async function deviceBusinessId(
  appConfig: Pick<AppConfigRepository, 'get'>,
): Promise<string | null> {
  const record = parseActivationRecord(await appConfig.get(APP_CONFIG_KEYS.activation));
  return record?.businessId ?? null;
}
