/**
 * Env-var configuration for the PAC adapter and the issuer.
 */

import assert from 'node:assert/strict';
import { describe, it } from 'vitest';
import { readCfdiIssuerConfig, readFacturapiConfig } from '../../src/cfdi/index.js';

describe('readFacturapiConfig', () => {
  it('reads a test key with the default base URL', () => {
    assert.deepEqual(readFacturapiConfig({ FACTURAPI_API_KEY: 'sk_test_123' }), {
      apiKey: 'sk_test_123',
      baseUrl: 'https://www.facturapi.io/v2',
      livemode: false,
    });
  });

  it('reads a live key and a base URL override', () => {
    const config = readFacturapiConfig({
      FACTURAPI_API_KEY: ' sk_live_9 ',
      FACTURAPI_BASE_URL: 'https://proxy.example/v2/',
    });
    assert.equal(config.livemode, true);
    assert.equal(config.apiKey, 'sk_live_9');
    assert.equal(config.baseUrl, 'https://proxy.example/v2');
  });

  it('rejects a missing or malformed key', () => {
    for (const env of [{}, { FACTURAPI_API_KEY: '' }, { FACTURAPI_API_KEY: 'pk_test_1' }]) {
      assert.throws(() => readFacturapiConfig(env), { code: 'CFDI_PROVIDER_CONFIG' });
    }
  });

  it('rejects a non-https base URL', () => {
    assert.throws(
      () => readFacturapiConfig({ FACTURAPI_API_KEY: 'sk_test_1', FACTURAPI_BASE_URL: 'http://x' }),
      { code: 'CFDI_PROVIDER_CONFIG' },
    );
  });
});

describe('readCfdiIssuerConfig', () => {
  it('reads the CP and defaults the SaaS keys', () => {
    assert.deepEqual(readCfdiIssuerConfig({ CFDI_LUGAR_EXPEDICION: '06600' }), {
      lugarExpedicion: '06600',
      productKey: '81112106',
      unitKey: 'E48',
    });
  });

  it('accepts overrides for product and unit keys', () => {
    const config = readCfdiIssuerConfig({
      CFDI_LUGAR_EXPEDICION: '06600',
      CFDI_PRODUCT_KEY: '43231500',
      CFDI_UNIT_KEY: 'ACT',
    });
    assert.equal(config.productKey, '43231500');
    assert.equal(config.unitKey, 'ACT');
  });

  it('rejects a missing or malformed CP and a malformed product key', () => {
    const bad = [
      {},
      { CFDI_LUGAR_EXPEDICION: '6600' },
      { CFDI_LUGAR_EXPEDICION: '06600', CFDI_PRODUCT_KEY: '8111' },
      { CFDI_LUGAR_EXPEDICION: '06600', CFDI_UNIT_KEY: 'e-48!' },
    ];
    for (const env of bad) {
      assert.throws(() => readCfdiIssuerConfig(env), { code: 'CFDI_PROVIDER_CONFIG' });
    }
  });
});
