/**
 * GatedNavigation — boot-time state machine (P1C-M1, closes T01-T04).
 *
 * Wraps the app's router and renders the right pre-boarding screen based
 * on the hydrated AppConfig state:
 *
 *   hydrated=false          → null (splash stays)
 *   mode === null           → <Wizard /> (first-run)
 *   currentBusinessId === null → <BusinessForm />
 *   role === null           → <RolePicker />
 *   otherwise               → children (the app's router / tabs)
 *
 * Once children render, the user has a deviceId + mode + business + role
 * so every screen below can safely read those values. Settings' "Re-run
 * asistente" clears the mode on the store, which flips this component
 * back to the wizard for the next paint.
 *
 * Keeps navigation concerns thin: no router library required (mobile's
 * Expo Router owns the real tab navigation inside `children`; desktop
 * will when it adopts wouter). Cross-platform.
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

export interface GatedNavigationProps {
  readonly children: ReactNode;
  readonly platform?: 'mobile' | 'desktop';
}

function WizardGate({ platform }: { platform: 'mobile' | 'desktop' }): ReactElement {
  const appConfig = useAppConfigRepository();
  const setMode = useSetMode();
  function handleSelect(mode: AppMode): void {
    void appConfig.set(APP_CONFIG_KEYS.mode, mode).then(() => setMode(mode));
  }
  return <Wizard platform={platform} onSelectMode={handleSelect} />;
}

function BusinessGate(): ReactElement {
  const crear = useCrearBusiness();
  function handleSubmit(input: BusinessFormSubmitInput): void {
    crear.mutate(input);
  }
  return <BusinessForm onSubmit={handleSubmit} submitting={crear.isPending} />;
}

function RoleGate(): ReactElement {
  const setRole = useSetRole();
  function handleSelect(role: Role): void {
    setRole(role);
  }
  return <RolePicker onSelect={handleSelect} />;
}

export function GatedNavigation(props: GatedNavigationProps): ReactElement | null {
  const hydrated = useAppConfigHydrated();
  const mode = useMode();
  const currentBusinessId = useCurrentBusinessId();
  const role = useRole();
  const platform = props.platform ?? 'desktop';

  if (!hydrated) return null;
  if (mode === null) return <WizardGate platform={platform} />;
  if (currentBusinessId === null) return <BusinessGate />;
  if (role === null) return <RoleGate />;
  return <>{props.children}</>;
}
