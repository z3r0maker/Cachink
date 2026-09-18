import assert from 'node:assert/strict';
import { describe, it } from 'vitest';

import { assertKeyMatchesMode, CfdiError, readCfdiMode } from '../../src/cfdi/index.js';

const isConfig = (e: unknown) => e instanceof CfdiError && e.code === 'CFDI_PROVIDER_CONFIG';

describe('CFDI_MODE', () => {
  it('defaults to off and reads each mode', () => {
    assert.equal(readCfdiMode({}), 'off');
    assert.equal(readCfdiMode({ CFDI_MODE: '  ' }), 'off');
    assert.equal(readCfdiMode({ CFDI_MODE: 'test' }), 'test');
    assert.equal(readCfdiMode({ CFDI_MODE: 'live' }), 'live');
  });

  it('refuses anything else', () => {
    assert.throws(() => readCfdiMode({ CFDI_MODE: 'LIVE' }), isConfig);
    assert.throws(() => readCfdiMode({ CFDI_MODE: 'on' }), isConfig);
  });

  it('refuses a live key in test and a test key in live', () => {
    assert.throws(() => assertKeyMatchesMode('test', true), isConfig);
    assert.throws(() => assertKeyMatchesMode('live', false), isConfig);
    assert.doesNotThrow(() => assertKeyMatchesMode('test', false));
    assert.doesNotThrow(() => assertKeyMatchesMode('live', true));
  });
});
