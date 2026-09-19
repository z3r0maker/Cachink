/**
 * AppShellRouteWrapper — shared AppShell wiring consumed by the mobile
 * `app-shell-wrapper.tsx` adapter, which injects Expo Router's navigate /
 * replace. All mode/business resolution and AppShell callback wiring lives
 * here exactly once (CLAUDE.md §5.1).
 *
 * Single role (ADR-053): tapping the avatar locks the screen so the next
 * Operator signs in with their PIN.
 */

import type { ReactElement, ReactNode } from 'react';
import { AppShell } from '../../screens/AppShell/index';
import { useCurrentBusiness } from '../../hooks/use-current-business';
import { useFeatureFlags } from '../../hooks/use-feature-flags';
import { useMode, useSetUserId } from '../../app-config/use-app-config';

export interface AppShellRouteWrapperProps {
  readonly activeTabKey: string;
  readonly title?: string;
  /**
   * When provided, the TopBar's left slot renders a ghost icon-only back
   * button instead of the operator avatar. Pass on routes reached from a
   * parent screen (Settings, Cuentas por Cobrar, etc.).
   */
  readonly onBack?: () => void;
  /** Optional override for the back-button's accessible label. */
  readonly backLabel?: string;
  /** Platform-injected navigate callback (`router.push` on mobile). */
  readonly navigate: (path: string) => void;
  /**
   * Platform-injected replace callback (`router.replace` on mobile). Used for
   * bottom-tab switches so tabs never stack. Falls back to `navigate`.
   */
  readonly replaceRoute?: (path: string) => void;
  readonly children: ReactNode;
}

export function AppShellRouteWrapper(props: AppShellRouteWrapperProps): ReactElement {
  const mode = useMode();
  const flags = useFeatureFlags();
  const business = useCurrentBusiness().data ?? null;
  const setUserId = useSetUserId();
  const tabNavigate = props.replaceRoute ?? props.navigate;
  return (
    <AppShell
      activeTabKey={props.activeTabKey}
      mode={mode}
      flags={flags}
      title={props.title ?? business?.nombre ?? undefined}
      onBack={props.onBack}
      backLabel={props.backLabel}
      onNavigate={tabNavigate}
      onSwitchOperator={() => setUserId(null)}
      onOpenSettings={() => props.navigate('/settings')}
    >
      {props.children}
    </AppShell>
  );
}
