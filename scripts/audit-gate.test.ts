import assert from 'node:assert/strict';
import { describe, it } from 'vitest';

import { blocking, findingsOf, isBuildOnly, type Finding } from './audit-gate-rules.js';

/** SEC-SUP-01: what fails CI, and what the gate is allowed to excuse. */
const f = (over: Partial<Finding>): Finding => ({
  ghsa: 'GHSA-aaaa-bbbb-cccc',
  module: 'tmp',
  severity: 'high',
  paths: ['apps__web>exceljs>tmp'],
  ...over,
});

describe('audit gate', () => {
  it('fails a high advisory the portal ships', () => {
    assert.equal(blocking([f({})], [], '2026-09-23').length, 1);
  });

  it('excuses only when every path is build-time', () => {
    const buildOnly = f({ paths: ['apps__backoffice>drizzle-orm>expo-sqlite>expo>@expo/cli>ws'] });
    const mixed = f({ paths: [...buildOnly.paths, 'apps__web>ws'] });
    assert.equal(blocking([buildOnly], [], '2026-09-23').length, 0);
    assert.equal(
      blocking([mixed], [], '2026-09-23').length,
      1,
      'one runtime path is enough to fail',
    );
  });

  it('honours a reviewed allowlist entry until its date, then fails again', () => {
    const allow = [
      { ghsa: 'GHSA-aaaa-bbbb-cccc', reason: 'not our call path', reviewBy: '2026-10-01' },
    ];
    assert.equal(blocking([f({})], allow, '2026-09-23').length, 0);
    assert.equal(blocking([f({})], allow, '2026-10-02').length, 1);
  });

  it('never fails on moderate or low, and reads pnpm’s JSON', () => {
    assert.equal(blocking([f({ severity: 'moderate' })], [], '2026-09-23').length, 0);
    const [one] = findingsOf({
      advisories: {
        '1': {
          github_advisory_id: 'GHSA-x',
          module_name: 'm',
          severity: 'critical',
          findings: [{ paths: ['a>b'] }],
        },
      },
    });
    assert.deepEqual(one, { ghsa: 'GHSA-x', module: 'm', severity: 'critical', paths: ['a>b'] });
    assert.equal(isBuildOnly('packages__config>vitest>vite'), true);
    assert.equal(isBuildOnly('apps__web>next'), false);
  });
});
