import assert from 'node:assert/strict';
import { describe, it } from 'vitest';

import {
  RecordingSupportInbox,
  SupportInboxError,
  type InboxItemRequest,
} from '@xangarro/application/support-inbox';
import { BUG_REPORTS_PER_DEVICE_PER_DAY, MAX_BUG_REPORT_BYTES } from '@xangarro/contracts';
import { SUPPORT_ITEM_BODY_MAX, SupportItemSchema } from '@xangarro/domain';

import {
  BUG_REPORTS_PER_BUSINESS_PER_DAY,
  fileBugReport,
  type BugReportDeps,
} from '../src/server/support/bug-report';

/**
 * `POST /api/v1/support/bug-report` (N-81, contract §9): the phone's report
 * reaches the staff inbox under the device and business its **token** names,
 * inside limits that refuse when they cannot be checked.
 */
const CALLER = {
  deviceId: '01HZ8XQN9GZJXV8AKQ5X0C7DEV',
  businessId: '01HZ8XQN9GZJXV8AKQ5X0C7BJZ',
};
const REPORT = {
  description: 'La app se cerró al cobrar',
  submittedAt: '2026-11-10T02:15:00.000Z',
  appVersion: '1.4.2',
  platform: 'ios',
  deviceModel: 'iPhone 15',
};

function harness(waits: Readonly<Record<string, number>> = {}) {
  const inbox = new RecordingSupportInbox();
  const taken: { key: string; max: number; window: number }[] = [];
  const deps: BugReportDeps = {
    inbox,
    key: (...parts) => parts.join(':'),
    take: async (key, max, window) => {
      taken.push({ key, max, window });
      return waits[key] ?? 0;
    },
  };
  return { inbox, taken, deps };
}

/** The one item a report filed; fails when there is none, or more. */
function theOnlyItem(inbox: RecordingSupportInbox): InboxItemRequest {
  const [item] = inbox.items;
  assert.equal(inbox.items.length, 1);
  assert.ok(item);
  return item;
}

const DEVICE_KEY = `bug-report:device:${CALLER.deviceId}`;
const BUSINESS_KEY = `bug-report:business:${CALLER.businessId}`;

describe('fileBugReport', () => {
  it('files the report under the token’s device and business', async () => {
    const { inbox, deps } = harness();
    const outcome = await fileBugReport(CALLER, JSON.stringify(REPORT), deps);
    assert.deepEqual(outcome, { kind: 'accepted' });
    const { title, body, ...fields } = theOnlyItem(inbox);
    assert.deepEqual(fields, {
      kind: 'bug',
      urgent: false,
      businessId: CALLER.businessId,
      source: 'bug-report',
      sourceRef: `${CALLER.deviceId}:${REPORT.submittedAt}`,
      paymentRef: null,
    });
    assert.match(title, /^Reporte del teléfono 01HZ8XQN/);
    for (const said of ['La app se cerró al cobrar', CALLER.deviceId, '1.4.2', 'iPhone 15']) {
      assert.ok(body.includes(said), `the body says «${said}»`);
    }
  });

  it('files an item the console accepts: the domain’s own rules, at the largest report', async () => {
    const { inbox, deps } = harness();
    // About 80 KB on the wire: every row the sheet attaches, in two- and four-byte characters.
    const many = (n: number) => Array.from({ length: n }, (_, i) => ({ i, pad: 'ñ'.repeat(500) }));
    const largest = {
      ...REPORT,
      description: '🙂'.repeat(2500),
      snapshot: { auditEvents: many(50), errors: many(20) },
    };
    const outcome = await fileBugReport(CALLER, JSON.stringify(largest), deps);
    assert.deepEqual(outcome, { kind: 'accepted' });
    const at = '2026-11-10T02:16:00.000Z';
    // What the console builds around a source's fields (`inbox/create.ts`).
    const asStored = SupportItemSchema.safeParse({
      ...inbox.items[0],
      attachments: [],
      dueAt: null,
      id: '01HZ8XQN9GZJXV8AKQ5X0C7SPT',
      status: 'nuevo',
      ownerStaffId: null,
      cfdiUuid: null,
      createdAt: at,
      updatedAt: at,
      resolvedAt: null,
    });
    assert.equal(asStored.success, true, JSON.stringify(asStored.error?.issues));
  });

  it('believes no id in the body', async () => {
    const { inbox, deps } = harness();
    const forged = { ...REPORT, deviceId: 'OTRO-DISPOSITIVO', businessId: 'OTRO-NEGOCIO' };
    await fileBugReport(CALLER, JSON.stringify(forged), deps);
    const item = theOnlyItem(inbox);
    assert.equal(item.businessId, CALLER.businessId);
    assert.equal(item.sourceRef, `${CALLER.deviceId}:${REPORT.submittedAt}`);
    assert.doesNotMatch(item.body, /OTRO-/);
  });

  it('counts the report against its device and its business, for a day', async () => {
    const { taken, deps } = harness();
    await fileBugReport(CALLER, JSON.stringify(REPORT), deps);
    assert.deepEqual(taken, [
      { key: DEVICE_KEY, max: BUG_REPORTS_PER_DEVICE_PER_DAY, window: 86_400 },
      { key: BUSINESS_KEY, max: BUG_REPORTS_PER_BUSINESS_PER_DAY, window: 86_400 },
    ]);
  });

  it('refuses past the device’s limit, and files nothing', async () => {
    const { inbox, deps } = harness({ [DEVICE_KEY]: 3600 });
    const outcome = await fileBugReport(CALLER, JSON.stringify(REPORT), deps);
    assert.deepEqual(outcome, { kind: 'limited', retryAfter: 3600 });
    assert.equal(inbox.items.length, 0);
  });

  it('refuses past the business’s limit: one shop’s phones cannot flood the inbox', async () => {
    const { inbox, deps } = harness({ [BUSINESS_KEY]: 120 });
    const outcome = await fileBugReport(CALLER, JSON.stringify(REPORT), deps);
    assert.deepEqual(outcome, { kind: 'limited', retryAfter: 120 });
    assert.equal(inbox.items.length, 0);
  });

  it('fails closed: a limit that cannot be checked files nothing', async () => {
    const { inbox, deps } = harness();
    const broken = { ...deps, take: () => Promise.reject(new Error('throttle is down')) };
    await assert.rejects(fileBugReport(CALLER, JSON.stringify(REPORT), broken), /throttle is down/);
    assert.equal(inbox.items.length, 0);
  });

  it('refuses a body that is not a report, before any limit is spent', async () => {
    const tooBig = JSON.stringify({ ...REPORT, description: 'x'.repeat(MAX_BUG_REPORT_BYTES) });
    const bodies = ['{not json', '[]', JSON.stringify({ ...REPORT, description: ' ' }), tooBig];
    for (const body of bodies) {
      const { inbox, taken, deps } = harness();
      const outcome = await fileBugReport(CALLER, body, deps);
      assert.equal(outcome.kind, 'invalid', body.slice(0, 20));
      assert.equal(inbox.items.length, 0);
      assert.equal(taken.length, 0);
    }
  });

  it('keeps the whole description and trims the context to what the inbox holds', async () => {
    const { inbox, deps } = harness();
    const auditEvents = Array.from({ length: 50 }, (_, i) => ({
      action: 'venta',
      n: i,
      pad: 'p'.repeat(600),
    }));
    const description = 'd'.repeat(5000);
    const body = JSON.stringify({ ...REPORT, description, snapshot: { auditEvents, errors: [] } });
    assert.deepEqual(await fileBugReport(CALLER, body, deps), { kind: 'accepted' });
    const filed = inbox.items[0]?.body ?? '';
    assert.ok(filed.length <= SUPPORT_ITEM_BODY_MAX, `body is ${filed.length} characters`);
    assert.ok(filed.includes(description));
    assert.match(filed, /\(recortado\)/);
  });

  it('never files a stack trace, even if a client sends one', async () => {
    const { inbox, deps } = harness();
    const errors = [
      { name: 'TypeError', errorStack: 'at /Users/ana/secreto.ts:1', error_stack: 'x' },
    ];
    const body = JSON.stringify({ ...REPORT, snapshot: { auditEvents: [], errors } });
    await fileBugReport(CALLER, body, deps);
    const filed = inbox.items[0]?.body ?? '';
    assert.match(filed, /TypeError/);
    assert.doesNotMatch(filed, /secreto|errorStack|error_stack/);
  });

  it('lets an inbox failure through: the route answers a retryable error', async () => {
    const { deps } = harness();
    const failing = {
      ...deps,
      inbox: {
        file: () => Promise.reject(new SupportInboxError('INBOX_UNAVAILABLE', 'caída', true)),
      },
    };
    await assert.rejects(
      fileBugReport(CALLER, JSON.stringify(REPORT), failing),
      (error: unknown) => error instanceof SupportInboxError && error.code === 'INBOX_UNAVAILABLE',
    );
  });
});
