/**
 * `<CloudInnerScreenHost />` + `useCloudNavigation()` — shared overlay
 * for the Cloud onboarding sub-screens (Round 3 F9 dedup of the
 * previously-duplicated `apps/{mobile,desktop}/src/shell/cloud-navigation.tsx`
 * files; see CLAUDE.md §2.3 "code lives in exactly one place").
 *
 * The host renders one of two sub-screens on top of the
 * `<CloudOnboardingScreen />`:
 *   - `'advanced'`     → `<AdvancedBackendRoute />` (Settings → Avanzado
 *                         path, also reachable from the gate).
 *   - `'password-reset'` → `<PasswordResetScreen />` (CloudGate's
 *                          `onForgotPassword` callback).
 *
 * The active screen is controlled by a module-level Zustand store so
 * any consumer (the gate, the AppShell, a route file) can call
 * `useCloudNavigation().openAdvancedBackend()` /
 * `.openPasswordReset()` from a button handler without prop-drilling.
 *
 * The host reads the active `CloudAuthHandle` from the
 * `cloud-handle-registry` (which `useCloudBridges` publishes through
 * `setCloudHandle`) so the password-reset call wires through to the
 * same Supabase client the onboarding screen uses.
 *
 * Both apps' shells re-export this module so the public surface
 * (`import { CloudInnerScreenHost } from '../shell/cloud-navigation'`)
 * stays unchanged for older callers.
 */

import { type ReactElement } from 'react';
import { create } from 'zustand';
import { View } from '@tamagui/core';
import { AdvancedBackendRoute, PasswordResetScreen } from '../screens/CloudOnboarding/index';
import { colors } from '../theme';
import { useCloudSession } from '../hooks/use-cloud-session';
import { useCloudAuthHandle } from './cloud-handle-registry';

export type CloudInnerScreen = 'advanced' | 'password-reset' | null;

interface CloudNavStore {
  readonly screen: CloudInnerScreen;
  readonly open: (s: Exclude<CloudInnerScreen, null>) => void;
  readonly close: () => void;
}

const useCloudNavStore = create<CloudNavStore>((set) => ({
  screen: null,
  open: (screen) => set({ screen }),
  close: () => set({ screen: null }),
}));

export interface UseCloudNavigationResult {
  readonly openAdvancedBackend: () => void;
  readonly openPasswordReset: () => void;
}

export function useCloudNavigation(): UseCloudNavigationResult {
  const open = useCloudNavStore((s) => s.open);
  return {
    openAdvancedBackend: () => open('advanced'),
    openPasswordReset: () => open('password-reset'),
  };
}

export function CloudInnerScreenHost(): ReactElement | null {
  const screen = useCloudNavStore((s) => s.screen);
  const close = useCloudNavStore((s) => s.close);
  const handle = useCloudAuthHandle();
  const session = useCloudSession(handle);
  if (session.signedIn) return null;
  if (screen === null) return null;

  const body =
    screen === 'advanced' ? (
      <AdvancedBackendRoute onCancel={close} onSaved={close} />
    ) : (
      <PasswordResetScreen
        onReset={async (email) => {
          if (handle) await handle.resetPassword(email);
        }}
        onBack={close}
      />
    );

  return (
    <View
      position="absolute"
      top={0}
      right={0}
      bottom={0}
      left={0}
      backgroundColor={colors.offwhite}
      zIndex={1000}
    >
      {body}
    </View>
  );
}
