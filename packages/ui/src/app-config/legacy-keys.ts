/**
 * Pre-rebrand AppConfig keys (ADR-056).
 *
 * A-15 renamed the stored sale-sound key. Installs from before the rename
 * still hold the old key, so hydration adopts it once: copy to the new key,
 * then delete the old one. The copy happens first, so a failed write leaves
 * the legacy value in place for the next launch.
 */

import type { AppConfigRepository } from '@xangarro/data';
import { APP_CONFIG_KEYS } from './types';

/** Legacy key name — kept only to upgrade pre-rebrand installs. */
export const LEGACY_SALE_SOUND_KEY = 'cachinkSoundEnabled';

/** Raw stored sale-sound value, adopting the legacy key when the new one is unset. */
export async function readSaleSoundSetting(repo: AppConfigRepository): Promise<string | null> {
  const current = await repo.get(APP_CONFIG_KEYS.saleSoundEnabled);
  if (current !== null) return current;
  const legacy = await repo.get(LEGACY_SALE_SOUND_KEY);
  if (legacy === null) return null;
  await repo.set(APP_CONFIG_KEYS.saleSoundEnabled, legacy);
  await repo.delete(LEGACY_SALE_SOUND_KEY);
  return legacy;
}
