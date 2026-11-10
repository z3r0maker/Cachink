import { afterAll, describe, it, vi } from 'vitest';
import assert from 'node:assert/strict';

import * as Sentry from '@sentry/node';
import type { ErrorEvent } from '@sentry/node';
import { DrizzleQueryError } from 'drizzle-orm/errors';

import { reportError } from '../src/server/observability/report';
import { initSentry, scrubEvent } from '../src/server/observability/sentry';

/**
 * B-18's acceptance, without a real Sentry project: the SDK runs for real and
 * only the last hop — the HTTP send — is replaced by a transport that keeps
 * the envelopes. What would have left the server is what is asserted.
 */
const sent: unknown[] = [];
const transport = () => ({
  send: async (envelope: unknown) => {
    sent.push(envelope);
    return {};
  },
  flush: async () => true,
});

function events(): ErrorEvent[] {
  // An envelope is [headers, [[itemHeader, payload], …]].
  return sent.flatMap((e) => (e as [unknown, [unknown, ErrorEvent][]])[1].map(([, p]) => p));
}

afterAll(async () => {
  await Sentry.close();
});

/** A unique violation on signup, as Drizzle over postgres.js raises it. */
const failedQuery = () =>
  new DrizzleQueryError(
    'insert into "auth"."users" ("email", "encrypted_password") values ($1, $2)',
    ['pedro@taqueria.mx', '$2b$10$N9qo8uLOickgx2ZMRZoMye'],
    Object.assign(new Error('duplicate key value violates unique constraint "users_email_key"'), {
      name: 'PostgresError',
      code: '23505',
      severity: 'ERROR',
      detail: 'Key (email)=(pedro@taqueria.mx) already exists.',
      schema_name: 'auth',
      table_name: 'users',
      constraint_name: 'users_email_key',
    }),
  );
/** Anything of the SQL, its parameters or the row. */
const LEAK = /pedro|taqueria|\$2b\$|insert into|Key \(email\)|params/i;

describe('observability', () => {
  it('is off without a DSN', () => {
    assert.equal(initSentry({ dsn: '' }), false);
  });

  it('a forced error reaches Sentry tagged with business_id, device_id and endpoint', async () => {
    assert.equal(initSentry({ dsn: 'https://public@o0.ingest.sentry.io/0', transport }), true);
    reportError(new Error('forced'), {
      endpoint: 'sync/push',
      businessId: '01HZ8XQN9GZJXV8AKQ5X0C7BJZ',
      deviceId: '01HZ8XQN9GZJXV8AKQ5X0DAND1',
    });
    await Sentry.flush(2000);
    const [event] = events();
    assert.equal(event?.exception?.values?.[0]?.value, 'forced');
    assert.deepEqual(
      { ...event?.tags },
      {
        endpoint: 'sync/push',
        business_id: '01HZ8XQN9GZJXV8AKQ5X0C7BJZ',
        device_id: '01HZ8XQN9GZJXV8AKQ5X0DAND1',
      },
    );
  });

  it('a failed query leaves without its SQL, its parameters or the row (audit F-14)', async () => {
    const line = vi.spyOn(console, 'error').mockImplementation(() => undefined);
    reportError(failedQuery(), { endpoint: 'registrarse' });
    await Sentry.flush(2000);

    const event = events().at(-1);
    const exception = event?.exception?.values?.[0];
    assert.equal(exception?.type, 'DatabaseError');
    assert.equal(
      exception?.value,
      'database error 23505 constraint=users_email_key table=users schema=auth',
    );
    assert.ok((exception?.stacktrace?.frames?.length ?? 0) > 0, 'the frames still say where');
    assert.equal(LEAK.test(JSON.stringify(sent.at(-1))), false, 'nothing of the row in the event');

    const logged = String(line.mock.calls.at(-1)?.[0]);
    line.mockRestore();
    assert.deepEqual(JSON.parse(logged), {
      evt: 'error',
      endpoint: 'registrarse',
      name: 'DatabaseError',
      code: '23505',
      constraint: 'users_email_key',
      table: 'users',
      schema: 'auth',
    });
    assert.equal(LEAK.test(logged), false);
  });

  it('a failed query captured by any other path is scrubbed on the way out', async () => {
    // Not through `reportError`: straight to the SDK, as a stray capture would.
    Sentry.captureException(failedQuery());
    Sentry.captureException(new Error(`wrapped: ${failedQuery().message}`));
    await Sentry.flush(2000);
    const [direct, quoted] = events().slice(-2);
    assert.equal(
      direct?.exception?.values?.[0]?.value,
      'database error 23505 constraint=users_email_key table=users schema=auth',
    );
    assert.equal(quoted?.exception?.values?.[0]?.value, 'database error');
    assert.equal(LEAK.test(JSON.stringify(sent.slice(-2))), false);
  });

  it('strips cookies, headers, query and the user before anything leaves', () => {
    const out = scrubEvent({
      type: undefined,
      user: { email: 'pedro@taqueria.mx' },
      breadcrumbs: [{ message: 'console: pedro@taqueria.mx' }],
      request: {
        method: 'POST',
        url: 'https://portal/api?email=pedro@taqueria.mx',
        cookies: { xg_session: 'secret' },
        headers: { authorization: 'Bearer x' },
      },
    });
    assert.equal(JSON.stringify(out).includes('pedro'), false);
    assert.equal(JSON.stringify(out).includes('secret'), false);
    assert.deepEqual(out.request, { method: 'POST', url: 'https://portal/api' });
  });
});
