/**
 * Sending «Reportar un problema» from the phone (M-23, ADR-162 §5): a report
 * always tries to leave; without a connection it waits in a small queue on
 * the device and leaves by itself later.
 */
import assert from 'node:assert/strict';
import { beforeEach, describe, it } from 'vitest';

import type { BugReportRequest } from '@xangarro/contracts';

import {
  drainReports,
  MAX_QUEUED_REPORTS,
  outcomeOf,
  queuedReports,
  REPORT_QUEUE_KEY,
  sendReport,
  type ReportDeps,
  type SendOutcome,
} from '../../src/bug-report/index.js';

const report = (n: number, over: Partial<BugReportRequest> = {}): BugReportRequest => ({
  category: 'could_not_charge',
  description: '',
  submittedAt: `2026-11-20T20:14:0${n}.000Z`,
  ...over,
});

function harness(answers: readonly SendOutcome[] = []) {
  const kv = new Map<string, string>();
  const sent: BugReportRequest[] = [];
  let i = 0;
  const deps: ReportDeps = {
    store: {
      get: async (key) => kv.get(key) ?? null,
      set: async (key, value) => void kv.set(key, value),
    },
    sender: {
      send: async (r) => {
        sent.push(r);
        const answer = answers[i] ?? 'sent';
        i += 1;
        return answer;
      },
    },
  };
  return { kv, sent, deps };
}

describe('sendReport', () => {
  it('sends a report and keeps nothing on the device', async () => {
    const { deps, sent } = harness(['sent']);
    assert.equal(await sendReport(report(1), deps), 'sent');
    assert.equal(sent.length, 1);
    assert.deepEqual(await queuedReports(deps.store), []);
  });

  it('keeps the report on the device when there is no connection', async () => {
    const { deps } = harness(['offline']);
    assert.equal(await sendReport(report(1), deps), 'queued');
    assert.deepEqual(await queuedReports(deps.store), [report(1)]);
  });

  it('says the daily limit plainly and does not keep the report to retry it', async () => {
    const { deps } = harness(['limited']);
    assert.equal(await sendReport(report(1), deps), 'limited');
    assert.deepEqual(await queuedReports(deps.store), []);
  });

  it('fails without queueing when the caja is no longer linked or the report is refused', async () => {
    for (const answer of ['unlinked', 'rejected'] as const) {
      const { deps } = harness([answer]);
      assert.equal(await sendReport(report(1), deps), 'failed');
      assert.deepEqual(await queuedReports(deps.store), []);
    }
  });

  it('refuses one more than the queue holds, and says so instead of dropping one', async () => {
    const { deps } = harness(Array.from({ length: MAX_QUEUED_REPORTS + 1 }, () => 'offline'));
    for (let n = 0; n < MAX_QUEUED_REPORTS; n += 1) {
      assert.equal(await sendReport(report(n), deps), 'queued');
    }
    assert.equal(await sendReport(report(9), deps), 'queue_full');
    const kept = await queuedReports(deps.store);
    assert.equal(kept.length, MAX_QUEUED_REPORTS);
    assert.equal(kept[0]?.submittedAt, report(0).submittedAt);
  });

  it('does not queue the same report twice', async () => {
    const { deps } = harness(['offline', 'offline']);
    await sendReport(report(1), deps);
    await sendReport(report(1), deps);
    assert.equal((await queuedReports(deps.store)).length, 1);
  });
});

describe('drainReports', () => {
  let h: ReturnType<typeof harness>;
  beforeEach(async () => {
    h = harness(['offline', 'offline', 'offline']);
    for (const n of [1, 2, 3]) await sendReport(report(n), h.deps);
    h.sent.length = 0;
  });

  it('sends what waited, oldest first, and empties the queue', async () => {
    const result = await drainReports(h.deps);
    assert.deepEqual(result, { sent: 3, left: 0 });
    assert.deepEqual(
      h.sent.map((r) => r.submittedAt),
      [1, 2, 3].map((n) => report(n).submittedAt),
    );
    assert.deepEqual(await queuedReports(h.deps.store), []);
  });

  it('stops at the first one that cannot leave, and keeps it and the rest', async () => {
    for (const blocker of ['offline', 'limited', 'unlinked'] as const) {
      const again = harness(['offline', 'offline', 'offline', 'sent', blocker]);
      for (const n of [1, 2, 3]) await sendReport(report(n), again.deps);
      assert.deepEqual(await drainReports(again.deps), { sent: 1, left: 2 });
      assert.equal(again.sent.length, 5, 'the third is not tried after the second stopped');
    }
  });

  it('drops a report the server will never take, and goes on', async () => {
    const again = harness(['offline', 'offline', 'rejected', 'sent']);
    for (const n of [1, 2]) await sendReport(report(n), again.deps);
    assert.deepEqual(await drainReports(again.deps), { sent: 1, left: 0 });
  });

  it('does nothing, and sends nothing, with an empty queue', async () => {
    const empty = harness();
    assert.deepEqual(await drainReports(empty.deps), { sent: 0, left: 0 });
    assert.equal(empty.sent.length, 0);
  });
});

describe('queuedReports', () => {
  it('reads what is stored and ignores anything that is not a report', async () => {
    const { deps, kv } = harness();
    kv.set(REPORT_QUEUE_KEY, JSON.stringify([report(1), { nope: true }, 7, report(2)]));
    assert.deepEqual(await queuedReports(deps.store), [report(1), report(2)]);
    kv.set(REPORT_QUEUE_KEY, 'not json');
    assert.deepEqual(await queuedReports(deps.store), []);
    kv.set(REPORT_QUEUE_KEY, '{"a":1}');
    assert.deepEqual(await queuedReports(deps.store), []);
  });
});

describe('outcomeOf', () => {
  const failed = (status: number, code: string) => ({ ok: false as const, status, code });

  it('reads the device API’s answer as what to do next', () => {
    assert.equal(outcomeOf({ ok: true }), 'sent');
    assert.equal(outcomeOf(failed(0, 'NETWORK')), 'offline');
    assert.equal(outcomeOf(failed(0, 'TIMEOUT')), 'offline');
    assert.equal(outcomeOf(failed(503, 'INTERNAL')), 'offline');
    assert.equal(outcomeOf(failed(200, 'BAD_RESPONSE')), 'offline');
    assert.equal(outcomeOf(failed(429, 'RATE_LIMITED')), 'limited');
    assert.equal(outcomeOf(failed(401, 'DEVICE_REVOKED')), 'unlinked');
    assert.equal(outcomeOf(failed(401, 'UNAUTHENTICATED')), 'unlinked');
    assert.equal(outcomeOf(failed(400, 'VALIDATION')), 'rejected');
    assert.equal(outcomeOf(failed(404, 'NOT_FOUND')), 'rejected');
  });
});
