import { afterAll, describe, it } from 'vitest';
import assert from 'node:assert/strict';

import * as Sentry from '@sentry/node';
import type { ErrorEvent } from '@sentry/node';

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
