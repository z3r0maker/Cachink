/**
 * AppShellRouteWrapper — shared AppShell wiring consumed by the mobile
 * `app-shell-wrapper.tsx` adapter, which injects Expo Router's navigate /
 * replace and the current pathname. All AppShell callback wiring lives here
 * exactly once (CLAUDE.md §5.1).
 *
 * Single role (ADR-053): locking the caja clears the signed-in operator, so
 * the next person signs in with their NIP.
 */

import type { ReactElement, ReactNode } from 'react';
import { AppShell } from '../../screens/AppShell/index';
import type { AvisosSource, HeaderStatus } from '../../screens/AppShell/index';
import { useMode, useSetUserId } from '../../app-config/use-app-config';

export interface AppShellRouteWrapperProps {
  /** A `NavKey` or the current pathname; the frame lights its destination. */
  readonly activeTabKey: string;
  /** On a detail route: the back button's label («Mi turno», «Ventas»). */
  readonly title?: string;
  /** Present on a detail route: the header shows the way back. */
  readonly onBack?: () => void;
  /** Optional override for the back-button's accessible label. */
  readonly backLabel?: string;
  readonly headerStatus?: HeaderStatus;
  readonly avisos?: AvisosSource;
  /** Platform-injected navigate callback (`router.push` on mobile). */
  readonly navigate: (path: string) => void;
  /**
   * Platform-injected replace callback (`router.replace` on mobile). Used for
   * tab switches so tabs never stack. Falls back to `navigate`.
   */
  readonly replaceRoute?: (path: string) => void;
  readonly children: ReactNode;
}

export function AppShellRouteWrapper(props: AppShellRouteWrapperProps): ReactElement {
  const mode = useMode();
  const setUserId = useSetUserId();
  return (
    <AppShell
      activeTabKey={props.activeTabKey}
      mode={mode}
      title={props.title}
      onBack={props.onBack}
      backLabel={props.backLabel}
      headerStatus={props.headerStatus}
      avisos={props.avisos}
      onNavigate={props.replaceRoute ?? props.navigate}
      onLock={() => setUserId(null)}
    >
      {props.children}
    </AppShell>
  );
}
