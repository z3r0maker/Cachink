import { portalServerEnv } from '@xangarro/testing/tenant';

import type { StackNames } from './names';

/** The three database URLs `db-local.sh` prints for a corrida's container. */
export interface DbUrls {
  readonly database: string;
  readonly superUser: string;
  readonly billing: string;
}

/**
 * The corrida's portal: the recipe the e2e suite uses (`portalServerEnv`), on
 * this corrida's database, build and outbox. CFDI is off and no Stripe, Resend
 * or Don Cuentas key is set, so the server talks to nothing outside the
 * machine (ENV.md §7).
 */
export function stackServerEnv(
  urls: DbUrls,
  today: string,
  names: StackNames,
): Record<string, string> {
  return {
    ...portalServerEnv({
      databaseUrl: urls.database,
      superDatabaseUrl: urls.superUser,
      billingDatabaseUrl: urls.billing,
      today,
    }),
    NEXT_DIST_DIR: names.distDir,
    EMAIL_OUTBOX_DIR: names.outboxDir,
    CFDI_MODE: 'off',
  };
}
