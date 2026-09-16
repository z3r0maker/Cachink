/**
 * useStockMap (A-14): no stock data reaches product cards when the plan has
 * no stock, and products that don't track stock are left out.
 */

import type { ReactNode } from 'react';
import { describe, expect, it } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MockRepositoryProvider } from '@xangarro/testing/ui';
import { InMemoryAppConfigRepository, seedTestEntitlement } from '@xangarro/testing';
import type { PlanId } from '@xangarro/domain';
import { useEntitlement } from '../../src/entitlement/use-entitlement';
import { useStockMap } from '../../src/hooks/use-stock-map';

const ROWS = {
  data: [
    { producto: { id: 'A', seguirStock: true }, stock: 5 },
    { producto: { id: 'B', seguirStock: false }, stock: 9 },
  ],
};

async function render(plan: PlanId | null) {
  const appConfig = new InMemoryAppConfigRepository();
  if (plan) await seedTestEntitlement(appConfig, plan);
  const qc = new QueryClient({ defaultOptions: { queries: { retry: 0 } } });
  const wrapper = ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={qc}>
      <MockRepositoryProvider overrides={{ appConfig }}>{children}</MockRepositoryProvider>
    </QueryClientProvider>
  );
  const hook = renderHook(() => ({ map: useStockMap(ROWS), ent: useEntitlement() }), { wrapper });
  await waitFor(() => expect(hook.result.current.ent).toBeDefined());
  return hook.result;
}

describe('useStockMap', () => {
  it('maps stock for tracked products when the plan includes stock', async () => {
    const result = await render('emprendedor');
    await waitFor(() => expect([...result.current.map.entries()]).toEqual([['A', 5]]));
  });

  it('is empty on Freelancer (no stock)', async () => {
    const result = await render(null);
    expect(result.current.map.size).toBe(0);
  });
});
