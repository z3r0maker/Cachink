import assert from 'node:assert/strict';
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import { afterEach, beforeEach, describe, it } from 'vitest';

import { runRecord } from '../src/corrida/records';
import { run } from './aggregate-fixtures';

/**
 * What a finished run held, read back from its folder (S-11): its span from
 * `run.json`, its tenant from `access.json`, and on the web the port, address
 * and profile the runner wrote to `runner.json`.
 */
let dir: string;
beforeEach(() => {
  dir = mkdtempSync(join(tmpdir(), 'synth-record-'));
});
afterEach(() => rmSync(dir, { recursive: true, force: true }));

const write = (name: string, value: unknown) =>
  writeFileSync(join(dir, name), JSON.stringify(value));

describe('runRecord', () => {
  it('reads a web run’s span, tenant and what its browser held', () => {
    const r = run({ persona: 'taquero', scenario: 'primera-venta', duration_ms: 90_000 });
    write('run.json', r);
    write('access.json', { biz: 'BIZ1', operators: ['Ana'] });
    write('runner.json', { cdp_port: 9333, address: '203.0.113.2', profile: '/tmp/p' });
    assert.deepEqual(runRecord(dir), {
      id: r.id,
      runner: 'web',
      started_at: r.started_at,
      ended_at: '2026-11-20T01:01:30.000Z',
      biz: 'BIZ1',
      cdp_port: 9333,
      address: '203.0.113.2',
      profile: '/tmp/p',
    });
  });

  it('leaves the browser fields empty for a phone run, which writes no runner.json', () => {
    write(
      'run.json',
      run({ persona: 'taquero', scenario: 'primera-venta-telefono', runner: 'phone' }),
    );
    write('access.json', { biz: 'BIZ2', operators: [] });
    const rec = runRecord(dir);
    assert.deepEqual(
      [rec.runner, rec.cdp_port, rec.address, rec.profile],
      ['phone', null, null, null],
    );
  });

  it('takes a signup run’s tenant as unknown: it had none when it started', () => {
    write('run.json', run({ persona: 'lupita-abarrotes', scenario: 'onboarding-camino-a' }));
    write('access.json', { biz: null, signup: 'x@ejemplo.mx', operators: [] });
    assert.equal(runRecord(dir).biz, null);
  });

  it('throws naming the folder when the run never wrote run.json', () => {
    mkdirSync(join(dir, 'x'));
    assert.throws(() => runRecord(join(dir, 'x')), /run\.json/);
  });
});
