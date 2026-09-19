/**
 * Entitlement UI (A-10): banner selection, plan-limit sheet, and the global
 * mutation handler routing PlanLimitError to the sheet instead of a toast.
 */

import { act } from 'react';
import { afterEach, describe, expect, it } from 'vitest';
import { PlanLimitError } from '@xangarro/domain';
import type { ResolvedEntitlement } from '@xangarro/sync';
import { buildQueryClient } from '../../src/app/app-provider-bridges';
import { bannerKind, PlanLimitSheet, usePlanLimitStore } from '../../src/entitlement/index';
import { useErrorToastStore } from '../../src/observability/error-toast-store';
import { initI18n } from '../../src/i18n/index';
import { renderWithProviders, screen } from '../test-utils';

initI18n();

const BASE: ResolvedEntitlement = {
  plan: 'xangarro',
  recordsPerMonth: null,
  state: 'active',
  verified: true,
  grantedPlan: 'xangarro',
  graceUntil: '2026-10-23T00:00:00.000Z',
  nowAnchored: '2026-09-16T00:00:00.000Z',
};

afterEach(() => {
  usePlanLimitStore.getState().dismiss();
  useErrorToastStore.getState().clear();
});

describe('bannerKind', () => {
  it('is quiet when active, unverified, loading or a Xangarrito plan', () => {
    expect(bannerKind(BASE)).toBeNull();
    expect(bannerKind({ ...BASE, verified: false, state: 'lapsed' })).toBeNull();
    expect(
      bannerKind({ ...BASE, plan: 'xangarrito', grantedPlan: 'xangarrito', state: 'lapsed' }),
    ).toBeNull();
    expect(bannerKind(undefined)).toBeNull();
  });

  it('warns during grace and when a paid plan fell back', () => {
    expect(bannerKind({ ...BASE, state: 'grace' })).toBe('grace');
    expect(bannerKind({ ...BASE, plan: 'xangarrito', state: 'lapsed' })).toBe('fellBack');
  });
});

describe('plan limit sheet', () => {
  it('opens from a PlanLimitError on any mutation instead of an error toast', async () => {
    const qc = buildQueryClient({ current: null });
    renderWithProviders(<PlanLimitSheet />);
    await act(async () => {
      await qc
        .getMutationCache()
        .build(qc, {
          mutationFn: async () => {
            throw new PlanLimitError('xangarrito', 50);
          },
        })
        .execute(undefined)
        .catch(() => undefined);
    });
    expect(screen.getByText('Llegaste a 50 registros este mes')).toBeInTheDocument();
    expect(useErrorToastStore.getState().toasts).toHaveLength(0);
  });
});
