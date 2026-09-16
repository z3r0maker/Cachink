/**
 * GatedNavigation — boot-time state machine.
 *
 *   hydrated=false             → null (splash stays)
 *   not activated              → <ActivationScreen /> (A-04; email + code)
 *   mode lan-server/lan-client → <LanGate> (dormant; removed in A-18)
 *   no current business        → loading (activation always sets it)
 *   userId === null            → <QuickSwitchGate /> (operator + PIN, A-05)
 *   otherwise                  → children (the app's router / tabs)
 *
 * The business, its operators and their PINs arrive with activation and
 * sync; the device never creates them (Q2). The old first-run path —
 * Wizard, BusinessForm, DirectorSetup, forced PIN change, demo seeding —
 * lives in archive/.
 */

import type { ReactElement, ReactNode } from 'react';
import type { BusinessId } from '@xangarro/domain';
import { useAppConfigHydrated, useCurrentBusinessId, useMode } from '../app-config/index';
import { useUserId } from '../app-config/use-app-config';
import { ActivityTracker } from '../components/ActivityTracker/index';
import { DEFAULT_AUTO_LOCK_TIMEOUT, useAutoLock } from '../hooks/use-auto-lock';
import { ActivationGate } from './activation-gate';
import { AppLoadingSkeleton } from './app-loading-skeleton';
import { QuickSwitchGate } from './auth-gates';
import { LanGate, type LanBridges } from './lan-gate';

export { type LanBridges } from './lan-gate';

export interface GatedNavigationProps {
  readonly children: ReactNode;
  readonly platform?: 'mobile' | 'desktop';
  readonly lan?: LanBridges | null;
}

function AuthInner(props: {
  readonly businessId: BusinessId;
  readonly children: ReactNode;
}): ReactElement {
  const userId = useUserId();
  // Auto-lock after inactivity (does NOT close Caja turns); every touch resets it.
  const { resetActivity } = useAutoLock(DEFAULT_AUTO_LOCK_TIMEOUT);
  if (userId === null) return <QuickSwitchGate businessId={props.businessId} />;
  return <ActivityTracker onActivity={resetActivity}>{props.children}</ActivityTracker>;
}

export function GatedNavigation(props: GatedNavigationProps): ReactElement | null {
  const hydrated = useAppConfigHydrated();
  if (!hydrated) return null;
  return (
    <ActivationGate>
      <GatedFlow {...props} />
    </ActivationGate>
  );
}

/** Everything after hydration + activation. */
function GatedFlow(props: GatedNavigationProps): ReactElement {
  const mode = useMode();
  const currentBusinessId = useCurrentBusinessId();
  const inner =
    currentBusinessId === null ? (
      <AppLoadingSkeleton />
    ) : (
      <AuthInner businessId={currentBusinessId}>{props.children}</AuthInner>
    );
  if (mode === 'lan-server' || mode === 'lan-client') {
    return (
      <LanGate bridges={props.lan ?? null} mode={mode}>
        {inner}
      </LanGate>
    );
  }
  return inner;
}
