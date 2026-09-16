/**
 * AppProviders -- the one wrapper both apps mount.
 *
 * Composes the providers the rest of the codebase assumes are live.
 * Bridge components are in `./app-provider-bridges.tsx`.
 */

import { useMemo, useRef, type ReactElement, type ReactNode } from 'react';
import { TamaguiProvider } from '@tamagui/core';
import { PortalProvider } from '@tamagui/portal';
import { QueryClientProvider } from '@tanstack/react-query';
import type { DeviceContext, LogStore } from '@xangarro/observability';
import { tamaguiConfig } from '../tamagui.config';
import { DatabaseProvider } from '../database/index';
import { captureException } from '../telemetry/index';
import { GlobalErrorToast } from '../components/GlobalErrorToast/index';
import { GatedNavigation, type LanBridges } from './gated-navigation';
import { ActivationProvider } from '../activation/activation-context';
import type { ActivationConfig } from '../activation/activation-config';
import { AppErrorBoundary } from './error-boundary';
import { LanSyncProvider } from '../sync/lan-sync-context';
import type { LanSyncHandle } from '../sync/lan-bridge';
import {
  DrizzleAppConfigBridge,
  DrizzleRepositoryBridge,
  TelemetryBridge,
  ObservabilityBridge,
  buildQueryClient,
} from './app-provider-bridges';

export interface AppProvidersHooks {
  readonly useLan?: () => LanBridges | null;
  readonly useLanHandle?: () => LanSyncHandle | null;
}

export interface AppProvidersProps {
  readonly children: ReactNode;
  readonly platform?: 'mobile' | 'desktop';
  readonly gated?: boolean;
  readonly hooks?: AppProvidersHooks;
  readonly overlays?: ReactNode;
  /** Device context for outbox enrichment (supplied by mobile/desktop shell). */
  readonly deviceContext?: DeviceContext | null;
  /** Live accessor for current feature-flag state. */
  readonly getFeatureFlags?: () => Record<string, boolean> | null;
  /** API base, secure token store and device info (A-04). Defaults to an in-memory dev config. */
  readonly activation?: ActivationConfig;
}

const NULL_LAN_HOOK: () => LanBridges | null = () => null;
const NULL_HANDLE_HOOK: () => LanSyncHandle | null = () => null;

interface GatedBridgesProps {
  readonly platform?: 'mobile' | 'desktop';
  readonly hooks: Required<AppProvidersHooks>;
  readonly children: ReactNode;
}

function GatedBridges({ platform, hooks, children }: GatedBridgesProps): ReactElement {
  const lan = hooks.useLan();
  const lanHandle = hooks.useLanHandle();
  return (
    <LanSyncProvider handle={lanHandle}>
      <GatedNavigation platform={platform} lan={lan}>
        {children}
      </GatedNavigation>
    </LanSyncProvider>
  );
}

function resolveHooks(input?: AppProvidersHooks): Required<AppProvidersHooks> {
  return {
    useLan: input?.useLan ?? NULL_LAN_HOOK,
    useLanHandle: input?.useLanHandle ?? NULL_HANDLE_HOOK,
  };
}

/** Gated navigation bridges, or a bare LAN provider when gating is off. */
function renderContent(
  gated: boolean,
  platform: AppProvidersProps['platform'],
  hooks: Required<AppProvidersHooks>,
  children: ReactNode,
): ReactElement {
  return gated ? (
    <GatedBridges platform={platform} hooks={hooks}>
      {children}
    </GatedBridges>
  ) : (
    <LanSyncProvider handle={null}>{children}</LanSyncProvider>
  );
}

export function AppProviders(props: AppProvidersProps): ReactElement {
  const logStoreRef = useRef<LogStore | null>(null);
  const queryClient = useMemo(() => buildQueryClient(logStoreRef), []);
  const gated = props.gated ?? true;
  const hooks = useMemo(() => resolveHooks(props.hooks), [props.hooks]);
  const content = renderContent(gated, props.platform, hooks, props.children);

  return (
    <TamaguiProvider config={tamaguiConfig} defaultTheme="light">
      <PortalProvider shouldAddRootHost>
        <AppErrorBoundary onError={(err, info) => captureException(err, info)}>
          <QueryClientProvider client={queryClient}>
            <DatabaseProvider>
              <DrizzleAppConfigBridge>
                <DrizzleRepositoryBridge>
                  <ObservabilityBridge
                    logStoreRef={logStoreRef}
                    deviceContext={props.deviceContext}
                    getFeatureFlags={props.getFeatureFlags}
                  >
                    <TelemetryBridge>
                      <ActivationProvider config={props.activation}>{content}</ActivationProvider>
                      {/* Inside the data providers but outside gated `content`:
                          overlays (e.g. NotificationTapHost) stay mounted while
                          locked yet can resolve repository/query hooks. */}
                      {props.overlays}
                      <GlobalErrorToast />
                    </TelemetryBridge>
                  </ObservabilityBridge>
                </DrizzleRepositoryBridge>
              </DrizzleAppConfigBridge>
            </DatabaseProvider>
          </QueryClientProvider>
        </AppErrorBoundary>
      </PortalProvider>
    </TamaguiProvider>
  );
}
