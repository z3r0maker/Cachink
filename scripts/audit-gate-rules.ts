/**
 * The audit gate's rule (SEC-SUP-01, N-26), pure so it can be tested on
 * fixtures. A high or critical advisory fails CI unless **every** path to it
 * is a route that never ships to users, or a reviewed allowlist entry covers
 * it until its `reviewBy` date.
 */

export interface Finding {
  readonly ghsa: string;
  readonly module: string;
  readonly severity: string;
  readonly paths: readonly string[];
}

export interface AllowEntry {
  readonly ghsa: string;
  readonly reason: string;
  /** YYYY-MM-DD; after it the entry no longer excuses anything. */
  readonly reviewBy: string;
}

/**
 * Routes pnpm reports as production that never reach a user's runtime, each
 * with why. A path is excused only if it matches one of these.
 */
export const BUILD_ONLY_ROUTES: readonly { readonly pattern: RegExp; readonly why: string }[] = [
  {
    pattern: />drizzle-orm>expo-sqlite>/,
    why: "drizzle-orm's optional expo-sqlite peer, linked because apps/mobile is in the workspace; only the phone imports it, and there it is the SQLite binding, not the Expo CLI below it",
  },
  { pattern: /^packages__config>/, why: 'lint and test tooling (eslint plugins, the vitest peer)' },
  { pattern: />@sentry\/cli>/, why: 'the Sentry CLI uploads source maps at build time' },
  { pattern: />@expo\/cli>/, why: 'the Expo CLI builds and serves the app; it is not bundled' },
];

const BLOCKING = new Set(['high', 'critical']);

export function isBuildOnly(path: string): boolean {
  return BUILD_ONLY_ROUTES.some((r) => r.pattern.test(path));
}

/** Findings that fail the gate. */
export function blocking(
  findings: readonly Finding[],
  allow: readonly AllowEntry[],
  today: string,
): Finding[] {
  const live = new Set(allow.filter((a) => a.reviewBy >= today).map((a) => a.ghsa));
  return findings.filter(
    (f) =>
      BLOCKING.has(f.severity) &&
      !live.has(f.ghsa) &&
      !(f.paths.length > 0 && f.paths.every(isBuildOnly)),
  );
}

interface AuditJson {
  readonly advisories?: Record<
    string,
    {
      readonly github_advisory_id?: string;
      readonly module_name: string;
      readonly severity: string;
      readonly findings?: readonly { readonly paths?: readonly string[] }[];
    }
  >;
}

/** `pnpm audit --json` → findings. */
export function findingsOf(audit: AuditJson): Finding[] {
  return Object.values(audit.advisories ?? {}).map((a) => ({
    ghsa: a.github_advisory_id ?? '',
    module: a.module_name,
    severity: a.severity,
    paths: (a.findings ?? []).flatMap((f) => f.paths ?? []),
  }));
}
