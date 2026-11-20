import { DEV_KEYS } from '@xangarro/contracts/mock';

/**
 * What a local, database-backed portal server is started with: the one recipe
 * the portal's Playwright config and Synth's corrida stack (S-04) both use, so
 * the two never drift apart on a variable a screen needs.
 *
 * It reads nothing from the environment itself. The caller passes the URLs and
 * the clock; the fallbacks below are the published test values, never anything
 * that works against production.
 */
export interface PortalEnvInput {
  readonly databaseUrl: string;
  readonly superDatabaseUrl: string;
  readonly billingDatabaseUrl: string;
  /** The business's today, `YYYY-MM-DD` (`src/server/clock.ts`). */
  readonly today: string;
  /** `/activate` signs a device token with this; defaults to a test-only value. */
  readonly deviceTokenSecret?: string | undefined;
  /** The entitlement key; defaults to the contract's published TEST key. */
  readonly entitlementPrivateKey?: string | undefined;
  /** Seals the TOTP seeds the second-factor flows enrol; defaults to 32 zero bytes. */
  readonly totpKey?: string | undefined;
  readonly poolMax?: string | undefined;
  readonly exportsPerTenant?: string | undefined;
}

/** The contract's published TEST entitlement key: never a production fallback. */
export const TEST_ENTITLEMENT_KEY: string = DEV_KEYS.privateHex;

/** The TOTP sealing key a test server uses unless one is given. */
export const TEST_TOTP_KEY = Buffer.alloc(32).toString('base64');

export function portalServerEnv(i: PortalEnvInput): Record<string, string> {
  return {
    DATABASE_URL: i.databaseUrl,
    DATABASE_SUPER_URL: i.superDatabaseUrl,
    BILLING_DATABASE_URL: i.billingDatabaseUrl,
    // The business's today (server/clock.ts).
    PORTAL_TODAY: i.today,
    // The local build keeps the dev galleries (/inventario) for visual.spec;
    // any other production build answers 404 there.
    DEV_PAGES: '1',
    // /activate signs a device token and an entitlement. The portal has no
    // default for either on purpose (server/device/credentials.ts).
    DEVICE_TOKEN_SECRET: i.deviceTokenSecret ?? 'e2e-only-not-a-real-secret',
    ENTITLEMENT_PRIVATE_KEY: i.entitlementPrivateKey ?? TEST_ENTITLEMENT_KEY,
    PORTAL_TOTP_KEY: i.totpKey ?? TEST_TOTP_KEY,
    // One long-lived server for every worker, not a serverless instance:
    // it keeps the pool it had before `createDb` defaulted to 2 (DB2-CONN-01).
    DATABASE_POOL_MAX: i.poolMax ?? '5',
    // A suite exports one tenant many times inside ten minutes; production's
    // five-per-ten-minutes would 429 it (DB3-EXP-01).
    EXPORTS_PER_TENANT: i.exportsPerTenant ?? '1000',
  };
}
