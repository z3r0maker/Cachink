/**
 * useCachinkSound — pre-loads the cash register SFX and exposes a
 * `play()` function gated by the `cachinkSoundEnabled` AppConfig setting.
 *
 * The hook accepts an optional `player` parameter so the mobile shell
 * can inject the expo-audio player while packages/ui stays free of the
 * expo-audio dependency. When no player is provided, `play()` is a no-op.
 *
 * `seekTo(0)` before each play handles rapid re-triggers (user
 * registers multiple sales quickly).
 */

import { useCallback } from 'react';
import { useCachinkSoundEnabled } from '../app-config/index';

export interface CachinkSoundPlayer {
  play: () => void;
  seekTo: (seconds: number) => void;
}

export function useCachinkSound(player?: CachinkSoundPlayer | null): { play: () => void } {
  const enabled = useCachinkSoundEnabled();

  const play = useCallback(() => {
    if (!enabled || !player) return;
    try {
      player.seekTo(0);
      player.play();
    } catch {
      // expo-audio may fail on iOS 26 beta — sound is non-critical
    }
  }, [enabled, player]);

  return { play };
}
