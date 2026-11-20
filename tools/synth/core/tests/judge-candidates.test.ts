import assert from 'node:assert/strict';

import { describe, it } from 'vitest';

import { bugCandidates } from '../src/judge/candidates';

/**
 * Spec §8.3 task 2: every console error and every failed request is a `bug`
 * candidate, whether or not the actor noticed it. Picked by script, before
 * the judge sees the run, so the judge cannot overlook one.
 */
const lines = (...records: Record<string, unknown>[]) =>
  records.map((r) => JSON.stringify(r)).join('\n');

describe('bugCandidates', () => {
  it('takes every web console error and page error, citing its line', () => {
    const console = lines(
      { t: 10, type: 'warning', text: 'deprecated' },
      { t: 20, type: 'error', text: 'TypeError: x is undefined' },
      { t: 30, type: 'pageerror', text: 'Unhandled rejection' },
    );
    assert.deepEqual(
      bugCandidates(console, '').map((c) => [c.id, c.ref, c.text]),
      [
        ['C1', 'console.jsonl#L2', 'TypeError: x is undefined'],
        ['C2', 'console.jsonl#L3', 'Unhandled rejection'],
      ],
    );
  });

  it('folds a stack trace and a burst of the same error into the line that starts it', () => {
    const console = lines(
      { t: 1, type: 'E', tag: 'Dev', text: 'java.lang.ClassNotFoundException: Splash' },
      { t: 1, type: 'E', tag: 'Dev', text: '\tat java.lang.Class.forName(Class.java:607)' },
      { t: 1, type: 'E', tag: 'Dev', text: 'Caused by: java.lang.ClassNotFoundException: x' },
      { t: 1, type: 'E', tag: 'Dev', text: '\t... 20 more' },
      { t: 2, type: 'E', tag: 'Pop', text: 'Failed to add file group ' },
      { t: 2, type: 'E', tag: 'Pop', text: 'Failed to add file group ' },
      { t: 3, type: 'E', tag: 'Other', text: '\tat a.b(C.java:1)' },
      // logcat lines whose tag did not parse keep it in the text
      { t: 4, type: 'E', tag: 'unknown', text: 'ReactHost: SoftException: not ready' },
      { t: 4, type: 'E', tag: 'unknown', text: 'ReactHost: \tat com.facebook.X.y(X.kt:905)' },
    );
    assert.deepEqual(
      bugCandidates(console, '').map((c) => [c.ref, c.text]),
      [
        ['console.jsonl#L1', 'Dev: java.lang.ClassNotFoundException: Splash (y 3 líneas más)'],
        ['console.jsonl#L5', 'Pop: Failed to add file group (y 1 línea más)'],
        ['console.jsonl#L7', 'Other: \tat a.b(C.java:1)'],
        ['console.jsonl#L8', 'unknown: ReactHost: SoftException: not ready (y 1 línea más)'],
      ],
    );
  });

  it('takes phone logcat errors and fatals, but not React Native warnings', () => {
    const console = lines(
      { t: 1, type: 'W', tag: 'ReactNativeJS', text: 'slow' },
      { t: 2, type: 'E', tag: 'ReactNativeJS', text: 'Error: sync failed' },
      { t: 3, type: 'F', tag: 'libc', text: 'Fatal signal 11' },
    );
    assert.deepEqual(
      bugCandidates(console, '').map((c) => c.ref),
      ['console.jsonl#L2', 'console.jsonl#L3'],
    );
  });

  it('takes failed requests, 4xx/5xx and refused rows, but a slow success is not a bug', () => {
    const network = lines(
      { t: 1, method: 'GET', url: 'http://x/a', status: 200, ms: 2_400 },
      { t: 2, method: 'POST', url: 'http://x/b', status: 500, ms: 30 },
      { t: 3, method: 'GET', url: 'http://x/c', status: null, ms: -1, failure: 'net::ERR_FAILED' },
      {
        t: 4,
        endpoint: 'push',
        status: 200,
        ms: 40,
        rejected: 1,
        codes: { FK_PRODUCT_MISSING: 1 },
      },
    );
    assert.deepEqual(
      bugCandidates('', network).map((c) => [c.source, c.ref]),
      [
        ['network', 'network.jsonl#L2'],
        ['network', 'network.jsonl#L3'],
        ['network', 'network.jsonl#L4'],
      ],
    );
  });

  it('numbers candidates across both files, console first', () => {
    const ids = bugCandidates(
      lines({ type: 'error', text: 'a' }),
      lines({ method: 'GET', url: 'u', status: 404, ms: 5 }),
    ).map((c) => c.id);
    assert.deepEqual(ids, ['C1', 'C2']);
  });

  it('skips lines it cannot read rather than failing the judge', () => {
    assert.deepEqual(bugCandidates('not json\n\n{"type":"error","text":"x"}', '{broken'), [
      { id: 'C1', source: 'console', ref: 'console.jsonl#L3', text: 'x' },
    ]);
  });
});
