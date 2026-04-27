/**
 * Wizard step-state Zustand store unit tests (ADR-039).
 *
 * The store is intentionally simple — three actions plus history-stack
 * invariants. These tests pin the contract so the orchestrator can rely
 * on `back()` finding a previous step.
 */

import { afterEach, describe, expect, it } from 'vitest';
import { useWizardStore } from '../../src/screens/Wizard/state';

afterEach(() => {
  useWizardStore.getState().reset();
});

describe('Wizard store — initial state', () => {
  it('starts at step1 with no preselection and no history', () => {
    const s = useWizardStore.getState();
    expect(s.step).toBe('step1');
    expect(s.preselectedScenario).toBeNull();
    expect(s.history).toHaveLength(0);
    expect(s.forceModeChange).toBe(false);
  });
});

describe('Wizard store — goTo', () => {
  it('advances to the next step and pushes the previous step onto history', () => {
    const { goTo } = useWizardStore.getState();
    goTo('step2a');
    const s = useWizardStore.getState();
    expect(s.step).toBe('step2a');
    expect(s.history).toEqual(['step1']);
  });

  it('does NOT push duplicates onto history when goTo is called for the active step', () => {
    const { goTo } = useWizardStore.getState();
    goTo('step2a');
    goTo('step2a'); // no-op for history
    const s = useWizardStore.getState();
    expect(s.step).toBe('step2a');
    expect(s.history).toEqual(['step1']);
  });

  it('stacks history correctly across multiple navigations', () => {
    const { goTo } = useWizardStore.getState();
    goTo('step2a');
    goTo('cloudSignUp');
    const s = useWizardStore.getState();
    expect(s.step).toBe('cloudSignUp');
    expect(s.history).toEqual(['step1', 'step2a']);
  });
});

describe('Wizard store — back', () => {
  it('pops the most recent history entry and renders the previous step', () => {
    const { goTo, back } = useWizardStore.getState();
    goTo('step2b');
    back();
    const s = useWizardStore.getState();
    expect(s.step).toBe('step1');
    expect(s.history).toHaveLength(0);
  });

  it('is a no-op when history is empty', () => {
    const before = useWizardStore.getState();
    expect(before.step).toBe('step1');
    before.back();
    const after = useWizardStore.getState();
    expect(after.step).toBe('step1');
    expect(after.history).toHaveLength(0);
  });
});

describe('Wizard store — preselect + reset', () => {
  it('records the help-modal pre-selection without changing the step', () => {
    const { preselect } = useWizardStore.getState();
    preselect('solo-cloud');
    const s = useWizardStore.getState();
    expect(s.preselectedScenario).toBe('solo-cloud');
    expect(s.step).toBe('step1');
  });

  it('reset() clears step + history + preselection + force flag', () => {
    const { goTo, preselect, setForceModeChange, reset } = useWizardStore.getState();
    goTo('step3');
    preselect('multi-device');
    setForceModeChange(true);
    reset();
    const s = useWizardStore.getState();
    expect(s.step).toBe('step1');
    expect(s.history).toHaveLength(0);
    expect(s.preselectedScenario).toBeNull();
    expect(s.forceModeChange).toBe(false);
  });
});

describe('Wizard store — forceModeChange escape hatch', () => {
  it('toggles via setForceModeChange', () => {
    const { setForceModeChange } = useWizardStore.getState();
    setForceModeChange(true);
    expect(useWizardStore.getState().forceModeChange).toBe(true);
    setForceModeChange(false);
    expect(useWizardStore.getState().forceModeChange).toBe(false);
  });
});
