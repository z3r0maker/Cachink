/**
 * GatedNavigation — boot-time state machine.
 *
 * Wraps the app's router and renders the right pre-boarding screen:
 *
 *   hydrated=false                → null (splash stays)
 *   mode === null                 → <Wizard /> (first-run)
 *   mode === 'lan'  + no token   → <LanGate>   (host or join)
 *   mode === 'cloud' + no sess   → <CloudGate> (onboarding)
 *   currentBusinessId === null    → <BusinessForm />
 *   no users exist               → <DirectorSetupGate /> (NEW)
 *   userId === null               → <QuickSwitchGate /> (replaces RolePicker)
 *   mustChangePin === true        → <ChangePinGate /> (ADR-049)
 *   otherwise                    → children (the app's router / tabs)
 */

import type { ReactElement, ReactNode } from 'react';
import {
  APP_CONFIG_KEYS,
  useAppConfigHydrated,
  useCurrentBusinessId,
  useMode,
  useSetMode,
} from '../app-config/index';
import { useUserId, useMustChangePin } from '../app-config/use-app-config';
import { useAutoLock, DEFAULT_AUTO_LOCK_TIMEOUT } from '../hooks/use-auto-lock';
import { ActivityTracker } from '../components/ActivityTracker/index';
import { useAppConfigRepository } from './repository-provider';
import { Wizard } from '../screens/Wizard/index';
import { BusinessForm, type BusinessFormSubmitInput } from '../screens/BusinessForm/index';
import { useCrearBusiness } from '../hooks/use-crear-business';
import { useIsrDefaults } from '../hooks/use-isr-defaults';
import type { AppMode } from '../app-config/index';
import type { BusinessId } from '@cachink/domain';
import { LanGate, type LanBridges } from './lan-gate';
import { CloudGate, type CloudBridges } from './cloud-gate';
import { useAuthGateState, DirectorSetupGate, QuickSwitchGate, ChangePinGate } from './auth-gates';
import { FeatureDiscoveryGate } from './feature-discovery-gate';
import { useDemoMode, type DemoModeState } from '../dev/index';
import { DemoSeedingScreen } from '../screens/DemoSeeding/index';
import { AppLoadingSkeleton } from './app-loading-skeleton';

export { type LanBridges } from './lan-gate';
export { type CloudBridges } from './cloud-gate';

export interface GatedNavigationProps {
  readonly children: ReactNode;
  readonly platform?: 'mobile' | 'desktop';
  readonly lan?: LanBridges | null;
  readonly cloud?: CloudBridges | null;
}

function WizardGate(props: {
  platform: 'mobile' | 'desktop';
  demoMode: DemoModeState | undefined;
}): ReactElement {
  const appConfig = useAppConfigRepository();
  const setMode = useSetMode();
  async function handleSelect(mode: AppMode): Promise<void> {
    await appConfig.set(APP_CONFIG_KEYS.mode, mode);
    setMode(mode);
  }
  return (
    <Wizard
      platform={props.platform}
      onSelectMode={(m) => void handleSelect(m)}
      onDemoMode={props.demoMode?.trigger}
      demoLoading={props.demoMode?.loading}
    />
  );
}

function BusinessGate(): ReactElement {
  const crear = useCrearBusiness();
  const appConfig = useAppConfigRepository();
  const setMode = useSetMode();
  const { data: isrDefaults } = useIsrDefaults();
  function handleSubmit(input: BusinessFormSubmitInput): void {
    crear.mutate(input);
  }
  function handleBack(): void {
    void appConfig.delete(APP_CONFIG_KEYS.mode).then(() => {
      setMode(null);
    });
  }
  return (
    <BusinessForm
      onSubmit={handleSubmit}
      submitting={crear.isPending}
      onBack={handleBack}
      isrDefaults={isrDefaults}
    />
  );
}

function renderPreBusinessGate(
  mode: AppMode,
  props: GatedNavigationProps,
  children: ReactNode,
): { output: ReactElement | null; fallthrough: boolean } {
  if (mode === 'lan-server' || mode === 'lan-client') {
    return {
      output: (
        <LanGate bridges={props.lan ?? null} mode={mode}>
          {children}
        </LanGate>
      ),
      fallthrough: false,
    };
  }
  if (mode === 'cloud') {
    return {
      output: <CloudGate bridges={props.cloud ?? null}>{children}</CloudGate>,
      fallthrough: false,
    };
  }
  return { output: null, fallthrough: true };
}

function AuthInner(props: {
  readonly businessId: string;
  readonly children: ReactNode;
}): ReactElement | null {
  const businessId = props.businessId as BusinessId;
  const { hasUsers, isLoading } = useAuthGateState(businessId);
  const userId = useUserId();
  const mustChange = useMustChangePin();

  // Auto-lock screen after inactivity (does NOT close Caja turns).
  // `resetActivity` is called on every touch via ActivityTracker.
  const { resetActivity } = useAutoLock(DEFAULT_AUTO_LOCK_TIMEOUT);

  if (isLoading || hasUsers === undefined) return <AppLoadingSkeleton />;

  if (!hasUsers) {
    return <DirectorSetupGate businessId={businessId} />;
  }
  if (userId === null) {
    return <QuickSwitchGate businessId={businessId} />;
  }
  if (mustChange) {
    return <ChangePinGate />;
  }
  return (
    <FeatureDiscoveryGate>
      <ActivityTracker onActivity={resetActivity}>{props.children}</ActivityTracker>
    </FeatureDiscoveryGate>
  );
}

export function GatedNavigation(props: GatedNavigationProps): ReactElement | null {
  const hydrated = useAppConfigHydrated();
  const mode = useMode();
  const currentBusinessId = useCurrentBusinessId();
  const platform = props.platform ?? 'desktop';
  const demoMode = useDemoMode();

  if (!hydrated) return null;

  // Demo seeding overlay — renders ABOVE the wizard/auth gates
  // so it persists across the mode=null → mode='local' transition.
  if (demoMode?.loading) {
    return <DemoSeedingScreen />;
  }

  if (mode === null) {
    return <WizardGate platform={platform} demoMode={demoMode} />;
  }

  const inner =
    currentBusinessId === null ? (
      <BusinessGate />
    ) : (
      <AuthInner businessId={currentBusinessId}>{props.children}</AuthInner>
    );

  const { output, fallthrough } = renderPreBusinessGate(mode, props, inner);
  if (!fallthrough) return output;
  return inner;
}
