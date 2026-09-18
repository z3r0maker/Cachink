import assert from 'node:assert/strict';
import { describe, it } from 'vitest';

import {
  ACTIVATE_PER_CODE,
  ACTIVATE_PER_IP,
  clientIp,
  DEVICE_CALLS_PER_MINUTE,
  LOGIN_PER_EMAIL,
  LOGIN_PER_IP,
  minutes,
  TOTP_PER_ACCOUNT,
} from '../src/index.js';

const FIFTEEN = 15 * 60;

describe('policies', () => {
  it('keeps the portal’s B-17 limits exactly', () => {
    assert.deepEqual(LOGIN_PER_EMAIL, { max: 5, window: FIFTEEN, lockout: FIFTEEN });
    assert.deepEqual(LOGIN_PER_IP, { max: 20, window: FIFTEEN, lockout: FIFTEEN });
    assert.deepEqual(ACTIVATE_PER_IP, { max: 5, window: FIFTEEN, lockout: FIFTEEN });
    assert.deepEqual(ACTIVATE_PER_CODE, { max: 5, window: FIFTEEN, lockout: FIFTEEN });
    assert.equal(DEVICE_CALLS_PER_MINUTE, 60);
  });

  it('allows five wrong second-factor codes per account', () => {
    assert.deepEqual(TOTP_PER_ACCOUNT, { max: 5, window: FIFTEEN, lockout: FIFTEEN });
  });
});

describe('clientIp', () => {
  it('takes the first x-forwarded-for entry', () => {
    assert.equal(clientIp(new Headers({ 'x-forwarded-for': ' 1.2.3.4 , 10.0.0.1' })), '1.2.3.4');
  });

  it('says unknown with no header', () => {
    assert.equal(clientIp(new Headers()), 'unknown');
  });

  it('says unknown for an empty header', () => {
    assert.equal(clientIp(new Headers({ 'x-forwarded-for': '' })), 'unknown');
  });

  it('says unknown for a header of separators', () => {
    assert.equal(clientIp(new Headers({ 'x-forwarded-for': ' , ' })), 'unknown');
  });
});

describe('minutes', () => {
  it('rounds up', () => {
    assert.equal(minutes(61), 2);
    assert.equal(minutes(900), 15);
  });

  it('never says 0', () => {
    assert.equal(minutes(0), 1);
    assert.equal(minutes(1), 1);
  });
});
