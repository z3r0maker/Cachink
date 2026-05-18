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
import type { LogStore } from '@cachink/observability';
import { tamaguiConfig } from '../tamagui.config';
import { DatabaseProvider } from '../database/index';
import { captureException } from '../telemetry/index';
import { GlobalErrorToast } from '../components/GlobalErrorToast/index';
import { GatedNavigation, type LanBridges, type CloudBridges } from './gated-navigation';
import { AppErrorBoundary } from './error-boundary';
import { LanSyncProvider } from '../sync/lan-sync-context';
import type { LanSyncHandle } from '../sync/lan-bridge';
import type { CachinkDatabase } from '@cachink/data';
import { CloudDatabaseProvider } from '../database/cloud-database-provider';
import {
  DrizzleAppConfigBridge,
  DrizzleRepositoryBridge,
  TelemetryBridge,
  ObservabilityBridge,
  buildQueryClient,
} from './app-provider-bridges';

export interface AppProvidersHooks {
  readonly useLan?: () => LanBridges | null;
  readonly useCloud?: () => CloudBridges | null;
  readonly useLanHandle?: () => LanSyncHandle | null;
  readonly useCloudHandle?: () => CachinkDatabase | null;
}

export interface AppProvidersProps {
  readonly children: ReactNode;
  readonly platform?: 'mobile' | 'desktop';
  readonly gated?: boolean;
  readonly hooks?: AppProvidersHooks;
  readonly overlays?: ReactNode;
}

const NULL_LAN_HOOK: () => LanBridges | null = () => null;
const NULL_CLOUD_HOOK: () => CloudBridges | null = () => null;
const NULL_HANDLE_HOOK: () => LanSyncHandle | null = () => null;
const NULL_DB_HOOK: () => CachinkDatabase | null = () => null;

interface GatedBridgesProps {
  readonly platform?: 'mobile' | 'desktop';
  readonly hooks: Required<AppProvidersHooks>;
  readonly children: ReactNode;
}

function GatedBridges({ platform, hooks, children }: GatedBridgesProps): ReactElement {
  const lan = hooks.useLan();
  const cloud = hooks.useCloud();
  const lanHandle = hooks.useLanHandle();
  const cloudHandle = hooks.useCloudHandle();
  return (
    <LanSyncProvider handle={lanHandle}>
      <CloudDatabaseProvider cloudHandle={cloudHandle}>
        <GatedNavigation platform={platform} lan={lan} cloud={cloud}>
          {children}
        </GatedNavigation>
      </CloudDatabaseProvider>
    </LanSyncProvider>
  );
}

function resolveHooks(input?: AppProvidersHooks): Required<AppProvidersHooks> {
  return {
    useLan: input?.useLan ?? NULL_LAN_HOOK,
    useCloud: input?.useCloud ?? NULL_CLOUD_HOOK,
    useLanHandle: input?.useLanHandle ?? NULL_HANDLE_HOOK,
    useCloudHandle: input?.useCloudHandle ?? NULL_DB_HOOK,
  };
}

export function AppProviders(props: AppProvidersProps): ReactElement {
  const logStoreRef = useRef<LogStore | null>(null);
  const queryClient = useMemo(() => buildQueryClient(logStoreRef), []);
  const gated = props.gated ?? true;
  const hooks = useMemo(() => resolveHooks(props.hooks), [props.hooks]);

  const content = gated ? (
    <GatedBridges platform={props.platform} hooks={hooks}>
      {props.children}
    </GatedBridges>
  ) : (
    <LanSyncProvider handle={null}>{props.children}</LanSyncProvider>
  );

  return (
    <TamaguiProvider config={tamaguiConfig} defaultTheme="light">
      <PortalProvider shouldAddRootHost>
        <AppErrorBoundary onError={(err, info) => captureException(err, info)}>
          <QueryClientProvider client={queryClient}>
            <DatabaseProvider>
              <DrizzleAppConfigBridge>
                <DrizzleRepositoryBridge>
                  <ObservabilityBridge logStoreRef={logStoreRef}>
                    <TelemetryBridge>
                      {content}
                      <GlobalErrorToast />
                    </TelemetryBridge>
                  </ObservabilityBridge>
                </DrizzleRepositoryBridge>
              </DrizzleAppConfigBridge>
            </DatabaseProvider>
          </QueryClientProvider>
          {props.overlays}
        </AppErrorBoundary>
      </PortalProvider>
    </TamaguiProvider>
  );
}
