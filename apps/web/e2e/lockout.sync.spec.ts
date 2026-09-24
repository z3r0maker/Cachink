import { expect, test } from './test';
import { deviceHeaders } from '@xangarro/contracts';

import { asTenant, BIZ } from './sync-phone';

/**
 * `/activate` lockout (B-17, audit SEC-DEV-01). In the `sync` project, after
 * every viewport; it never activates a phone, so it cannot compete with
 * sync.spec for Taquería's device slots. Its own `x-forwarded-for` keeps the
 * lock it earns away from everything else.
 */
test('guessing activation codes locks the caller out before any device token', async ({
  request,
}) => {
  const from = { ...deviceHeaders(), 'x-forwarded-for': `198.51.100.${Date.now() % 250}` };
  const attempt = (code: string) =>
    request.post('/api/v1/activate', {
      headers: from,
      data: {
        email: 'pedro@taqueria.mx',
        code,
        device: { name: 'x', platform: 'android', appVersion: '0.1.0', osVersion: '15' },
      },
    });
  const statuses = [];
  for (const guess of ['ZZZZZZZ2', 'ZZZZZZZ3', 'ZZZZZZZ4', 'ZZZZZZZ5', 'ZZZZZZZ6']) {
    statuses.push((await attempt(guess)).status());
  }
  expect(statuses).toEqual([400, 400, 400, 400, 429]);

  // Locked means locked: even a real code is refused from here, and stays unspent.
  await asTenant(
    BIZ,
    (sql) => sql`
      INSERT INTO activation_codes (code, email, expires_at, business_id, created_at, updated_at)
      VALUES ('SYNCLCK2', 'pedro@taqueria.mx', now() + interval '1 hour', ${BIZ}, now(), now())
      ON CONFLICT (code) DO UPDATE SET redeemed_at = NULL, expires_at = EXCLUDED.expires_at`,
  );
  expect((await attempt('SYNCLCK2')).status()).toBe(429);
  const [code] = await asTenant(
    BIZ,
    (sql) => sql`SELECT redeemed_at FROM activation_codes WHERE code = 'SYNCLCK2'`,
  );
  expect(code?.redeemed_at).toBeNull();
});
