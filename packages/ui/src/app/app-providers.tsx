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
import { GatedNavigation } from './gated-navigation';
import { ActivationProvider } from '../activation/activation-context';
import { CloudSyncBridge } from './cloud-sync-bridge';
import type { ActivationConfig } from '../activation/activation-config';
import { AppErrorBoundary } from './error-boundary';
import {
  DrizzleAppConfigBridge,
  DrizzleRepositoryBridge,
  TelemetryBridge,
  ObservabilityBridge,
  buildQueryClient,
} from './app-provider-bridges';

export interface AppProvidersProps {
  readonly children: ReactNode;
  readonly platform?: 'mobile' | 'desktop';
  readonly gated?: boolean;
  readonly overlays?: ReactNode;
  /** Device context for outbox enrichment (supplied by mobile/desktop shell). */
  readonly deviceContext?: DeviceContext | null;
  /** Live accessor for current feature-flag state. */
  readonly getFeatureFlags?: () => Record<string, boolean> | null;
  /** API base, secure token store and device info (A-04). Defaults to an in-memory dev config. */
  readonly activation?: ActivationConfig;
}

/**
 * Activation + cloud sync around the gated app. Overlays sit inside the data
 * providers but outside the gated content, so hosts like NotificationTapHost
 * stay mounted while locked yet can resolve repository/query hooks.
 */
function SessionLayer(props: {
  readonly activation?: ActivationConfig;
  readonly overlays?: ReactNode;
  readonly children: ReactNode;
}): ReactElement {
  return (
    <TelemetryBridge>
      <ActivationProvider config={props.activation}>
        <CloudSyncBridge>{props.children}</CloudSyncBridge>
      </ActivationProvider>
      {props.overlays}
      <GlobalErrorToast />
    </TelemetryBridge>
  );
}

export function AppProviders(props: AppProvidersProps): ReactElement {
  const logStoreRef = useRef<LogStore | null>(null);
  const queryClient = useMemo(() => buildQueryClient(logStoreRef), []);
  const content =
    props.gated === false ? (
      props.children
    ) : (
      <GatedNavigation platform={props.platform}>{props.children}</GatedNavigation>
    );

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
                    <SessionLayer activation={props.activation} overlays={props.overlays}>
                      {content}
                    </SessionLayer>
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
