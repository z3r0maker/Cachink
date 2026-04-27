/**
 * `initCloudAuth()` / `useCloudSession()` bridge — the Cloud-mode
 * counterpart of `lan-bridge.ts` (ADR-035).
 *
 * Same lazy-import rule: `@cachink/sync-cloud` never enters a
 * Local-standalone or LAN-mode bundle. The `LazyCloudModule` interface
 * matches only the subset of `@cachink/sync-cloud` we call at runtime so
 * this file has zero static edge to that package.
 */

export type CloudRole = 'Operativo' | 'Director';

export interface CloudCredentials {
  readonly accessToken: string;
  readonly userId: string;
  readonly businessId: string;
  readonly role: CloudRole;
  readonly expiresAt: number;
}

export interface CloudBackendConfig {
  readonly projectUrl: string;
  readonly anonKey: string;
  readonly powersyncUrl?: string | null;
}

export interface CloudAuthHandle {
  signIn(email: string, password: string): Promise<CloudCredentials>;
  signUp(email: string, password: string, businessName: string): Promise<CloudCredentials>;
  signOut(): Promise<void>;
  resetPassword(email: string): Promise<void>;
  getSession(): Promise<CloudCredentials | null>;
  onAuthStateChange(listener: (creds: CloudCredentials | null) => void): () => void;
}

interface LazyCloudModule {
  cloudAuth: (deps: { byo: CloudBackendConfig | null; defaults: CloudBackendConfig | null }) => {
    signIn: (p: { email: string; password: string }) => Promise<CloudCredentials>;
    signUp: (p: {
      email: string;
      password: string;
      businessName: string;
    }) => Promise<CloudCredentials>;
    signOut: () => Promise<void>;
    resetPassword: (email: string) => Promise<void>;
    getSession: () => Promise<CloudCredentials | null>;
    onAuthStateChange: (cb: (c: CloudCredentials | null) => void) => () => void;
  } | null;
}

export interface InitCloudArgs {
  readonly byo: CloudBackendConfig | null;
  readonly defaults: CloudBackendConfig | null;
}

/**
 * Lazy-load `@cachink/sync-cloud` and return a narrowed auth handle.
 *
 * Uses a literal-string dynamic import so Vite/Rollup splits
 * `@cachink/sync-cloud` (and its `@supabase/supabase-js` peer) into
 * the dedicated `sync-cloud-*.js` chunk declared in
 * `apps/desktop/vite.config.ts`'s `manualChunks` rule (Slice 8 M2-C11).
 * The boundary test (`cloud-bridge.boundary.test.ts`) permits the
 * dynamic-import form — only static `import ... from
 * '@cachink/sync-cloud'` is forbidden in `packages/ui/src/**`.
 * `@cachink/sync-cloud` is declared as an OPTIONAL `peerDependency`
 * of `@cachink/ui` so type resolution succeeds without making
 * sync-cloud required at install time for Local-only consumers.
 */
export async function initCloudAuth(args: InitCloudArgs): Promise<CloudAuthHandle | null> {
  const mod = (await import('@cachink/sync-cloud')) as unknown as LazyCloudModule;
  const connector = mod.cloudAuth({ byo: args.byo, defaults: args.defaults });
  if (!connector) return null;
  return {
    signIn: (email, password) => connector.signIn({ email, password }),
    signUp: (email, password, businessName) => connector.signUp({ email, password, businessName }),
    signOut: () => connector.signOut(),
    resetPassword: (email) => connector.resetPassword(email),
    getSession: () => connector.getSession(),
    onAuthStateChange: (cb) => connector.onAuthStateChange(cb),
  };
}
