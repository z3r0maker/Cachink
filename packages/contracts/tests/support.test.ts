import { describe, it } from 'vitest';
import assert from 'node:assert/strict';
import {
  BugReportRequestSchema,
  BugReportResponseSchema,
  MAX_BUG_AUDIT_EVENTS,
  MAX_BUG_DESCRIPTION,
  MAX_BUG_ERRORS,
} from '../src/support.js';
import { API_PATHS } from '../src/transport.js';

/** §9 `POST /support/bug-report` (C-25, N-81): the shape, and what it leaves out. */
const REPORT = {
  description: 'La app se cerró al cobrar',
  submittedAt: '2026-11-10T02:15:00.000Z',
};

describe('bug report request (§9)', () => {
  it('accepts a description and when it was sent, and trims the description', () => {
    const parsed = BugReportRequestSchema.parse({ ...REPORT, description: '  se cerró  ' });
    assert.equal(parsed.description, 'se cerró');
    assert.equal(API_PATHS.bugReport, '/api/v1/support/bug-report');
  });

  it('carries the device context and a snapshot when the phone has them', () => {
    const parsed = BugReportRequestSchema.parse({
      ...REPORT,
      appVersion: '1.4.2',
      platform: 'ios',
      osName: 'iOS',
      osVersion: '26.1',
      deviceModel: 'iPhone 15',
      snapshot: { auditEvents: [{ action: 'venta.registrada' }], errors: [{ name: 'TypeError' }] },
    });
    assert.equal(parsed.snapshot?.errors.length, 1);
    assert.equal(parsed.deviceModel, 'iPhone 15');
  });

  it('has no place for who is calling: the token says that, the body cannot', () => {
    const parsed = BugReportRequestSchema.parse({
      ...REPORT,
      deviceId: '01HZ8XQN9GZJXV8AKQ5X0C7DEV',
      businessId: '01HZ8XQN9GZJXV8AKQ5X0C7BJZ',
      userId: '01HZ8XQN9GZJXV8AKQ5X0C7USR',
    });
    assert.deepEqual(Object.keys(parsed).sort(), ['description', 'submittedAt']);
  });

  it('refuses an empty or oversized description', () => {
    assert.equal(
      BugReportRequestSchema.safeParse({ ...REPORT, description: '   ' }).success,
      false,
    );
    const long = 'x'.repeat(MAX_BUG_DESCRIPTION + 1);
    assert.equal(BugReportRequestSchema.safeParse({ ...REPORT, description: long }).success, false);
    const max = 'x'.repeat(MAX_BUG_DESCRIPTION);
    assert.equal(BugReportRequestSchema.safeParse({ ...REPORT, description: max }).success, true);
  });

  it('refuses a date that is not an instant', () => {
    for (const submittedAt of ['ayer', '2026-11-10', '', undefined]) {
      assert.equal(BugReportRequestSchema.safeParse({ ...REPORT, submittedAt }).success, false);
    }
  });

  it('refuses a snapshot past its row limits, and context fields that are not short text', () => {
    const many = (n: number) => Array.from({ length: n }, () => ({ a: 1 }));
    const snapshot = (auditEvents: number, errors: number) => ({
      ...REPORT,
      snapshot: { auditEvents: many(auditEvents), errors: many(errors) },
    });
    assert.equal(
      BugReportRequestSchema.safeParse(snapshot(MAX_BUG_AUDIT_EVENTS, MAX_BUG_ERRORS)).success,
      true,
    );
    assert.equal(
      BugReportRequestSchema.safeParse(snapshot(MAX_BUG_AUDIT_EVENTS + 1, 0)).success,
      false,
    );
    assert.equal(BugReportRequestSchema.safeParse(snapshot(0, MAX_BUG_ERRORS + 1)).success, false);
    assert.equal(
      BugReportRequestSchema.safeParse({ ...REPORT, appVersion: 'v'.repeat(41) }).success,
      false,
    );
    assert.equal(BugReportRequestSchema.safeParse({ ...REPORT, platform: 7 }).success, false);
  });
});

describe('bug report response (§9)', () => {
  it('says the report was accepted, and nothing else', () => {
    assert.deepEqual(BugReportResponseSchema.parse({ accepted: true }), { accepted: true });
    assert.equal(BugReportResponseSchema.safeParse({ accepted: false }).success, false);
  });
});
