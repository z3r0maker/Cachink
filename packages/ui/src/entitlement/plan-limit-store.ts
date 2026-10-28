/**
 * Which plan limit was just hit, if any (A-10). The global mutation error
 * handler opens it instead of an error toast; `PlanLimitSheet` renders it.
 */

import { create } from 'zustand';
import type { RecordQuota } from '@xangarro/application';
import type { PlanLimitError } from '@xangarro/domain';

interface PlanLimitStore {
  readonly hit: Pick<PlanLimitError, 'plan' | 'limit'> | null;
  show: (hit: Pick<PlanLimitError, 'plan' | 'limit'>) => void;
  dismiss: () => void;
}

export const usePlanLimitStore = create<PlanLimitStore>((set) => ({
  hit: null,
  show: (hit) => set({ hit: { plan: hit.plan, limit: hit.limit } }),
  dismiss: () => set({ hit: null }),
}));

/**
 * N-04: the limit never blocks a capture; once one is saved, a month at the
 * plan's limit opens the neutral sheet. Every capture hook calls this on
 * success: sales, egresos and inventory movements.
 */
export async function warnAfterCapture(quota: RecordQuota): Promise<void> {
  const warning = await quota.warning();
  if (warning !== null) usePlanLimitStore.getState().show(warning);
}
