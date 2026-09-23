import assert from 'node:assert/strict';
import { afterAll, beforeAll, it } from 'vitest';
import postgres from 'postgres';

import { integrationSuite } from './support/db';
import { testId } from './support/test-ids';

/**
 * `0037_redeem_refuses_archived.sql` (B-07): a code for an archived business
 * answers `BUSINESS_SUSPENDED` and is not consumed; the contract's precedence
 * (email before anything about the business) holds; a restored business
 * redeems the same code. Runs as `xangarro_app`, the role `POST /activate`
 * uses; the archive itself is the tenant's own `business_archive()` call.
 */
const NOW = '2026-09-23T12:00:00.000Z';
const { url, describe } = integrationSuite();

describe('redeem_activation_code refuses an archived business (B-07)', () => {
  const biz = testId('R');
  const code = `R${testId('C').slice(-7)}`.replace(/[0OIL1U]/g, 'X');
  const email = `owner-${biz.slice(-6).toLowerCase()}@archivado.test.mx`;
  let app: postgres.Sql;
  let owner: postgres.Sql;

  const redeem = (mail: string) =>
    app<{ outcome: string; business_id: string | null }[]>`
      SELECT outcome, business_id FROM xangarro.redeem_activation_code(${code}, ${mail}, ${testId('D')})`;

  beforeAll(async () => {
    app = postgres(url as string, { max: 1, onnotice: () => undefined });
    owner = postgres(process.env.DATABASE_SUPER_URL as string, {
      max: 1,
      onnotice: () => undefined,
    });
    await app`SELECT set_config('xangarro.business_id', ${biz}, false)`;
    await app`
      INSERT INTO businesses (id, nombre, regimen_fiscal, isr_tasa, business_id, device_id, created_at, updated_at)
      VALUES (${biz}, 'Archivado SA', 'RESICO', 125, ${biz}, 'dev', ${NOW}, ${NOW})`;
    await app`
      INSERT INTO activation_codes (code, email, expires_at, business_id, created_at, updated_at)
      VALUES (${code}, ${email}, now() + interval '1 day', ${biz}, now(), now())`;
    // The tenant archives itself, exactly as the portal's «Archivar negocio» does.
    await app`SELECT xangarro.business_archive()`;
  });

  afterAll(async () => {
    await app?.end({ timeout: 5 });
    await owner?.end({ timeout: 5 });
  });

  it('answers BUSINESS_SUSPENDED and leaves the code unredeemed', async () => {
    const [r] = await redeem(email);
    assert.equal(r?.outcome, 'BUSINESS_SUSPENDED');
    assert.equal(r?.business_id, null);
    const [c] = await owner<{ redeemed_at: string | null }[]>`
      SELECT redeemed_at FROM activation_codes WHERE code = ${code}`;
    assert.equal(c?.redeemed_at, null, 'a refused claim must not burn the code');
  });

  it('still says EMAIL_MISMATCH first — the archive is not disclosed to a stranger', async () => {
    const [r] = await redeem('alguien@otro.test.mx');
    assert.equal(r?.outcome, 'EMAIL_MISMATCH');
  });

  it('redeems the same code once support restores the business', async () => {
    await owner`UPDATE businesses SET deleted_at = NULL WHERE id = ${biz}`;
    const [r] = await redeem(email);
    assert.equal(r?.outcome, 'OK');
    assert.equal(r?.business_id, biz);
    const [again] = await redeem(email);
    assert.equal(again?.outcome, 'CODE_USED', 'single use is unchanged');
  });
});
