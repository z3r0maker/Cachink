/**
 * What a release build's configuration must satisfy (audit F-15d). Pure: the
 * values come in as arguments, and two callers read the answer.
 *
 * - `production` rules, at build time: `apps/mobile/scripts/
 *   check-release-config.mjs` runs them on an EAS production build and fails
 *   it. An https API base, a 64-hex public key, and never the dev key.
 * - `runnable` rules, when the app starts (`resolveRuntimeConfig`): the least
 *   any release build needs. A missing value is reported, so it never turns
 *   into the local mock's address or a key that verifies nothing (the free
 *   plan) without a word. Plain http and the dev key pass here, so a local
 *   Release build can still be pointed at the mock.
 *
 * This file imports nothing, on purpose: the build gate loads it with Node.
 */

/**
 * DEV ONLY: the contracts mock's signing key
 * (`packages/contracts/src/mock/dev-keys.json`). It is RFC 8032 test vector
 * 1, so its private half is public too.
 */
export const DEV_ENTITLEMENT_PUBLIC_KEY_HEX =
  'd75a980182b10ab7d54bfed3c964073a0ee172f3daa62325af021a68f707511a';

export type ReleaseConfigProblemCode =
  | 'API_BASE_MISSING'
  | 'API_BASE_NOT_HTTPS'
  | 'API_BASE_INVALID'
  | 'PUBKEY_MALFORMED'
  | 'PUBKEY_IS_DEV_KEY';

export type ReleaseConfigField = 'apiBase' | 'entitlementPublicKeyHex';

export interface ReleaseConfigProblem {
  readonly code: ReleaseConfigProblemCode;
  readonly field: ReleaseConfigField;
  /** For the build log and the error report; never shown to an operator. */
  readonly message: string;
}

export interface ReleaseConfigInput {
  readonly apiBase: string | undefined;
  readonly entitlementPublicKeyHex: string | undefined;
}

export type ReleaseRules = 'production' | 'runnable';

/** `$PRODUCTION_API_BASE` and the like: eas.json hands `env` values over as written. */
function asRead(value: string): string {
  const unfilled = value.startsWith('$') ? ', a placeholder that was never filled in' : '';
  return ` It reads "${value}"${unfilled}.`;
}

function apiBaseProblem(raw: string | undefined, rules: ReleaseRules): ReleaseConfigProblem | null {
  const value = raw?.trim() ?? '';
  const field = 'apiBase' as const;
  if (value === '') return { code: 'API_BASE_MISSING', field, message: 'The API base is not set.' };
  if (/^https:\/\/\S+$/i.test(value)) return null;
  if (rules === 'production') {
    const message = `The API base must start with https://.${asRead(value)}`;
    return { code: 'API_BASE_NOT_HTTPS', field, message };
  }
  if (/^http:\/\/\S+$/i.test(value)) return null;
  const message = `The API base is not an http(s) URL.${asRead(value)}`;
  return { code: 'API_BASE_INVALID', field, message };
}

function publicKeyProblem(
  raw: string | undefined,
  rules: ReleaseRules,
): ReleaseConfigProblem | null {
  const value = raw?.trim() ?? '';
  const field = 'entitlementPublicKeyHex' as const;
  if (!/^[0-9a-f]{64}$/i.test(value)) {
    const found = value === '' ? ' It is not set.' : asRead(value);
    const message = `The entitlement public key must be 64 hex characters.${found}`;
    return { code: 'PUBKEY_MALFORMED', field, message };
  }
  if (rules === 'production' && value.toLowerCase() === DEV_ENTITLEMENT_PUBLIC_KEY_HEX) {
    const message =
      'The entitlement public key is the published dev key (RFC 8032 test vector 1): anyone can sign a plan for it.';
    return { code: 'PUBKEY_IS_DEV_KEY', field, message };
  }
  return null;
}

/** Every problem at once, the API base first; empty when the configuration stands. */
export function releaseConfigProblems(
  input: ReleaseConfigInput,
  rules: ReleaseRules = 'production',
): readonly ReleaseConfigProblem[] {
  const found = [
    apiBaseProblem(input.apiBase, rules),
    publicKeyProblem(input.entitlementPublicKeyHex, rules),
  ];
  return found.filter((p): p is ReleaseConfigProblem => p !== null);
}

export interface RuntimeConfigInput extends ReleaseConfigInput {
  /** Metro's `__DEV__`. */
  readonly isDev: boolean;
  /** The local contracts mock: a development default, never a release one. */
  readonly devApiBase: string;
}

export interface RuntimeConfig {
  readonly apiBase: string;
  readonly entitlementPublicKeyHex: string;
  /** Why this release build cannot link a device; empty in development. */
  readonly problems: readonly ReleaseConfigProblem[];
}

/**
 * The configuration the app runs with. Development falls back to the mock
 * and its key. A release build never falls back: an unusable value becomes
 * the empty string and a problem, which activation shows instead of trying.
 */
export function resolveRuntimeConfig(input: RuntimeConfigInput): RuntimeConfig {
  if (input.isDev) {
    return {
      apiBase: input.apiBase ?? input.devApiBase,
      entitlementPublicKeyHex: input.entitlementPublicKeyHex ?? DEV_ENTITLEMENT_PUBLIC_KEY_HEX,
      problems: [],
    };
  }
  const problems = releaseConfigProblems(input, 'runnable');
  const unusable = new Set(problems.map((p) => p.field));
  const kept = (field: ReleaseConfigField, value: string | undefined): string =>
    unusable.has(field) ? '' : (value?.trim() ?? '');
  return {
    apiBase: kept('apiBase', input.apiBase),
    entitlementPublicKeyHex: kept('entitlementPublicKeyHex', input.entitlementPublicKeyHex),
    problems,
  };
}
