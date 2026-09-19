/**
 * Wrapper around expo-audio's useAudioPlayer that skips native
 * allocation in E2E mode. EXPO_PUBLIC_E2E is replaced at bundle
 * time by Metro, so the branch is dead-code eliminated.
 */

import { useAudioPlayer } from 'expo-audio';
import type { SaleSoundPlayer } from '@xangarro/ui';

// eslint-disable-next-line @typescript-eslint/no-require-imports
const SALE_CONFIRM_SFX = require('../../assets/sounds/sale-confirm.mp3');
const IS_E2E = process.env.EXPO_PUBLIC_E2E === '1';

/** Returns null in E2E mode, a real AudioPlayer otherwise. */
export function useSaleSoundPlayer(): SaleSoundPlayer | null {
  if (IS_E2E) return null;
  return useAudioPlayer(SALE_CONFIRM_SFX); // hook call gated by compile-time constant
}
