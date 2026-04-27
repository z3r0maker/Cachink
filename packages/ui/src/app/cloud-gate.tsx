/**
 * CloudGate — boot-time state machine branch for `mode === 'cloud'`
 * (Slice 8 C1).
 *
 * Renders:
 *   - `<CloudOnboardingScreen />` when no Supabase session exists yet.
 *   - `children` once `useCloudSession` reports `signedIn`.
 *   - `null` while the initial `getSession()` is in flight so the splash
 *     screen stays in place (avoids a flash of the onboarding form on
 *     warm starts where Supabase already holds a refresh token).
 *
 * The `authHandle` is created lazily by the shell route (via
 * `initCloudAuth` from `@cachink/ui/sync`) — the gate just consumes it.
 * When the handle is `null` (e.g. the build has no backend URL and no
 * BYO override stored), the `backendConfigured` flag flips the onboarding
 * screen into its disabled-notice state pointing at Settings → Avanzado.
 */

import type { ReactElement, ReactNode } from 'react';
import type { CloudAuthHandle, CloudCredentials } from '../sync/cloud-bridge';
import { CloudOnboardingScreen } from '../screens/CloudOnboarding/index';
import { useCloudSession } from '../hooks/use-cloud-session';

export interface CloudBridges {
  readonly authHandle: CloudAuthHandle | null;
  /** Whether the build has a usable backend URL (baked-in or BYO). */
  readonly backendConfigured: boolean;
  readonly onSuccess: (creds: CloudCredentials) => void | Promise<void>;
  readonly onOpenAdvanced?: () => void;
  readonly onForgotPassword?: () => void;
  readonly onMagicLink?: (email: string) => Promise<void>;
}

export interface CloudGateProps {
  readonly bridges: CloudBridges | null;
  readonly children: ReactNode;
}

export function CloudGate(props: CloudGateProps): ReactElement | null {
  const handle = props.bridges?.authHandle ?? null;
  const session = useCloudSession(handle);

  if (session.isLoading) return null;
  if (session.signedIn) return <>{props.children}</>;
  if (!props.bridges) return null;

  const { bridges } = props;
  return (
    <CloudOnboardingScreen
      backendConfigured={bridges.backendConfigured}
      onSignIn={async (email, password) => {
        if (!handle) throw new Error('Cloud backend not configured');
        return handle.signIn(email, password);
      }}
      onSignUp={async (email, password, businessName) => {
        if (!handle) throw new Error('Cloud backend not configured');
        return handle.signUp(email, password, businessName);
      }}
      onMagicLink={bridges.onMagicLink}
      onForgotPassword={bridges.onForgotPassword}
      onOpenAdvanced={bridges.onOpenAdvanced}
      onSuccess={(creds) => {
        void bridges.onSuccess(creds);
      }}
    />
  );
}
