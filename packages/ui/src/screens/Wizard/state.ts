/**
 * Wizard step-state Zustand store (ADR-039).
 *
 * Tracks the active step, the help-modal pre-selection (so closing the
 * modal can highlight a recommended Step-1 card), and a small history
 * stack for `back()`. The store is intentionally separate from
 * `useAppConfigStore` because wizard navigation is transient — it
 * resets every time the wizard mounts and persists nothing.
 *
 * Usage:
 *   const step = useWizardStep();
 *   const goTo = useWizardGoTo();
 *   const back = useWizardBack();
 *   const preselect = useWizardPreselect();
 *   const reset = useWizardReset();
 */

import { create } from 'zustand';

export type WizardStep =
  | 'step1'
  | 'step2a'
  | 'step2b'
  | 'step3'
  | 'cloudSignUp'
  | 'cloudSignIn'
  | 'migrationDeferred';

export type WizardScenario = 'solo-local' | 'multi-device' | 'solo-cloud';

interface WizardState {
  readonly step: WizardStep;
  readonly history: readonly WizardStep[];
  readonly preselectedScenario: WizardScenario | null;
  readonly forceModeChange: boolean;
  goTo: (next: WizardStep) => void;
  back: () => void;
  preselect: (s: WizardScenario | null) => void;
  setForceModeChange: (v: boolean) => void;
  reset: () => void;
}

const INITIAL: Pick<WizardState, 'step' | 'history' | 'preselectedScenario' | 'forceModeChange'> = {
  step: 'step1',
  history: [],
  preselectedScenario: null,
  forceModeChange: false,
};

export const useWizardStore = create<WizardState>((set) => ({
  ...INITIAL,
  goTo: (next) =>
    set((s) => ({
      step: next,
      // Don't push duplicates onto history; that would break `back()`
      // when a screen re-renders from a query invalidation.
      history: s.step === next ? s.history : [...s.history, s.step],
    })),
  back: () =>
    set((s) => {
      if (s.history.length === 0) return s;
      const previous = s.history[s.history.length - 1]!;
      return {
        step: previous,
        history: s.history.slice(0, -1),
      };
    }),
  preselect: (preselectedScenario) => set({ preselectedScenario }),
  setForceModeChange: (forceModeChange) => set({ forceModeChange }),
  reset: () => set(INITIAL),
}));

/** Selector: the currently rendered step. */
export const useWizardStep = (): WizardStep => useWizardStore((s) => s.step);

/** Selector: imperative navigation to an arbitrary step. */
export const useWizardGoTo = (): WizardState['goTo'] => useWizardStore((s) => s.goTo);

/** Selector: pop the history stack and render the previous step. */
export const useWizardBack = (): WizardState['back'] => useWizardStore((s) => s.back);

/** Selector: the help-modal pre-selection (used to highlight a Step-1 card). */
export const useWizardPreselectedScenario = (): WizardScenario | null =>
  useWizardStore((s) => s.preselectedScenario);

/** Selector: the help-modal pre-selection setter. */
export const useWizardPreselect = (): WizardState['preselect'] =>
  useWizardStore((s) => s.preselect);

/** Selector: the unsynced-blocker escape-hatch flag. */
export const useWizardForceModeChange = (): boolean => useWizardStore((s) => s.forceModeChange);

/** Selector: setter for the unsynced-blocker escape-hatch flag. */
export const useWizardSetForceModeChange = (): WizardState['setForceModeChange'] =>
  useWizardStore((s) => s.setForceModeChange);

/** Selector: full reset — call from the wizard's mount effect. */
export const useWizardReset = (): WizardState['reset'] => useWizardStore((s) => s.reset);
