/**
 * AppProviders — the one wrapper both apps mount.
 *
 * Composes the five providers the rest of the codebase assumes are live,
 * in the order they depend on each other:
 *
 *   1. `TamaguiProvider` — Tamagui primitives (§8) need it before render.
 *   2. `QueryClientProvider` — TanStack Query is the async cache for all
 *      repository hooks.
 *   3. `DatabaseProvider` — opens SQLite + runs migrations. Children wait
 *      for the db before mounting.
 *   4. `DrizzleAppConfigBridge` — builds `DrizzleAppConfigRepository` from
 *      the db and wraps children in `AppConfigProvider`. Hydrates the
 *      Zustand store with deviceId + mode + currentBusinessId. Renders
 *      null while hydration is in flight (splash stays visible).
 *   5. `DrizzleRepositoryBridge` — builds the 11 Drizzle repositories from
 *      the db + hydrated deviceId and wraps children in
 *      `RepositoryProvider`. Screens + hooks read repos from here.
 *
 * App-shell roots (`apps/mobile/src/app/_layout.tsx`,
 * `apps/desktop/src/app/main.tsx`) swap their ad-hoc providers for a
 * single `<AppProviders>`. Tests never mount this — they use
 * `<MockRepositoryProvider>` + `<TestDatabaseProvider>` directly.
 */

import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  type ReactElement,
  type ReactNode,
} from 'react';
import { TamaguiProvider } from '@tamagui/core';
import { PortalProvider } from '@tamagui/portal';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { DrizzleAppConfigRepository, readSyncState } from '@cachink/data';
import { tamaguiConfig } from '../tamagui.config';
import { DatabaseProvider, useDatabase } from '../database/index';
import {
  AppConfigProvider,
  APP_CONFIG_KEYS,
  useAppConfigHydrated,
  useCrashReportingEnabled,
  useDeviceId,
  useSetCrashReportingEnabled,
} from '../app-config/index';
import { ConsentModal } from '../screens/ConsentModal/index';
import { captureException, initSentryIfConsented } from '../telemetry/index';
import {
  buildDrizzleRepositories,
  RepositoryProvider,
  useAppConfigRepository,
} from './repository-provider';
import { GatedNavigation, type LanBridges, type CloudBridges } from './gated-navigation';
import { AppErrorBoundary } from './error-boundary';
import { LanSyncProvider } from '../sync/lan-sync-context';
import type { LanSyncHandle } from '../sync/lan-bridge';
import type { CachinkDatabase } from '@cachink/data';
import { CloudDatabaseProvider } from '../database/cloud-database-provider';

function DrizzleAppConfigBridge({ children }: { readonly children: ReactNode }): ReactElement {
  const db = useDatabase();
  const repo = useMemo(() => new DrizzleAppConfigRepository(db), [db]);
  // Resolver for the pre-ADR-039 `'lan'` mode value: read
  // `__cachink_sync_state.lanRole`. `'host'` → `'lan-server'`,
  // anything else → `'lan-client'` (safer default; clients can re-pair
  // but hosts must explicitly start the bundled server).
  const resolveLegacyLan = useCallback(async (): Promise<'lan-server' | 'lan-client'> => {
    try {
      const role = await readSyncState(db, 'lanRole');
      return role === 'host' ? 'lan-server' : 'lan-client';
    } catch {
      // Migration may run before sync-state table exists — fail safe.
      return 'lan-client';
    }
  }, [db]);
  return (
    <AppConfigProvider appConfig={repo} resolveLegacyLan={resolveLegacyLan}>
      {children}
    </AppConfigProvider>
  );
}

function DrizzleRepositoryBridge({
  children,
}: {
  readonly children: ReactNode;
}): ReactElement | null {
  const db = useDatabase();
  const deviceId = useDeviceId();
  const repositories = useMemo(() => {
    if (!deviceId) return null;
    return buildDrizzleRepositories(db, deviceId);
  }, [db, deviceId]);
  if (!repositories) return null;
  return <RepositoryProvider repositories={repositories}>{children}</RepositoryProvider>;
}

/**
 * TelemetryBridge — initialises Sentry when consent === true, renders
 * the ConsentModal the first time the user lands (consent === null).
 * Persists answers through AppConfigRepository.
 *
 * ## Audit M-1 Step 0 — `dismissedThisSession` fix
 *
 * Previously the modal was bound to `consent === null`. Tapping
 * "Decidir después" (or the X / backdrop) called `onChange(null)` and
 * left consent at `null`, so the modal never closed — `open` stayed
 * `true`. The user's only escape hatches were "Sí, enviar" and
 * "No, gracias", which is bad UX *and* prevents Maestro / E2E from
 * advancing past the first-launch wizard. We now track a local
 * `dismissedThisSession` boolean: once the user makes any choice we
 * stop forcing the modal open until the next cold start (the
 * provider re-mounts and the flag resets, so the prompt re-appears
 * exactly as the original "Decidir después" intent specified).
 */
function TelemetryBridge({ children }: { readonly children: ReactNode }): ReactElement {
  const hydrated = useAppConfigHydrated();
  const consent = useCrashReportingEnabled();
  const setConsent = useSetCrashReportingEnabled();
  const appConfig = useAppConfigRepository();
  const [dismissedThisSession, setDismissedThisSession] = useState(false);

  useEffect(() => {
    if (!hydrated) return;
    void initSentryIfConsented(consent);
  }, [hydrated, consent]);

  function persist(next: boolean | null): void {
    setConsent(next);
    setDismissedThisSession(true);
    if (next === null) {
      void appConfig.delete(APP_CONFIG_KEYS.crashReportingEnabled);
      return;
    }
    void appConfig.set(APP_CONFIG_KEYS.crashReportingEnabled, next ? 'true' : 'false');
  }

  return (
    <>
      {children}
      <ConsentModal
        open={hydrated && consent === null && !dismissedThisSession}
        onChange={persist}
      />
    </>
  );
}

function buildQueryClient(): QueryClient {
  return new QueryClient({
    defaultOptions: {
      queries: {
        // Repositories are local SQLite; network-flakiness retries make no
        // sense. Let errors surface immediately to the UI.
        retry: 0,
        // Stale data in a local-first app only happens after the same
        // process mutates — mark writes invalidate the key explicitly.
        staleTime: Infinity,
      },
    },
  });
}

/**
 * Hook factories that run *inside* the provider tree so the shell can
 * use repositories / database / app-config to build the bridges. Each
 * is optional — apps that don't enable a mode just omit the factory.
 *
 * **Hook-of-hooks pattern (Slice 8 design A1).** Every property here is
 * itself a React hook, not a plain function. The shell passes
 * `{ useLan: useMobileLanBridges }` and `<AppProviders>` invokes
 * `hooks.useLan()` from inside `<GatedBridges>` — a real component
 * render — so the factory's body is allowed to call other hooks
 * (`useDatabase`, `useDeviceId`, `useQueryClient`, etc.). The factory
 * runs once per `<GatedBridges>` render; React's normal rules-of-hooks
 * apply to whatever it calls.
 *
 * `null` factories collapse to the `NULL_*` placeholders below so a
 * Local-standalone shell can omit `useLan` / `useCloud` entirely
 * without crashing the gate. The placeholders are stable references
 * across renders, so unmounting them is a no-op.
 */
export interface AppProvidersHooks {
  readonly useLan?: () => LanBridges | null;
  readonly useCloud?: () => CloudBridges | null;
  readonly useLanHandle?: () => LanSyncHandle | null;
  /**
   * Resolves the PowerSync-backed `CachinkDatabase` used in Cloud mode
   * (Slice 8 C5). Returns `null` until the user has signed in. When
   * non-null, `<CloudDatabaseProvider>` swaps the active context so the
   * 11 repositories read/write through PowerSync instead of local SQLite.
   */
  readonly useCloudHandle?: () => CachinkDatabase | null;
}

export interface AppProvidersProps {
  readonly children: ReactNode;
  /**
   * Host platform. Controls `GatedNavigation`'s wizard variant (mobile
   * hides the "Ser el servidor local" option). Defaults to `'desktop'`.
   */
  readonly platform?: 'mobile' | 'desktop';
  /**
   * Set to false to skip the boot-time gate entirely. Tests use this to
   * render app screens without walking the wizard.
   */
  readonly gated?: boolean;
  /**
   * Hooks that the shell uses to resolve LAN/Cloud bridges from inside
   * the provider tree (so they can use repositories and the database).
   * Each hook is called once on every render of `<GatedBridges>`.
   */
  readonly hooks?: AppProvidersHooks;
  /**
   * Always-mounted overlay nodes (e.g. `<MobileScannerHost />`,
   * `<CloudInnerScreenHost />`). These render as a sibling of `children`
   * inside `<TamaguiProvider>` + `<AppErrorBoundary>` but **outside** the
   * gate chain so they remain mounted while `<LanGate>` /
   * `<CloudGate>` show their pairing or onboarding screens (Round 3 F1).
   *
   * Overlays must not depend on the `<DatabaseProvider>` /
   * `<RepositoryProvider>` context — they only see Tamagui + i18n + the
   * module-level cloud-handle-registry / scanner Zustand store. Passing
   * a child that calls `useDatabase()` will throw at render time.
   */
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
  const queryClient = useMemo(buildQueryClient, []);
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
      {/* `PortalProvider` is required by every Tamagui Dialog / Sheet /
          Popover descendant — `<Modal>` (`@tamagui/dialog`) crashes at
          render time with "PortalDispatchContext cannot be null" when
          this provider is missing. Mounted directly inside
          `TamaguiProvider` so it sits above both the gated content and
          the overlays slot — the latter contains the mobile scanner
          host (`<Scanner>` → `<Modal>` → `<Dialog.Portal>`). */}
      <PortalProvider shouldAddRootHost>
        <AppErrorBoundary onError={(err, info) => captureException(err, info)}>
          <QueryClientProvider client={queryClient}>
            <DatabaseProvider>
              <DrizzleAppConfigBridge>
                <DrizzleRepositoryBridge>
                  <TelemetryBridge>{content}</TelemetryBridge>
                </DrizzleRepositoryBridge>
              </DrizzleAppConfigBridge>
            </DatabaseProvider>
          </QueryClientProvider>
          {/* Overlays mount outside the gate chain so the LAN scanner and
              Cloud inner-screen hosts stay rendered while the LAN/Cloud
              gates are showing pairing / onboarding screens (Round 3 F1). */}
          {props.overlays}
        </AppErrorBoundary>
      </PortalProvider>
    </TamaguiProvider>
  );
}
