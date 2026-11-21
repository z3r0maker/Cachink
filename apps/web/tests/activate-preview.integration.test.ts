import assert from 'node:assert/strict';
import { randomBytes, randomInt, randomUUID } from 'node:crypto';
import { afterAll, beforeAll, it } from 'vitest';
import postgres from 'postgres';
import { newUlid } from '@xangarro/domain';
import { integrationSuite } from '@xangarro/testing/integration';

import { hashPairingToken, mintPairingToken } from '../src/lib/pairing-token';
import type * as DbModule from '../src/server/db';
import type * as PreviewRoute from '../src/app/api/v1/activate/preview/route';
import type * as ActivateRoute from '../src/app/api/v1/activate/route';

/**
 * `POST /api/v1/activate/preview` (N-25, SEC-MOB-04) on real Postgres: the
 * route, the shared door and throttle, and 0062's function, as the phone
 * calls them. The seed has no pairing token and no owner with a two-word
 * name, so this file builds a business, its owner and the tokens itself.
 */
const { url, describe } = integrationSuite();
const BIZ = newUlid();
const NOW = '2026-11-20T12:00:00.000Z';
/** A fresh caller per test, so one test's guesses never lock another's. */
const ip = () => `10.25.${randomInt(256)}.${randomInt(256)}`;

describe('POST /api/v1/activate/preview', () => {
  const env = { ...process.env };
  let su: postgres.Sql;
  let db: typeof DbModule;
  let preview: typeof PreviewRoute;
  let activate: typeof ActivateRoute;
  let ownerEmail = '';

  async function token(qrMinutes = 15): Promise<{ token: string; code: string }> {
    const t = mintPairingToken();
    const code = `N${randomBytes(4).toString('hex').toUpperCase()}`
      .replace(/[^A-HJ-NP-Z2-9]/g, 'K')
      .slice(0, 8)
      .padEnd(8, 'K');
    await su`
      INSERT INTO activation_codes (code, email, expires_at, business_id, qr_token_hash, qr_expires_at, created_at, updated_at)
      VALUES (${code}, 'admin@test.mx', now() + interval '2 days', ${BIZ}, ${hashPairingToken(t)},
              now() + make_interval(mins => ${qrMinutes}), ${NOW}, ${NOW})`;
    return { token: t, code };
  }

  const ask = (qrToken: unknown, from = ip(), protocol = true) =>
    preview.POST(
      new Request('http://x/api/v1/activate/preview', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-forwarded-for': from,
          ...(protocol ? { 'X-Xangarro-Protocol': '1' } : {}),
        },
        body: JSON.stringify({ qrToken }),
      }),
    );
  const errorOf = async (res: Response) =>
    ((await res.json()) as { error: { code: string } }).error.code;

  beforeAll(async () => {
    process.env.DATABASE_URL = url;
    su = postgres(process.env.DATABASE_SUPER_URL as string, { max: 1, onnotice: () => undefined });
    await su`
      INSERT INTO businesses (id, nombre, regimen_fiscal, isr_tasa, business_id, device_id, created_at, updated_at)
      VALUES (${BIZ}, 'Taquería Don Pedro', 'RESICO', 125, ${BIZ}, 'dev', ${NOW}, ${NOW})`;
    const owner = randomUUID();
    ownerEmail = `pedro-${owner.slice(0, 8)}@test.mx`;
    await su`
      INSERT INTO auth.users (id, email, raw_user_meta_data)
      VALUES (${owner}::uuid, ${ownerEmail}, ${su.json({ nombre: 'Pedro Ramírez' })})`;
    await su`
      INSERT INTO business_members (id, user_id, role, business_id, created_at, updated_at)
      VALUES (${`m-${owner}`}, ${owner}, 'owner', ${BIZ}, ${NOW}, ${NOW})`;
    db = await import('../src/server/db');
    preview = await import('../src/app/api/v1/activate/preview/route');
    activate = await import('../src/app/api/v1/activate/route');
  }, 30_000);

  afterAll(async () => {
    await db?.db().$client.end({ timeout: 5 });
    await su?.end({ timeout: 5 });
    process.env = env;
  });

  it('answers the business name and the owner, three fields and no more, and writes nothing', async () => {
    const { token: t, code } = await token();
    const before = await su`SELECT * FROM activation_codes WHERE code = ${code}`;
    const res = await ask(t);
    assert.equal(res.status, 200);
    assert.equal(res.headers.get('Cache-Control'), 'no-store');
    assert.deepEqual(await res.json(), {
      businessName: 'Taquería Don Pedro',
      ownerFirstName: 'Pedro',
      ownerEmail,
    });
    assert.deepEqual(await su`SELECT * FROM activation_codes WHERE code = ${code}`, before);
  });

  it('refuses a request without the protocol header before reading anything', async () => {
    const { token: t } = await token();
    const res = await ask(t, ip(), false);
    assert.equal(res.status, 426);
    assert.equal(await errorOf(res), 'PROTOCOL_UNSUPPORTED');
  });

  it('answers the redeem path’s refusals: expired, used, unknown, malformed', async () => {
    const { token: viejo } = await token(-1);
    assert.deepEqual([(await ask(viejo)).status], [410]);
    const { token: usado } = await token();
    await su`UPDATE activation_codes SET redeemed_at = now() WHERE qr_token_hash = ${hashPairingToken(usado)}`;
    const used = await ask(usado);
    assert.deepEqual([used.status, await errorOf(used)], [409, 'CODE_USED']);
    const unknown = await ask(mintPairingToken());
    assert.deepEqual([unknown.status, await errorOf(unknown)], [400, 'CODE_INVALID']);
    const malformed = await ask('nope');
    assert.deepEqual([malformed.status, await errorOf(malformed)], [400, 'CODE_INVALID']);
  });

  it('counts guesses on the redeem’s own throttle: five lock the caller out of both doors', async () => {
    const from = ip();
    const answers: number[] = [];
    for (let i = 0; i < 5; i += 1) answers.push((await ask(mintPairingToken(), from)).status);
    assert.deepEqual(answers, [400, 400, 400, 400, 429]);
    const { token: t } = await token();
    assert.equal((await ask(t, from)).status, 429, 'a good token waits out the lockout too');
    const redeem = await activate.POST(
      new Request('http://x/api/v1/activate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Xangarro-Protocol': '1',
          'x-forwarded-for': from,
        },
        body: JSON.stringify({ qrToken: t }),
      }),
    );
    assert.equal(redeem.status, 429, 'the preview spent the redeem’s budget');
    assert.ok(Number(redeem.headers.get('Retry-After')) > 0);
  });
});
