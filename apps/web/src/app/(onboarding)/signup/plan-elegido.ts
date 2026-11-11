import { PLAN_IDS, type PlanId } from '@xangarro/domain';

/**
 * The plan a visitor picked on the landing (`/signup?plan=`), kept while the
 * address is confirmed (N-83). It used to ride the redirect to the wizard;
 * now an email sits between the form and the wizard, so it waits in this
 * browser's storage. It is only a preselection: opened on another device, the
 * link simply starts the wizard without one.
 */
const KEY = 'xg-plan-elegido';

function storage(): Storage | null {
  try {
    return typeof window === 'undefined' ? null : window.localStorage;
  } catch {
    return null;
  }
}

export const planElegido = {
  guardar(plan: PlanId | null): void {
    if (plan === null) return storage()?.removeItem(KEY);
    storage()?.setItem(KEY, plan);
  },
  leer(): PlanId | null {
    const value = storage()?.getItem(KEY);
    return PLAN_IDS.find((p) => p === value) ?? null;
  },
  olvidar(): void {
    storage()?.removeItem(KEY);
  },
} as const;
