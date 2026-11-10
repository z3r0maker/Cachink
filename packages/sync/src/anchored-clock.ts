/**
 * The device's anchored clock (Q9) as a function: `max(device clock, last
 * server time)`, read from app_config on every call. The entitlement decides
 * by it, and so does the NIP lockout (audit F-08): setting the phone's date
 * back never moves it behind the last time the server was heard.
 *
 * Setting the date forward still moves it. That is a known limit: offline,
 * the device has no later time to hold it against.
 */

import type { AppConfigRepository } from '@xangarro/data';
import { anchoredNow } from './entitlement.js';
import { SYNC_CONFIG_KEYS } from './sync-keys.js';

export type AnchoredClock = () => Promise<Date>;

export function anchoredClock(
  appConfig: Pick<AppConfigRepository, 'get'>,
  deviceNow: () => Date = () => new Date(),
): AnchoredClock {
  return async () => anchoredNow(deviceNow(), await appConfig.get(SYNC_CONFIG_KEYS.lastServerTime));
}
