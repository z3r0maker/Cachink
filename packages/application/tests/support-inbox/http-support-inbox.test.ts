import assert from 'node:assert/strict';
import { describe, it } from 'vitest';

import {
  httpSupportInbox,
  INGEST_SECRET_HEADER,
  SupportInboxError,
  type InboxFetch,
  type InboxHttpInit,
  type InboxItemRequest,
} from '../../src/support-inbox/index.js';

const ITEM: InboxItemRequest = {
  kind: 'factura',
  urgent: false,
  businessId: '01HZ8XQN9GZJXV8AKQ5X0C7AAA',
  title: 'Pago sin CFDI',
  body: 'Total $348.00',
  source: 'stripe-webhook',
  sourceRef: 'in_1',
  paymentRef: 'in_1',
};

function answering(status: number, calls: { url: string; init: InboxHttpInit }[] = []) {
  const fetch: InboxFetch = (url, init) => {
    calls.push({ url, init });
    return Promise.resolve({ status, ok: status >= 200 && status < 300 });
  };
  return fetch;
}

const inbox = (fetch: InboxFetch) =>
  httpSupportInbox({ url: 'https://admin.test/api/internal/support-items', secret: 's3', fetch });

async function codeOf(p: Promise<void>): Promise<string> {
  try {
    await p;
    return 'none';
  } catch (error) {
    assert.ok(error instanceof SupportInboxError);
    return `${error.code}:${error.retryable}`;
  }
}

describe('httpSupportInbox', () => {
  it('posts the item as JSON with the shared secret; 201 and 200 both succeed', async () => {
    const calls: { url: string; init: InboxHttpInit }[] = [];
    await inbox(answering(201, calls)).file(ITEM);
    await inbox(answering(200, calls)).file(ITEM);
    assert.equal(calls[0]?.url, 'https://admin.test/api/internal/support-items');
    assert.equal(calls[0]?.init.headers[INGEST_SECRET_HEADER], 's3');
    assert.deepEqual(JSON.parse(calls[0]?.init.body ?? '{}'), ITEM);
  });

  it('a wrong secret is not retryable', async () => {
    assert.equal(await codeOf(inbox(answering(401)).file(ITEM)), 'INBOX_UNAUTHORIZED:false');
  });

  it('an invalid item is not retryable; a closed endpoint or a 5xx is', async () => {
    assert.equal(await codeOf(inbox(answering(400)).file(ITEM)), 'INBOX_REJECTED:false');
    assert.equal(await codeOf(inbox(answering(503)).file(ITEM)), 'INBOX_DISABLED:true');
    assert.equal(await codeOf(inbox(answering(500)).file(ITEM)), 'INBOX_UNAVAILABLE:true');
  });

  it('a network failure is retryable', async () => {
    const down: InboxFetch = () => Promise.reject(new Error('ECONNREFUSED'));
    assert.equal(await codeOf(inbox(down).file(ITEM)), 'INBOX_UNAVAILABLE:true');
  });
});
