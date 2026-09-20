import { afterAll, beforeAll, describe, it } from 'vitest';
import assert from 'node:assert/strict';
import { MOCK_CODES, startMockServer, type RunningMock } from '@xangarro/contracts/mock';
import { ApiClient } from '../src/api-client.js';

let mock: RunningMock;
beforeAll(async () => {
  mock = await startMockServer(0);
});
afterAll(async () => {
  await mock.close();
});

const DEVICE = {
  name: 'Test iPhone',
  platform: 'ios' as const,
  appVersion: '0.1.0',
  osVersion: '18',
};
const EMAIL = 'dueno@tacoslaesquina.mx';

describe('ApiClient', () => {
  it('activates and then pulls with the returned token', async () => {
    const client = new ApiClient({ baseUrl: mock.url });
    const act = await client.activate({ email: EMAIL, code: MOCK_CODES.valid, device: DEVICE });
    assert.equal(act.ok, true);
    if (!act.ok) return;
    assert.equal(act.data.bootstrap.tables.products[0]?.precioVentaCentavos !== undefined, true);
    assert.equal(typeof act.data.bootstrap.tables.products[0]?.precioVentaCentavos, 'bigint');
    const pull = await client.pull(act.data.deviceToken, 0);
    assert.equal(pull.ok, true);
  });

  it('maps a contract error envelope to its code', async () => {
    const client = new ApiClient({ baseUrl: mock.url });
    const res = await client.activate({ email: EMAIL, code: MOCK_CODES.used, device: DEVICE });
    assert.deepEqual(res.ok ? null : [res.status, res.code], [409, 'CODE_USED']);
  });

  it('maps a network failure to NETWORK without throwing', async () => {
    const client = new ApiClient({ baseUrl: 'http://127.0.0.1:1' });
    const res = await client.activate({ email: EMAIL, code: MOCK_CODES.valid, device: DEVICE });
    assert.equal(res.ok ? null : res.code, 'NETWORK');
  });

  it('maps a 2xx body that breaks the schema to BAD_RESPONSE', async () => {
    const fetchImpl = (async () =>
      new Response('{"hello":"world"}', { status: 200 })) as typeof fetch;
    const client = new ApiClient({ baseUrl: 'http://x', fetchImpl });
    const res = await client.entitlement('tok');
    assert.equal(res.ok ? null : res.code, 'BAD_RESPONSE');
  });

  it('forwards extra headers such as the mock scenario', async () => {
    const client = new ApiClient({
      baseUrl: mock.url,
      extraHeaders: { 'X-Mock-Scenario': 'revoked' },
    });
    const res = await client.entitlement('mock-device:whatever');
    assert.equal(res.ok ? null : res.code, 'DEVICE_REVOKED');
  });
});
