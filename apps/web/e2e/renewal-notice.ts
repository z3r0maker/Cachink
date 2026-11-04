import { createHash, randomBytes } from 'node:crypto';

import postgres from 'postgres';

import { billingDatabaseUrl } from './db-url';
import { subscriptionIdOf, type Tenant } from './tenant';

/**
 * A renewal reminder's link for a minted tenant (LFPC 76 Bis): the row the
 * cron would write for the tenant's subscription, and the token its email
 * would carry. Only the token's SHA-256 is stored, as in production.
 */
export async function renewalLink(t: Tenant): Promise<string> {
  const token = randomBytes(32).toString('base64url');
  const hash = createHash('sha256').update(token).digest('hex');
  const sql = postgres(billingDatabaseUrl(), { max: 1, onnotice: () => undefined });
  try {
    await sql`
      INSERT INTO billing_renewal_notices
        (stripe_subscription_id, period_end, business_id, token_hash, sent_at)
      SELECT stripe_subscription_id, current_period_end, business_id, ${hash}, now()
        FROM subscriptions WHERE stripe_subscription_id = ${subscriptionIdOf(t)}`;
  } finally {
    await sql.end({ timeout: 5 });
  }
  return token;
}
