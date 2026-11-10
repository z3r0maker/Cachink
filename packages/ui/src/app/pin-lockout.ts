/**
 * The phone's NIP guard (A-05, audit F-08). The lockout itself, its ladder
 * and its stored map live in `@xangarro/caja/nip`, shared with the web
 * caja; this binds it to this device: the map in app_config, so a restart
 * does not reset it, and the anchored clock, so setting the phone's date
 * back does not shorten a lock.
 *
 * Every NIP check on the phone goes through
 * `attemptNip(deviceNipGuard(…), subject, …)`, where the subject is the
 * user whose NIP is checked: the sign-in and the lock screen
 * (`use-quick-switch-auth`), a cancellation (`cancelar-con-nip`) and the
 * dev reset. One count per person, whichever path it is tried on.
 */

import { fraseEsperaNip, nipGuardOver, type NipGuardDeps } from '@xangarro/caja/nip';
import type { AppConfigRepository } from '@xangarro/data';
import { anchoredClock } from '@xangarro/sync';

export function deviceNipGuard(
  appConfig: AppConfigRepository,
  deviceNow?: () => Date,
): NipGuardDeps {
  return nipGuardOver(appConfig, anchoredClock(appConfig, deviceNow));
}

/**
 * What to show for a NIP that did not go through: how long to wait while a
 * lockout runs, the screen's own «wrong NIP» words otherwise.
 */
export function nipRefusal(attempt: { readonly lockedMs: number }, wrongPin: string): string {
  return attempt.lockedMs > 0 ? fraseEsperaNip(attempt.lockedMs) : wrongPin;
}
