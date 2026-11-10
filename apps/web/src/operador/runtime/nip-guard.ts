/**
 * The register's NIP lockouts (audit F-08): the shared guard of
 * `@xangarro/caja/nip` over the Worker's app_config table and the anchored
 * clock, exactly as the phone binds it. The sign-in, the lock screen
 * (`access.autenticar`) and a cancellation (`cancelar.ts`) all go through
 * it with the user whose NIP they check, so a wrong NIP for that person on
 * any of them counts toward that person's lockout, and nobody else's.
 */

import { nipGuardOver, type NipGuardDeps } from '@xangarro/caja/nip';
import { DrizzleAppConfigRepository } from '@xangarro/data';
import { anchoredClock } from '@xangarro/sync';

import type { Db } from './db-types';

export function guardiaNip(db: Db): NipGuardDeps {
  const appConfig = new DrizzleAppConfigRepository(db as never);
  return nipGuardOver(appConfig, anchoredClock(appConfig));
}
