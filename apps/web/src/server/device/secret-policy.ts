import { createHash } from 'node:crypto';

/**
 * What a signing secret must look like in production (audit F-06, SEC-SEC-02).
 *
 * The portal's secrets were accepted at any length, and this repository
 * publishes the values its local, CI and conformance runs use — including an
 * Ed25519 private key that is RFC 8032's first test vector. Production signing
 * with any of them means anyone can mint a device token or an entitlement.
 *
 * **Gated on `VERCEL_ENV=production`**, which only Vercel's production
 * deployment sets. CI and the conformance run start the portal with
 * `NODE_ENV=production` and the dev values on purpose; they, previews and
 * local runs are left exactly as they were.
 *
 * - `DEVICE_TOKEN_SECRET`, `DEVICE_TOKEN_SECRET_PREVIOUS`, `CRON_SECRET`: at
 *   least 32 characters, and none of the published placeholders. The docs
 *   generate them with `openssl rand -base64 32` — 44 characters.
 * - `ENTITLEMENT_PRIVATE_KEY`: 64 hex characters (`entitlement:keygen`), and
 *   not the published test key.
 *
 * An error names the variable and the rule. It never carries the value.
 */
export type SecretName =
  | 'DEVICE_TOKEN_SECRET'
  | 'DEVICE_TOKEN_SECRET_PREVIOUS'
  | 'CRON_SECRET'
  | 'ENTITLEMENT_PRIVATE_KEY';

export type SecretRule = 'MIN_LENGTH' | 'PUBLISHED_VALUE' | 'ED25519_HEX';

export const MIN_SECRET_LENGTH = 32;

const RULES: Readonly<Record<SecretRule, string>> = {
  MIN_LENGTH: `must be at least ${MIN_SECRET_LENGTH} characters`,
  PUBLISHED_VALUE: 'must not be a development value published in the repository',
  ED25519_HEX: 'must be 64 hexadecimal characters',
};

export class SecretPolicyError extends Error {
  readonly code = 'SECRET_POLICY' as const;

  constructor(
    readonly variable: SecretName,
    readonly rule: SecretRule,
  ) {
    super(`${variable} ${RULES[rule]} when VERCEL_ENV=production.`);
    this.name = 'SecretPolicyError';
  }
}

/**
 * The placeholders the repository uses: `dev-only-not-a-real-secret`,
 * `ci-only-…`, `e2e-only-…`, `conformance-only` (`.gitleaks.toml` allows the
 * same family), and anything that says it is not a real secret.
 */
const PUBLISHED_PLACEHOLDERS = [
  /not-a-real-secret/i,
  /^(dev|ci|e2e|cron|test|conformance)-only/i,
] as const;

/**
 * SHA-256 of the published test vector's lowercase hex
 * (`packages/contracts/src/mock/dev-keys.json`), so this file does not carry
 * the vector itself; `tests/secret-policy.test.ts` holds the two together.
 */
const PUBLISHED_ED25519_SHA256 = '099da475a54aacbacabde231639eed7b00b0a9359cddd2598004bd8b8ad23237';

const sha256 = (text: string) => createHash('sha256').update(text, 'utf8').digest('hex');

function sharedSecretProblem(value: string): SecretRule | null {
  if (PUBLISHED_PLACEHOLDERS.some((p) => p.test(value))) return 'PUBLISHED_VALUE';
  return value.length < MIN_SECRET_LENGTH ? 'MIN_LENGTH' : null;
}

function entitlementKeyProblem(value: string): SecretRule | null {
  if (!/^[0-9a-f]{64}$/i.test(value)) return 'ED25519_HEX';
  return sha256(value.toLowerCase()) === PUBLISHED_ED25519_SHA256 ? 'PUBLISHED_VALUE' : null;
}

type Env = Readonly<Record<string, string | undefined>>;

/** The rule `value` breaks as `name` in this environment, or null. Always null outside production. */
export function secretProblem(
  name: SecretName,
  value: string,
  env: Env = process.env,
): SecretRule | null {
  if (env.VERCEL_ENV !== 'production') return null;
  return name === 'ENTITLEMENT_PRIVATE_KEY'
    ? entitlementKeyProblem(value)
    : sharedSecretProblem(value);
}

/** Throws `SecretPolicyError` when `value` may not be used as `name` here. */
export function assertSecretPolicy(name: SecretName, value: string, env: Env = process.env): void {
  const rule = secretProblem(name, value, env);
  if (rule !== null) throw new SecretPolicyError(name, rule);
}
