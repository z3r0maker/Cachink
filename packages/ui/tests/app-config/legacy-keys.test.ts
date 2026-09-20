/**
 * Sale-sound setting survives the Cachink → Xangarro key rename (ADR-056).
 *
 * A-15 renamed the stored key `cachinkSoundEnabled` → `saleSoundEnabled`.
 * Without a fallback, a user who muted the sound gets it back on upgrade.
 */

import { describe, expect, it, vi } from 'vitest';
import { InMemoryAppConfigRepository } from '@xangarro/testing';
import { APP_CONFIG_KEYS } from '../../src/app-config/types';
import { LEGACY_SALE_SOUND_KEY, readSaleSoundSetting } from '../../src/app-config/legacy-keys';

describe('readSaleSoundSetting', () => {
  it('adopts a muted pre-rebrand setting and moves it to the new key', async () => {
    const repo = new InMemoryAppConfigRepository();
    await repo.set(LEGACY_SALE_SOUND_KEY, 'false');

    expect(await readSaleSoundSetting(repo)).toBe('false');
    expect(await repo.get(APP_CONFIG_KEYS.saleSoundEnabled)).toBe('false');
    expect(await repo.get(LEGACY_SALE_SOUND_KEY)).toBeNull();
  });

  it('returns null on a fresh install so the default applies', async () => {
    const repo = new InMemoryAppConfigRepository();
    expect(await readSaleSoundSetting(repo)).toBeNull();
    expect(await repo.get(APP_CONFIG_KEYS.saleSoundEnabled)).toBeNull();
  });

  it('prefers the new key when both exist and leaves the legacy value untouched', async () => {
    const repo = new InMemoryAppConfigRepository();
    await repo.set(APP_CONFIG_KEYS.saleSoundEnabled, 'true');
    await repo.set(LEGACY_SALE_SOUND_KEY, 'false');

    expect(await readSaleSoundSetting(repo)).toBe('true');
    expect(await repo.get(LEGACY_SALE_SOUND_KEY)).toBe('false');
  });

  it('keeps the legacy value when writing the new key fails, so the next launch retries', async () => {
    const repo = new InMemoryAppConfigRepository();
    await repo.set(LEGACY_SALE_SOUND_KEY, 'false');
    vi.spyOn(repo, 'set').mockRejectedValueOnce(new Error('disk full'));

    await expect(readSaleSoundSetting(repo)).rejects.toThrow('disk full');
    expect(await repo.get(LEGACY_SALE_SOUND_KEY)).toBe('false');
  });
});
