/**
 * useEntitlement is bound to the business this phone was activated for
 * (audit F-15c): a plan signed for another business, however validly, is
 * treated exactly like one that does not verify.
 */

import type { ReactNode } from 'react';
import { describe, it } from 'vitest';
import assert from 'node:assert/strict';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { ResolvedEntitlement } from '@xangarro/sync';
import { InMemoryAppConfigRepository, seedTestEntitlement } from '@xangarro/testing';
import { MockRepositoryProvider } from '@xangarro/testing/ui';
import { deviceBusinessId } from '../../src/activation/device-business';
import { APP_CONFIG_KEYS } from '../../src/app-config/index';
import { useEntitlement } from '../../src/entitlement/use-entitlement';

const activation = (businessId: string): string =>
  JSON.stringify({ deviceId: 'D', businessId, activatedAt: '2026-09-16T00:00:00.000Z' });

/** A phone whose stored plan is signed for «TEST», activated for `business`. */
async function resolved(business: string | null): Promise<ResolvedEntitlement> {
  const appConfig = new InMemoryAppConfigRepository();
  await seedTestEntitlement(appConfig, 'xangarro');
  if (business !== null) await appConfig.set(APP_CONFIG_KEYS.activation, activation(business));
  const qc = new QueryClient({ defaultOptions: { queries: { retry: 0 } } });
  const wrapper = ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={qc}>
      <MockRepositoryProvider overrides={{ appConfig }}>{children}</MockRepositoryProvider>
    </QueryClientProvider>
  );
  const hook = renderHook(() => useEntitlement(), { wrapper });
  await waitFor(() => assert.notEqual(hook.result.current, undefined));
  return hook.result.current as ResolvedEntitlement;
}

describe('useEntitlement: bound to the activated business', () => {
  it('enforces the plan signed for this phone’s business', async () => {
    const r = await resolved('TEST');
    assert.deepEqual([r.plan, r.verified, r.state], ['xangarro', true, 'active']);
  });

  it('falls back to the free limits for a plan signed for another business', async () => {
    const r = await resolved('OTRO-NEGOCIO');
    assert.deepEqual([r.plan, r.verified, r.grantedPlan], ['xangarrito', false, null]);
  });

  it('verifies nothing on a phone with no activation record', async () => {
    assert.equal((await resolved(null)).verified, false);
  });
});

describe('deviceBusinessId', () => {
  it('reads the business from the activation record, or null', async () => {
    const appConfig = new InMemoryAppConfigRepository();
    assert.equal(await deviceBusinessId(appConfig), null);
    await appConfig.set(APP_CONFIG_KEYS.activation, '{not json');
    assert.equal(await deviceBusinessId(appConfig), null);
    await appConfig.set(APP_CONFIG_KEYS.activation, activation('BIZ-1'));
    assert.equal(await deviceBusinessId(appConfig), 'BIZ-1');
  });
});
