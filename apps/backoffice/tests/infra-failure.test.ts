import assert from 'node:assert/strict';
import { AuthCoreError } from '@xangarro/auth-core';
import { describe, it } from 'vitest';

import { classifyInfraFailure, infraFailureMessage } from '@/server/auth/infra-failure';
import type { InfraFailure } from '@/server/auth/infra-failure';

const DB = 'xangarro_admin.jijggmddzacwcldwnmzj@aws-0-us-west-2.pooler.supabase.com:6543/postgres';
const off = { on: false, db: DB };
const on = { on: true, db: DB };

/** A driver error as `postgres` throws it: the SQLSTATE rides on `cause`. */
const queryError = (code: string): Error =>
  Object.assign(new Error('Failed query: SELECT xangarro.throttle_wait($1)'), {
    cause: Object.assign(new Error('password authentication failed'), { code }),
  });

describe('classifyInfraFailure', () => {
  it('names a missing or malformed ADMIN_TOTP_KEY', () => {
    const error = new AuthCoreError('INVALID_KEY', 'The key must be 32 bytes, base64-encoded.');
    assert.deepEqual(classifyInfraFailure(error), { cause: 'totp-key', detail: 'INVALID_KEY' });
  });

  it('reads the SQLSTATE through the driver wrapper, not just the top error', () => {
    // 28P01 arrives nested under `cause`; classifying the outer Error alone
    // would report every database refusal as 'unknown'.
    assert.deepEqual(classifyInfraFailure(queryError('28P01')), {
      cause: 'db-credentials',
      detail: '28P01',
    });
  });

  it('separates an unreachable host from a rejected password', () => {
    for (const code of ['ECONNREFUSED', 'ENOTFOUND', 'ETIMEDOUT', 'EAI_AGAIN']) {
      assert.equal(classifyInfraFailure(queryError(code)).cause, 'db-unreachable');
    }
  });

  it('separates a database that does not exist', () => {
    assert.equal(classifyInfraFailure(queryError('3D000')).cause, 'db-missing');
  });

  it('falls back to unknown without quoting the error message', () => {
    // The message can carry query text and parameters (staff.ts:69-74 makes
    // the same choice), so only the error's name survives into `detail`.
    const failure = classifyInfraFailure(new TypeError('secret-ish detail'));
    assert.deepEqual(failure, { cause: 'unknown', detail: 'TypeError' });
  });

  it('survives a non-Error throw and a cause cycle', () => {
    assert.equal(classifyInfraFailure('boom').cause, 'unknown');
    assert.equal(classifyInfraFailure(undefined).cause, 'unknown');
    const cyclic: { code?: string; cause?: unknown } = {};
    cyclic.cause = cyclic;
    assert.equal(classifyInfraFailure(cyclic).cause, 'unknown');
  });
});

describe('infraFailureMessage', () => {
  const causes: readonly InfraFailure[] = [
    { cause: 'totp-key', detail: 'INVALID_KEY' },
    { cause: 'db-credentials', detail: '28P01' },
    { cause: 'db-unreachable', detail: 'ENOTFOUND' },
    { cause: 'db-missing', detail: '3D000' },
    { cause: 'unknown', detail: 'TypeError' },
  ];

  it('says one identical generic sentence for every cause while diagnostics are off', () => {
    const messages = new Set(causes.map((failure) => infraFailureMessage(failure, off)));
    assert.equal(messages.size, 1);
    assert.equal([...messages][0], 'El servicio no está disponible. Intenta más tarde.');
  });

  it('never leaks an environment variable or a hostname while diagnostics are off', () => {
    for (const failure of causes) {
      const message = infraFailureMessage(failure, off);
      assert.ok(!message.includes('ADMIN_TOTP_KEY'));
      assert.ok(!message.includes('DATABASE_URL'));
      assert.ok(!message.includes(DB));
    }
  });

  it('names the variable to fix when diagnostics are on', () => {
    assert.match(infraFailureMessage(causes[0]!, on), /ADMIN_TOTP_KEY/);
    assert.match(infraFailureMessage(causes[1]!, on), /DATABASE_URL/);
  });

  it('names the database consulted, so a wrong deployment is visible', () => {
    for (const failure of causes.slice(1, 4)) {
      assert.ok(infraFailureMessage(failure, on).includes(DB));
    }
  });

  it('points an unknown failure at the server logs', () => {
    assert.match(infraFailureMessage(causes[4]!, on), /TypeError/);
  });
});
