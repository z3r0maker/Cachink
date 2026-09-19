/**
 * Which plan limit was just hit, if any (A-10). The global mutation error
 * handler opens it instead of an error toast; `PlanLimitSheet` renders it.
 */

import { create } from 'zustand';
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
