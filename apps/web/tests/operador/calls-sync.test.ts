import assert from 'node:assert/strict';
import { beforeEach, describe, it, vi } from 'vitest';

/**
 * Every sync run tells the Worker which business this register was linked
 * to (audit F-15c): the engine applies pulled pages under it and refuses a
 * page whose entitlement names another. An unlinked browser sends none, and
 * the engine then does not contact the server at all.
 */

const readDevice = vi.fn<() => { businessId: string } | null>(() => null);
vi.mock('../../src/operador/runtime/device-store', () => ({ readDevice: () => readDevice() }));

const calls = await import('../../src/operador/runtime/calls');

beforeEach(() => readDevice.mockReturnValue(null));

describe('calls.sync', () => {
  it('carries the linked register’s own business', () => {
    readDevice.mockReturnValue({ businessId: 'biz-1' });
    assert.deepEqual(calls.sync('tok', { mode: 'completa', manual: true }), {
      method: 'sync',
      token: 'tok',
      businessId: 'biz-1',
      mode: 'completa',
      manual: true,
    });
  });

  it('carries none before the register is linked', () => {
    const call = calls.sync(null, { mode: 'captura', manual: false });
    assert.deepEqual(call, {
      method: 'sync',
      token: null,
      businessId: null,
      mode: 'captura',
      manual: false,
    });
  });
});
