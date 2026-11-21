import assert from 'node:assert/strict';
import { createHash, randomBytes, randomUUID } from 'node:crypto';
import { afterAll, beforeAll, it } from 'vitest';
import postgres from 'postgres';

import { createDb, type Db } from '../src/client';
import { pairingPreviewOf, previewPairingToken } from '../src/queries/pairing-preview';
import { integrationSuite } from './support/db';
import { testId } from './support/test-ids';

/**
 * `0062_preview_pairing_token.sql` (N-25, SEC-MOB-04): «¿Es tu negocio?»
 * before a scan links. Runs as `xangarro_app` with no tenant claim, as
 * `/activate/preview` does. The seed has no QR token and no owner with a
 * two-word name, so this file builds both: a business with a viewer, two
 * owners and a live token, and a second business with no owner at all.
 */
const { url, describe } = integrationSuite();
const hashOf = (t: string) => createHash('sha256').update(t).digest('hex');
const mint = () => randomBytes(16).toString('base64url');
const NOW = '2026-11-20T12:00:00.000Z';

describe('preview_pairing_token (N-25)', () => {
  const biz = testId('P');
  const huerfano = testId('H');
  let app: postgres.Sql;
  let db: Db;
  let su: postgres.Sql;

  const code = () => `P${testId('K').slice(-7)}`.replace(/[0OIL1U]/g, 'X');
  async function token(business: string, qrMinutes = 15): Promise<{ token: string; code: string }> {
    const t = mint();
    const c = code();
    await su`
      INSERT INTO activation_codes (code, email, expires_at, business_id, qr_token_hash, qr_expires_at, created_at, updated_at)
      VALUES (${c}, 'admin@test.mx', now() + interval '2 days', ${business}, ${hashOf(t)},
              now() + make_interval(mins => ${qrMinutes}), ${NOW}, ${NOW})`;
    return { token: t, code: c };
  }
  async function member(business: string, role: string, nombre: string | null, at: string) {
    const id = randomUUID();
    await su`
      INSERT INTO auth.users (id, email, raw_user_meta_data)
      VALUES (${id}::uuid, ${`${role}-${id.slice(0, 8)}@test.mx`}, ${su.json(nombre === null ? {} : { nombre })})`;
    await su`
      INSERT INTO business_members (id, user_id, role, business_id, created_at, updated_at)
      VALUES (${`m-${randomUUID()}`}, ${id}, ${role}, ${business}, ${at}, ${at})`;
    return `${role}-${id.slice(0, 8)}@test.mx`;
  }
  const preview = (t: string) => previewPairingToken(db, hashOf(t));
  let ownerEmail = '';

  beforeAll(async () => {
    app = postgres(url as string, { max: 1, onnotice: () => undefined });
    db = createDb(url as string);
    su = postgres(process.env.DATABASE_SUPER_URL as string, { max: 1, onnotice: () => undefined });
    for (const [id, nombre] of [
      [biz, 'Taquería Don Pedro'],
      [huerfano, 'Sin Dueño SA'],
    ] as const) {
      await su`
        INSERT INTO businesses (id, nombre, regimen_fiscal, isr_tasa, business_id, device_id, created_at, updated_at)
        VALUES (${id}, ${nombre}, 'RESICO', 125, ${id}, 'dev', ${NOW}, ${NOW})`;
    }
    await member(biz, 'viewer', 'Contadora Ruiz', '2026-01-01T00:00:00Z');
    ownerEmail = await member(biz, 'owner', '  Pedro  Ramírez ', '2026-02-01T00:00:00Z');
    await member(biz, 'owner', 'Socio', '2026-03-01T00:00:00Z');
  });

  afterAll(async () => {
    await app?.end({ timeout: 5 });
    await db?.$client.end({ timeout: 5 });
    await su?.end({ timeout: 5 });
  });

  it("names the business and its earliest owner's first name and email, never a viewer's", async () => {
    const { token: t } = await token(biz);
    assert.deepEqual(await preview(t), {
      ok: true,
      businessName: 'Taquería Don Pedro',
      ownerFirstName: 'Pedro',
      ownerEmail,
    });
  });

  it('consumes nothing: the row is untouched and the token still redeems', async () => {
    const { token: t, code: c } = await token(biz);
    const before = await su`SELECT * FROM activation_codes WHERE code = ${c}`;
    await preview(t);
    await preview(t);
    const after = await su`SELECT * FROM activation_codes WHERE code = ${c}`;
    assert.deepEqual(after, before);
    const [r] = await app<{ outcome: string }[]>`
      SELECT outcome FROM xangarro.redeem_pairing_token(${hashOf(t)}, ${testId('D')})`;
    assert.equal(r?.outcome, 'OK');
    assert.deepEqual(await preview(t), { ok: false, refusal: 'CODE_USED' });
  });

  it('answers CODE_EXPIRED past the 15 minutes or once «Generar otro» expires the code', async () => {
    const { token: viejo } = await token(biz, -1);
    assert.deepEqual(await preview(viejo), { ok: false, refusal: 'CODE_EXPIRED' });
    const { token: t, code: c } = await token(biz);
    await su`UPDATE activation_codes SET expires_at = now() WHERE code = ${c}`;
    assert.deepEqual(await preview(t), { ok: false, refusal: 'CODE_EXPIRED' });
  });

  it('answers CODE_INVALID for a token nobody minted', async () => {
    assert.deepEqual(await preview(mint()), { ok: false, refusal: 'CODE_INVALID' });
  });

  it('answers BUSINESS_SUSPENDED for an archived business, before used or expired', async () => {
    const { token: t } = await token(biz, -1);
    await su`UPDATE businesses SET deleted_at = now() WHERE id = ${biz}`;
    try {
      assert.deepEqual(await preview(t), { ok: false, refusal: 'BUSINESS_SUSPENDED' });
    } finally {
      await su`UPDATE businesses SET deleted_at = NULL WHERE id = ${biz}`;
    }
  });

  it('names a business with no owner account by its name alone', async () => {
    const { token: t } = await token(huerfano);
    assert.deepEqual(await preview(t), {
      ok: true,
      businessName: 'Sin Dueño SA',
      ownerFirstName: null,
      ownerEmail: null,
    });
  });

  it('is not callable by PUBLIC: only the app role may ask', async () => {
    const [row] = await su<{ ok: boolean }[]>`
      SELECT has_function_privilege('public', 'xangarro.preview_pairing_token(text)', 'EXECUTE') AS ok`;
    assert.equal(row?.ok, false);
  });
});

describe('pairingPreviewOf: the row is parsed, not asserted', () => {
  it('reads an unknown outcome or a missing row as CODE_INVALID', () => {
    assert.deepEqual(pairingPreviewOf(undefined), { ok: false, refusal: 'CODE_INVALID' });
    const raro = { outcome: 'WAT', business_name: null, owner_first_name: null, owner_email: null };
    assert.deepEqual(pairingPreviewOf(raro), { ok: false, refusal: 'CODE_INVALID' });
  });

  it('refuses an OK row without a business name rather than inventing one', () => {
    const vacio = {
      outcome: 'OK',
      business_name: '',
      owner_first_name: 'A',
      owner_email: 'a@b.mx',
    };
    assert.deepEqual(pairingPreviewOf(vacio), { ok: false, refusal: 'CODE_INVALID' });
  });
});
