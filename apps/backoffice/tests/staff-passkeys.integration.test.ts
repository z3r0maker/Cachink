import assert from 'node:assert/strict';
import { randomBytes } from 'node:crypto';

import { hashToken, mintToken, type NewPasskey } from '@xangarro/auth-core';
import { createDb, type Db } from '@xangarro/data-pg';
import { integrationSuite } from '@xangarro/testing/integration';
import { sql } from 'drizzle-orm';
import postgres from 'postgres';
import { afterAll, beforeAll, it } from 'vitest';

import { staffChallengeStore } from '@/server/db/staff-challenges';
import { staffLinkRepo } from '@/server/db/staff-links';
import { staffPasskeyRepo } from '@/server/db/staff-passkeys';
import { staffSessionStore } from '@/server/db/staff-sessions';
import type { StaffMemberId } from '@xangarro/domain';

import { mintEnrolmentLink, resetPasskeys } from '../scripts/staff-links';

/**
 * The passkey adapters (0023, ADR-160) against a real Postgres, as the
 * console's own `xangarro_admin` role — so the grants and RLS are what is
 * tested, not just the SQL. Rows the seed never has are built here: a member
 * with the old password and TOTP columns and a pre-passkey session (the
 * old → new case, CLAUDE.md §2.9), links in each state, two passkeys.
 *
 * Needs the admin migrations on top of data-pg's (`test:e2e:db`, or CI's
 * backoffice-e2e job, which runs this with REQUIRE_DB=1).
 */
const { url, describe } = integrationSuite();
const SUPER = process.env.DATABASE_SUPER_URL ?? '';

const id = (prefix: string) =>
  `${prefix}${randomBytes(12).toString('hex').toUpperCase()}`.slice(0, 26);

function passkey(): NewPasskey {
  return {
    id: randomBytes(16).toString('base64url'),
    publicKey: new Uint8Array(randomBytes(77)),
    counter: 0,
    transports: ['internal', 'hybrid'],
    aaguid: 'fbfc3007-154e-4ecc-8c0b-6e020557d7bd',
    backedUp: true,
  };
}

describe('staff passkeys in Postgres (0023)', () => {
  const staffId = id('01E2PK') as StaffMemberId;
  let owner: postgres.Sql;
  let ownerDb: Db;
  let admin: Db;

  beforeAll(async () => {
    owner = postgres(SUPER, { max: 1, onnotice: () => undefined });
    ownerDb = createDb(SUPER);
    admin = createDb(url as string);
    // A member as release 0 left them: a password hash and an enrolled TOTP.
    await owner`
      INSERT INTO staff_members (id, email, nombre, created_at, password_hash, totp_secret_enc, totp_enrolled_at)
      VALUES (${staffId}, ${`${staffId.toLowerCase()}@gmail.com`}, 'Integración', now(),
              '$2a$10$abcdefghijklmnopqrstuuJ8GvB0p2vYQ4Gm9S0yv0wq7c3qfJ5Wm', 'sealed', now())`;
  });

  afterAll(async () => {
    await owner`DELETE FROM staff_sessions WHERE staff_id = ${staffId}`;
    await owner`DELETE FROM staff_audit_log WHERE staff_id = ${staffId}`;
    await owner`DELETE FROM staff_enrolment_links WHERE staff_id = ${staffId}`;
    await owner`DELETE FROM staff_passkeys WHERE staff_id = ${staffId}`;
    await owner`DELETE FROM staff_members WHERE id = ${staffId}`;
    await owner.end({ timeout: 5 });
  });

  it('never resolves a session opened before passkeys', async () => {
    const token = mintToken();
    await owner`
      INSERT INTO staff_sessions (token_hash, staff_id, aal, expires_at)
      VALUES (${hashToken(token)}, ${staffId}, 'aal2', now() + interval '1 hour')`;
    assert.equal(await staffSessionStore(admin).resolve(hashToken(token), 1800), null);
  });

  it('spends a printed link once, storing its passkey in the same transaction', async () => {
    const token = await mintEnrolmentLink(ownerDb, staffId);
    const links = staffLinkRepo(admin);
    const record = await links.find(hashToken(token));
    assert.equal(record?.staffId, staffId);
    assert.equal(record?.dead, false);
    assert.ok(record && record.expiresAt.getTime() > Date.now() + 14 * 60_000);

    const first = passkey();
    assert.equal(await links.spend(hashToken(token), first, 'Llavero de iCloud'), staffId);
    assert.equal(await links.spend(hashToken(token), passkey(), 'Otra'), null);
    const stored = await staffPasskeyRepo(admin).find(first.id);
    assert.equal(stored?.ownerId, staffId);
    assert.deepEqual(Buffer.from(stored?.publicKey ?? []), Buffer.from(first.publicKey));
    assert.deepEqual(stored?.transports, ['internal', 'hybrid']);
  });

  it('voids the last link when a new one is minted, and never spends an expired one', async () => {
    const old = await mintEnrolmentLink(ownerDb, staffId);
    const fresh = await mintEnrolmentLink(ownerDb, staffId);
    const links = staffLinkRepo(admin);
    assert.equal((await links.find(hashToken(old)))?.dead, true);
    assert.equal(await links.spend(hashToken(old), passkey(), 'x'), null);
    await owner`UPDATE staff_enrolment_links SET expires_at = created_at - interval '1 hour',
                       created_at = created_at - interval '2 hours'
                 WHERE token_hash = ${hashToken(fresh)}`;
    assert.equal(await links.spend(hashToken(fresh), passkey(), 'x'), null);
  });

  it('binds a session to its passkey: removing the passkey ends the session', async () => {
    const repo = staffPasskeyRepo(admin);
    const second = passkey();
    assert.equal(await repo.add(staffId, second, 'Administrador de contraseñas de Google'), true);
    const list = await repo.listFor(staffId);
    assert.equal(list.length, 2);

    const sessions = staffSessionStore(admin);
    const token = mintToken();
    await sessions.open(hashToken(token), { staffId, passkeyId: second.id }, 3600);
    const live = await sessions.resolve(hashToken(token), 1800);
    assert.equal(live?.passkeyId, second.id);
    assert.ok(live && live.expiresAt > live.openedAt);

    assert.equal(await repo.remove(staffId, second.id), 'removed');
    assert.equal(await sessions.resolve(hashToken(token), 1800), null);
    assert.equal(await repo.remove(staffId, list[0]?.id ?? ''), 'last');
    assert.equal(await repo.remove(staffId, second.id), 'missing');
  });

  it('records a use, and refuses a duplicate credential id', async () => {
    const repo = staffPasskeyRepo(admin);
    const [only] = await repo.listFor(staffId);
    assert.ok(only);
    assert.equal(await repo.recordUse(only.id, 4), true);
    assert.equal((await repo.find(only.id))?.counter, 4);
    assert.ok((await repo.listFor(staffId))[0]?.lastUsedAt);
    const dup = { ...passkey(), id: only.id };
    assert.equal(await repo.add(staffId, dup, 'x'), false);
  });

  it('takes a challenge once, for its own purpose only, and never after expiry', async () => {
    const store = staffChallengeStore(admin);
    const h = hashToken(mintToken());
    await store.save(h, 'login', 300);
    assert.equal(await store.take(h, `stepup:${staffId}`), false);
    assert.equal(await store.take(h, 'login'), true);
    assert.equal(await store.take(h, 'login'), false);
    const late = hashToken(mintToken());
    await store.save(late, 'login', 1);
    await owner`UPDATE staff_webauthn_challenges SET expires_at = now() - interval '1 second'
                 WHERE challenge_hash = ${late}`;
    assert.equal(await store.take(late, 'login'), false);
  });

  it('lets the reset retire every passkey and end every session', async () => {
    const sessions = staffSessionStore(admin);
    const [only] = await staffPasskeyRepo(admin).listFor(staffId);
    assert.ok(only);
    const token = mintToken();
    await sessions.open(hashToken(token), { staffId, passkeyId: only.id }, 3600);
    assert.equal(await resetPasskeys(ownerDb, staffId), 1);
    assert.equal(await sessions.resolve(hashToken(token), 1800), null);
    assert.equal((await staffPasskeyRepo(admin).listFor(staffId)).length, 0);
  });

  it('gives the console no way to mint a link or delete a passkey', async () => {
    await assert.rejects(
      admin.execute(sql`INSERT INTO staff_enrolment_links (token_hash, staff_id, expires_at)
                        VALUES (${'a'.repeat(64)}, ${staffId}, now() + interval '1 hour')`),
    );
    await assert.rejects(
      admin.execute(sql`DELETE FROM staff_passkeys WHERE staff_id = ${staffId}`),
    );
  });
});
