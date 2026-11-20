import assert from 'node:assert/strict';

import { describe, it } from 'vitest';

import { apiProblem, emulatorNetwork, parseAdbDevices, parseLogcat } from '../src/phone/signals';

/** The phone run's signals: the emulator's network, its serial, logcat and the portal's API log. */
describe('emulatorNetwork', () => {
  it('maps a persona network to the emulator console’s speed and delay', () => {
    assert.deepEqual(emulatorNetwork('wifi'), { speed: 'full', delay: 'none' });
    assert.deepEqual(emulatorNetwork('4g'), { speed: 'lte', delay: 'none' });
    assert.deepEqual(emulatorNetwork('slow-3g'), { speed: 'umts', delay: 'umts' });
  });

  it('runs «offline-intermitente» on 4g: the cuts are an interruption (S-12)', () => {
    assert.deepEqual(emulatorNetwork('offline-intermitente'), emulatorNetwork('4g'));
  });
});

describe('parseAdbDevices', () => {
  it('lists the emulators that are up, and leaves out offline or unauthorized ones', () => {
    const out =
      'List of devices attached\nemulator-5554\tdevice\nemulator-5556\toffline\nR58N\tunauthorized\nemulator-5558\tdevice\n\n';
    assert.deepEqual(parseAdbDevices(out), ['emulator-5554', 'emulator-5558']);
  });

  it('returns nothing for no devices or output it does not know', () => {
    assert.deepEqual(parseAdbDevices('List of devices attached\n\n'), []);
    assert.deepEqual(parseAdbDevices(''), []);
  });
});

describe('parseLogcat', () => {
  it('reads an epoch line: time, level, tag and message', () => {
    const line =
      '1795136546.123  1234  5678 E ReactNativeJS: TypeError: undefined is not a function';
    assert.deepEqual(parseLogcat(line), {
      epochMs: 1795136546123,
      level: 'E',
      tag: 'ReactNativeJS',
      text: 'TypeError: undefined is not a function',
    });
  });

  it('keeps warnings from React Native and errors from anyone; drops the rest', () => {
    assert.ok(parseLogcat('1795136546.000  1  2 W ReactNativeJS: slow'));
    assert.equal(parseLogcat('1795136546.000  1  2 W chatty: uid=1 expire'), undefined);
    assert.equal(parseLogcat('1795136546.000  1  2 I ActivityManager: Start proc'), undefined);
    assert.equal(parseLogcat('--------- beginning of main'), undefined);
  });
});

describe('apiProblem', () => {
  const BIZ = '01HZ8XQN9GZJXV8AKQ5X0BIZ01';
  const line = (o: Record<string, unknown>) =>
    JSON.stringify({ evt: 'api', business_id: BIZ, ...o });

  it('keeps this tenant’s failed, rejected and slow API calls', () => {
    assert.deepEqual(apiProblem(line({ endpoint: 'push', status: 500, ms: 80 }), BIZ), {
      endpoint: 'push',
      status: 500,
      ms: 80,
    });
    assert.ok(
      apiProblem(
        line({
          endpoint: 'push',
          status: 200,
          ms: 40,
          rejected: 1,
          codes: { FK_PRODUCT_MISSING: 1 },
        }),
        BIZ,
      ),
    );
    assert.ok(apiProblem(line({ endpoint: 'pull', status: 200, ms: 2_400 }), BIZ));
  });

  it('drops a healthy call, another tenant’s, and anything that is not an api line', () => {
    assert.equal(
      apiProblem(line({ endpoint: 'push', status: 200, ms: 40, accepted: 3 }), BIZ),
      undefined,
    );
    assert.equal(
      apiProblem(line({ endpoint: 'push', status: 500, ms: 40, business_id: 'other' }), BIZ),
      undefined,
    );
    assert.equal(apiProblem('{"evt":"push_anomaly"}', BIZ), undefined);
    assert.equal(apiProblem('▲ Next.js ready', BIZ), undefined);
  });

  it('keeps an activation refusal, which has no business yet', () => {
    const activate = JSON.stringify({
      evt: 'api',
      endpoint: 'activate',
      status: 403,
      ms: 12,
      refusal: 'CODE_EXPIRED',
    });
    assert.ok(apiProblem(activate, BIZ));
  });
});
