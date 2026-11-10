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

/**
 * The audit could not be read, so the gate cannot say the tree is clean. A
 * registry error body (`{"error": …}`), a missing `advisories` map or an
 * advisory with no name all land here: an unreadable audit fails the build
 * rather than passing as zero findings.
 */
export class AuditUnreadableError extends Error {
  readonly code = 'AUDIT_UNREADABLE';
  constructor(why: string) {
    super(`pnpm audit output is not readable: ${why}`);
    this.name = 'AuditUnreadableError';
  }
}

type Json = Record<string, unknown>;

const isObject = (v: unknown): v is Json =>
  typeof v === 'object' && v !== null && !Array.isArray(v);

function pathsOf(advisory: Json): string[] {
  const findings: readonly unknown[] = Array.isArray(advisory.findings) ? advisory.findings : [];
  return findings.flatMap((f) =>
    isObject(f) && Array.isArray(f.paths)
      ? f.paths.filter((p): p is string => typeof p === 'string')
      : [],
  );
}

function findingOf(key: string, advisory: unknown): Finding {
  if (!isObject(advisory)) throw new AuditUnreadableError(`advisory ${key} is not an object`);
  const { module_name: module, severity, github_advisory_id: ghsa } = advisory;
  if (typeof module !== 'string' || typeof severity !== 'string') {
    throw new AuditUnreadableError(`advisory ${key} has no module name or severity`);
  }
  return { ghsa: typeof ghsa === 'string' ? ghsa : '', module, severity, paths: pathsOf(advisory) };
}

/** `pnpm audit --json` → findings. Parsed, never assumed: see {@link AuditUnreadableError}. */
export function findingsOf(audit: unknown): Finding[] {
  if (!isObject(audit)) throw new AuditUnreadableError('not a JSON object');
  if ('error' in audit) throw new AuditUnreadableError('pnpm reported an error, not a result');
  if (!isObject(audit.advisories)) throw new AuditUnreadableError('no advisories map');
  return Object.entries(audit.advisories).map(([key, a]) => findingOf(key, a));
}
