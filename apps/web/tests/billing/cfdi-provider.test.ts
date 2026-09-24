import assert from 'node:assert/strict';
import { describe, it } from 'vitest';
import { CfdiError, FacturapiPacProvider } from '@xangarro/application/cfdi';

import { livePacProvider } from '../../src/server/billing/cfdi';

/**
 * The PAC the composition root hands out (N-33, ADR-070). Every E2E run has
 * `CFDI_MODE` off, so the one guard between a staging deploy and a real SAT
 * stamp — the key must match the mode — is only ever exercised here.
 */

const TEST_KEY = 'sk_test_abc123';
const LIVE_KEY = 'sk_live_abc123';

function refused(env: Record<string, string>): CfdiError {
  try {
    livePacProvider(env);
  } catch (e) {
    assert.ok(e instanceof CfdiError, `expected CfdiError, got ${String(e)}`);
    return e;
  }
  assert.fail('livePacProvider accepted a configuration it must refuse');
}

describe('livePacProvider', () => {
  it('builds the Facturapi provider when the key matches the mode', () => {
    assert.ok(
      livePacProvider({ CFDI_MODE: 'test', FACTURAPI_API_KEY: TEST_KEY }) instanceof
        FacturapiPacProvider,
    );
    assert.ok(
      livePacProvider({ CFDI_MODE: 'live', FACTURAPI_API_KEY: LIVE_KEY }) instanceof
        FacturapiPacProvider,
    );
  });

  it('refuses when CFDI is off — there is no PAC to use', () => {
    assert.equal(
      refused({ CFDI_MODE: 'off', FACTURAPI_API_KEY: TEST_KEY }).code,
      'CFDI_PROVIDER_CONFIG',
    );
    assert.equal(refused({ FACTURAPI_API_KEY: TEST_KEY }).code, 'CFDI_PROVIDER_CONFIG');
  });

  it('refuses a live key in test mode, and a test key in live mode', () => {
    assert.match(refused({ CFDI_MODE: 'test', FACTURAPI_API_KEY: LIVE_KEY }).message, /sk_test_/);
    assert.match(refused({ CFDI_MODE: 'live', FACTURAPI_API_KEY: TEST_KEY }).message, /sk_live_/);
  });

  it('refuses a missing or malformed key, and an unknown mode', () => {
    assert.match(refused({ CFDI_MODE: 'test' }).message, /FACTURAPI_API_KEY/);
    assert.match(
      refused({ CFDI_MODE: 'test', FACTURAPI_API_KEY: 'pk_test_x' }).message,
      /sk_test_/,
    );
    assert.match(
      refused({ CFDI_MODE: 'staging', FACTURAPI_API_KEY: TEST_KEY }).message,
      /off, test o live/,
    );
  });
});
