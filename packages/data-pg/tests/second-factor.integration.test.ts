import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { afterAll, beforeAll, it } from 'vitest';
import { sql } from 'drizzle-orm';

import { createDb, type Db } from '../src/client';
import {
  issueLink,
  openSession,
  peekLink,
  secondFactorRepo,
  secondFactorStatus,
  sessionSteppedUp,
  stepUpSession,
} from '../src/security';
import { integrationSuite } from './support/db';

/**
 * The owner's second factor against the real functions (0057, N-83): the same
 * conditional writes the console's `staff_members` columns have, so the
 * database decides every race, plus the session's re-ask stamp.
 */
const { url, describe } = integrationSuite();
const HASHES = ['h1', 'h2', 'h3'] as const;

describe('second factor storage', () => {
  let db: Db;

  async function account(): Promise<{ id: string; email: string }> {
    const id = randomUUID();
    const email = `${id}@segundo.test.mx`;
    await db.execute(sql`
      INSERT INTO auth.users (id, email, encrypted_password, email_confirmed_at)
      VALUES (${id}::uuid, ${email}, 'hash', now())`);
    return { id, email };
  }

  async function enrolled() {
    const a = await account();
    const repo = secondFactorRepo(db);
    await repo.savePendingSecret(a.id, null, 'sealed');
    await repo.completeEnrolment(a.id, 100, HASHES);
    return { ...a, repo };
  }

  beforeAll(() => {
    db = createDb(url as string);
  });

  afterAll(async () => {
    await db?.$client.end({ timeout: 5 });
  });

  it('an account that never opened Seguridad has no second factor; a stranger has no state', async () => {
    const a = await account();
    assert.deepEqual(await secondFactorStatus(db, a.id), {
      secretEnc: null,
      enrolledAt: null,
      lastStep: null,
      codesLeft: 0,
      inviteDismissed: false,
    });
    assert.equal(await secondFactorStatus(db, randomUUID()), null);
    assert.equal(await secondFactorRepo(db).totpState(randomUUID()), null);
  });

  it('stores a pending seed by compare-and-swap, so a second tab loses', async () => {
    const a = await account();
    const repo = secondFactorRepo(db);
    assert.equal(await repo.savePendingSecret(a.id, null, 'first'), true);
    assert.equal(await repo.savePendingSecret(a.id, null, 'second'), false, 'stale previous');
    assert.equal(await repo.savePendingSecret(a.id, 'first', 'third'), true);
    assert.equal((await repo.totpState(a.id))?.secretEnc, 'third');
    assert.equal(await repo.savePendingSecret(randomUUID(), null, 'x'), false, 'a stranger');
  });

  it('enrols once, with its first step and recovery hashes', async () => {
    const a = await account();
    const repo = secondFactorRepo(db);
    assert.equal(await repo.completeEnrolment(a.id, 100, HASHES), false, 'no seed yet');
    await repo.savePendingSecret(a.id, null, 'sealed');
    assert.equal(await repo.completeEnrolment(a.id, 100, HASHES), true);
    assert.equal(await repo.completeEnrolment(a.id, 101, ['other']), false, 'already enrolled');
    const status = await secondFactorStatus(db, a.id);
    assert.ok(status?.enrolledAt);
    assert.equal(status?.lastStep, 100);
    assert.equal(typeof status?.lastStep, 'number', 'bigint is parsed, not asserted');
    assert.equal(status?.codesLeft, 3);
    assert.equal(
      await repo.savePendingSecret(a.id, 'sealed', 'swap'),
      false,
      'never while enrolled',
    );
  });

  it('a TOTP step only moves forward', async () => {
    const { id, repo } = await enrolled();
    assert.equal(await repo.advanceStep(id, 100), false, 'the enrolment step, replayed');
    assert.equal(await repo.advanceStep(id, 99), false);
    assert.equal(await repo.advanceStep(id, 101), true);
    assert.equal((await repo.totpState(id))?.lastStep, 101);
  });

  it('a recovery code is removed once and reports how many are left', async () => {
    const { id, repo } = await enrolled();
    assert.equal(await repo.consumeRecoveryCode(id, 'h2'), 2);
    assert.equal(await repo.consumeRecoveryCode(id, 'h2'), null);
    assert.equal(await repo.consumeRecoveryCode(id, 'never-issued'), null);
    assert.equal(await repo.consumeRecoveryCode(randomUUID(), 'h1'), null);
  });

  it('new recovery codes replace the old ones, only for an enrolled account', async () => {
    const { id, repo } = await enrolled();
    assert.equal(await repo.replaceRecoveryCodes(id, ['n1', 'n2']), true);
    assert.equal(await repo.consumeRecoveryCode(id, 'h1'), null, 'the earlier ones stop working');
    assert.equal(await repo.consumeRecoveryCode(id, 'n1'), 1);
    const other = await account();
    assert.equal(await repo.replaceRecoveryCodes(other.id, ['n1']), false);
  });

  it('turning it off removes the seed and codes and drops a sign-in waiting on a code', async () => {
    const { id, email, repo } = await enrolled();
    const challenge = await issueLink(db, email, 'challenge', 600);
    assert.ok(challenge);
    assert.equal(await repo.disable(id), true);
    assert.deepEqual(await secondFactorStatus(db, id), {
      secretEnc: null,
      enrolledAt: null,
      lastStep: null,
      codesLeft: 0,
      inviteDismissed: true,
    });
    assert.equal((await peekLink(db, challenge, 'challenge'))?.state, 'used');
    assert.equal(await repo.disable(id), false, 'nothing left to turn off');
    assert.equal(
      await repo.savePendingSecret(id, null, 'again'),
      true,
      'and it can be enrolled again',
    );
  });

  it('the invitation is dismissed once and stays dismissed', async () => {
    const a = await account();
    const repo = secondFactorRepo(db);
    await repo.dismissInvite(a.id);
    assert.equal((await secondFactorStatus(db, a.id))?.inviteDismissed, true);
    await repo.dismissInvite(a.id);
    await repo.dismissInvite(randomUUID());
    assert.equal((await secondFactorStatus(db, a.id))?.inviteDismissed, true);
    assert.equal(
      await repo.savePendingSecret(a.id, null, 'sealed'),
      true,
      'a dismissed row still enrols',
    );
  });

  it('a session proves the second factor for a window, then it is asked again', async () => {
    const a = await account();
    const token = await openSession(db, a.id, 'biz-x', 3_600);
    assert.equal(await sessionSteppedUp(db, token, 900), false, 'a password-only session');
    assert.equal(await stepUpSession(db, token), true);
    assert.equal(await sessionSteppedUp(db, token, 900), true);
    assert.equal(await sessionSteppedUp(db, token, 0), false, 'outside the window');
  });

  it('a revoked or unknown session can neither prove nor hold a proof', async () => {
    const a = await account();
    const token = await openSession(db, a.id, 'biz-x', 3_600);
    await stepUpSession(db, token);
    await db.execute(sql`SELECT xangarro.session_revoke_user(${a.id}::uuid)`);
    assert.equal(await sessionSteppedUp(db, token, 900), false);
    assert.equal(await stepUpSession(db, token), false);
    assert.equal(await stepUpSession(db, 'y'.repeat(43)), false);
  });
});
