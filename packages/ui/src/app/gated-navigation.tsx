/**
 * GatedNavigation — boot-time state machine (P1C-M1 / extended in Slice 8).
 *
 * Wraps the app's router and renders the right pre-boarding screen based
 * on the hydrated AppConfig state + LAN/Cloud auth state:
 *
 *   hydrated=false             → null (splash stays)
 *   mode === null              → <Wizard /> (first-run)
 *   mode === 'lan'  + no token → <LanGate>   (host or join)
 *   mode === 'cloud' + no sess → <CloudGate> (onboarding)
 *   currentBusinessId === null → <BusinessForm />
 *   role === null              → <RolePicker />
 *   otherwise                  → children (the app's router / tabs)
 *
 * Once children render, the user has a deviceId + mode + business + role
 * so every screen below can safely read those values. Settings' "Re-run
 * asistente" clears the mode on the store, which flips this component
 * back to the wizard for the next paint.
 *
 * The LAN and Cloud bridges are supplied by the platform shell because
 * they wrap platform-specific IO (Tauri invoke, Expo camera, PowerSync
 * native modules). The UI layer stays pure — gates receive bridges and
 * render the right screen.
 */

import type { ReactElement, ReactNode } from 'react';
import {
  APP_CONFIG_KEYS,
  useAppConfigHydrated,
  useCurrentBusinessId,
  useMode,
  useRole,
  useSetMode,
} from '../app-config/index';
import { useAppConfigRepository } from './repository-provider';
import { Wizard } from '../screens/Wizard/index';
import { BusinessForm, type BusinessFormSubmitInput } from '../screens/BusinessForm/index';
import { RolePicker } from '../screens/RolePicker/index';
import { useCrearBusiness } from '../hooks/use-crear-business';
import { useSetRole } from '../app-config/use-app-config';
import type { AppMode, Role } from '../app-config/index';
import { LanGate, type LanBridges } from './lan-gate';
import { CloudGate, type CloudBridges } from './cloud-gate';

export { type LanBridges } from './lan-gate';
export { type CloudBridges } from './cloud-gate';

export interface GatedNavigationProps {
  readonly children: ReactNode;
  readonly platform?: 'mobile' | 'desktop';
  readonly lan?: LanBridges | null;
  readonly cloud?: CloudBridges | null;
}

interface WizardGateInternalProps {
  readonly platform: 'mobile' | 'desktop';
}

function WizardGate({ platform }: WizardGateInternalProps): ReactElement {
  const appConfig = useAppConfigRepository();
  const setMode = useSetMode();
  async function handleSelect(mode: AppMode): Promise<void> {
    // Per ADR-039 the wizard writes the final AppMode directly. The
    // pre-ADR-039 lanRole sync-state scope is no longer set by new
    // code — `'lan-server'` / `'lan-client'` carry the role.
    await appConfig.set(APP_CONFIG_KEYS.mode, mode);
    setMode(mode);
  }
  return <Wizard platform={platform} onSelectMode={(m) => void handleSelect(m)} />;
}

function BusinessGate(): ReactElement {
  const crear = useCrearBusiness();
  const appConfig = useAppConfigRepository();
  const setMode = useSetMode();
  function handleSubmit(input: BusinessFormSubmitInput): void {
    crear.mutate(input);
  }
  // Mirrors the canonical "re-run wizard" flow used by Settings (see
  // apps/desktop/src/app/routes/settings-route.tsx#reRunWizard): clear the
  // persisted mode then null out the in-memory store. GatedNavigation
  // re-renders with `mode === null`, falling through to <Wizard />, whose
  // own useWizardReset effect rewinds the wizard to Step 1.
  function handleBack(): void {
    void appConfig.delete(APP_CONFIG_KEYS.mode).then(() => {
      setMode(null);
    });
  }
  return <BusinessForm onSubmit={handleSubmit} submitting={crear.isPending} onBack={handleBack} />;
}

function RoleGate(): ReactElement {
  const setRole = useSetRole();
  function handleSelect(role: Role): void {
    setRole(role);
  }
  return <RolePicker onSelect={handleSelect} />;
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

export function GatedNavigation(props: GatedNavigationProps): ReactElement | null {
  const hydrated = useAppConfigHydrated();
  const mode = useMode();
  const currentBusinessId = useCurrentBusinessId();
  const role = useRole();
  const platform = props.platform ?? 'desktop';

  if (!hydrated) return null;
  if (mode === null) {
    return <WizardGate platform={platform} />;
  }

  // Inner content once the mode-specific auth gate has let us through.
  const inner =
    currentBusinessId === null ? (
      <BusinessGate />
    ) : role === null ? (
      <RoleGate />
    ) : (
      <>{props.children}</>
    );

  // Apply LAN / Cloud gates *outside* the business + role gates so the
  // pairing / onboarding screens render full-screen without the chrome
  // of the business form.
  const { output, fallthrough } = renderPreBusinessGate(mode, props, inner);
  if (!fallthrough) return output;
  return inner;
}
