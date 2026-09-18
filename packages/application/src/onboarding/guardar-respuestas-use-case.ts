/**
 * GuardarRespuestasUseCase — saves one wizard step (N-12).
 *
 * Every step is saved as it is answered, so leaving halfway loses nothing.
 * The step's answers are merged into what is stored; a skipped step clears its
 * keys ("no opinion"). The merged whole is validated with `WizardAnswersSchema`
 * and the cross-step contradiction rule before anything is written — a stored
 * answer set is always one the domain accepts.
 */

import { parseWizardAnswers, type WizardAnswerKey, type WizardAnswers } from '@xangarro/domain';

import type { UseCase } from '../_use-case.js';
import type { OnboardingStore } from './ports.js';

export interface GuardarRespuestasInput {
  readonly patch: WizardAnswers;
  /** Keys of a skipped step. */
  readonly clear?: readonly WizardAnswerKey[];
}

export class GuardarRespuestasUseCase implements UseCase<GuardarRespuestasInput, WizardAnswers> {
  readonly #store: OnboardingStore;

  constructor(store: OnboardingStore) {
    this.#store = store;
  }

  async execute(input: GuardarRespuestasInput): Promise<WizardAnswers> {
    const record = await this.#store.find();
    const stored = parseWizardAnswers(record?.answers ?? {});
    const merged: Record<string, unknown> = { ...stored, ...input.patch };
    for (const key of input.clear ?? []) delete merged[key];
    const answers = parseWizardAnswers(merged);
    await this.#store.saveAnswers(answers);
    return answers;
  }
}
