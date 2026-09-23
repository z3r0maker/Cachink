import assert from 'node:assert/strict';
import { createHash, randomBytes } from 'node:crypto';
import { afterAll, beforeAll, it } from 'vitest';
import postgres from 'postgres';

import { integrationSuite } from './support/db';
import { testId } from './support/test-ids';

/**
 * `0038_pairing_token.sql` (C-14): the scan path's atomic claim. Runs as
 * `xangarro_app`, the role `POST /activate` uses. The token is minted and
 * hashed here exactly as the portal does (`lib/pairing-token.ts`).
 */
const { url, describe } = integrationSuite();
const hashOf = (t: string) => createHash('sha256').update(t).digest('hex');
const mint = () => randomBytes(16).toString('base64url');
const NOW = '2026-09-23T12:00:00.000Z';

describe('redeem_pairing_token (C-14)', () => {
  const biz = testId('Q');
  let app: postgres.Sql;
  /** Redeem-only pool: the function is SECURITY DEFINER and needs no tenant, so two connections can race. */
  let door: postgres.Sql;
  let owner: postgres.Sql;

  const code = () => `Q${testId('K').slice(-7)}`.replace(/[0OIL1U]/g, 'X');
  async function row(qrMinutes: number): Promise<{ token: string; code: string }> {
    const token = mint();
    const c = code();
    await app`
      INSERT INTO activation_codes (code, email, expires_at, business_id, qr_token_hash, qr_expires_at, created_at, updated_at)
      VALUES (${c}, 'qr@test.mx', now() + interval '2 days', ${biz}, ${hashOf(token)},
              now() + make_interval(mins => ${qrMinutes}), now(), now())`;
    return { token, code: c };
  }
  const redeem = (token: string) =>
    door<{ outcome: string; business_id: string | null }[]>`
      SELECT outcome, business_id FROM xangarro.redeem_pairing_token(${hashOf(token)}, ${testId('D')})`;

  beforeAll(async () => {
    app = postgres(url as string, { max: 1, onnotice: () => undefined });
    door = postgres(url as string, { max: 2, onnotice: () => undefined });
    owner = postgres(process.env.DATABASE_SUPER_URL as string, {
      max: 1,
      onnotice: () => undefined,
    });
    await app`SELECT set_config('xangarro.business_id', ${biz}, false)`;
    await app`
      INSERT INTO businesses (id, nombre, regimen_fiscal, isr_tasa, business_id, device_id, created_at, updated_at)
      VALUES (${biz}, 'QR SA', 'RESICO', 125, ${biz}, 'dev', ${NOW}, ${NOW})`;
  });

  afterAll(async () => {
    await app?.end({ timeout: 5 });
    await door?.end({ timeout: 5 });
    await owner?.end({ timeout: 5 });
  });

  it('claims a live token and consumes the whole row, typed code included', async () => {
    const { token, code: c } = await row(15);
    const [r] = await redeem(token);
    assert.deepEqual(r, { outcome: 'OK', business_id: biz });
    const [again] = await redeem(token);
    assert.equal(again?.outcome, 'CODE_USED');
    const [typed] = await app<{ outcome: string }[]>`
      SELECT outcome FROM xangarro.redeem_activation_code(${c}, 'qr@test.mx', ${testId('D')})`;
    assert.equal(
      typed?.outcome,
      'CODE_USED',
      'one row, one pairing — whichever path redeems first',
    );
  });

  it('lets exactly one of two concurrent scans win', async () => {
    const { token } = await row(15);
    const outcomes = (await Promise.all([redeem(token), redeem(token)])).map((r) => r[0]?.outcome);
    assert.deepEqual(outcomes.sort(), ['CODE_USED', 'OK']);
  });

  it('answers CODE_EXPIRED once the 15 minutes pass, and CODE_INVALID for a token nobody minted', async () => {
    const { token } = await row(-1);
    assert.equal((await redeem(token))[0]?.outcome, 'CODE_EXPIRED');
    assert.equal((await redeem(mint()))[0]?.outcome, 'CODE_INVALID');
  });

  it('refuses an archived business without consuming the token', async () => {
    const { token } = await row(15);
    await owner`UPDATE businesses SET deleted_at = now() WHERE id = ${biz}`;
    try {
      assert.equal((await redeem(token))[0]?.outcome, 'BUSINESS_SUSPENDED');
    } finally {
      await owner`UPDATE businesses SET deleted_at = NULL WHERE id = ${biz}`;
    }
    assert.equal((await redeem(token))[0]?.outcome, 'OK', 'restored: the same token still works');
  });

  it('dies with its code — «Generar otro» expiring the row kills the QR too', async () => {
    const { token, code: c } = await row(15);
    await app`UPDATE activation_codes SET expires_at = now() WHERE code = ${c}`;
    assert.equal((await redeem(token))[0]?.outcome, 'CODE_EXPIRED');
  });
});
