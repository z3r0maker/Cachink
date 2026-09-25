/**
 * "Platícanos de ti" — the eight steps (N-12), as data.
 *
 * One question per step, every step skippable: skipping clears the step's
 * keys, which the domain reads as "no opinion". `reconcile` is how the UI
 * prevents contradictory answers — the newest answer wins and the older one
 * it contradicts is adjusted in the same save, so the server's contradiction
 * check never has to refuse a click.
 */

import type { WizardAnswerKey, WizardAnswers } from '@xangarro/domain';

export interface StepDef {
  readonly title: string;
  readonly hint: string;
  /** Cleared when the step is skipped. */
  readonly keys: readonly WizardAnswerKey[];
}

export const STEPS: readonly StepDef[] = [
  {
    title: '¿Cómo se llama tu negocio y qué vendes?',
    hint: 'Así personalizamos tu catálogo.',
    keys: ['nombre', 'tipoNegocio'],
  },
  {
    title: '¿Cómo te pagan tus clientes?',
    hint: 'Elige todas las que uses.',
    keys: ['metodosCobro'],
  },
  {
    title: '¿Llevas inventario de tus productos?',
    hint: 'Cuántas piezas tienes y cuándo se acaban.',
    keys: ['manejaInventario'],
  },
  {
    title: '¿Manejas una caja de efectivo?',
    hint: 'Abrir y cerrar turno contando el efectivo.',
    keys: ['manejaCajaEfectivo'],
  },
  {
    title: '¿Vendes a crédito?',
    hint: 'Entregas hoy y tu cliente te paga después.',
    keys: ['vendeACredito'],
  },
  {
    title: '¿Cómo te contactan tus clientes?',
    hint: 'Tu WhatsApp aparece en tus comprobantes.',
    keys: ['whatsapp', 'hasLogo'],
  },
  {
    title: '¿Ya tienes tus datos fiscales a la mano?',
    hint: 'RFC y régimen. Los capturas después en Negocio.',
    keys: ['tieneDatosFiscales'],
  },
  {
    title: '¿Cuántas personas cobran en tu negocio?',
    hint: 'Cada una con su propia caja y su NIP.',
    keys: ['personasQueCobran'],
  },
];

export const TOTAL_STEPS = STEPS.length;

export function stepLabel(index: number): string {
  return `Paso ${index + 1} de ${TOTAL_STEPS}`;
}

/** Keys to clear when a step is skipped. */
export function skipKeys(index: number): readonly WizardAnswerKey[] {
  return STEPS[index]?.keys ?? [];
}

export interface ReconciledSave {
  readonly patch: WizardAnswers;
  readonly clear: readonly WizardAnswerKey[];
}

/**
 * The save, adjusted so it cannot contradict what is stored:
 * - "No vendo a crédito" drops Crédito from the payment methods (a list left
 *   empty is cleared — "no opinion" — rather than saved empty);
 * - picking Crédito as a payment method means "sí vendo a crédito".
 */
export function reconcile(stored: WizardAnswers, patch: WizardAnswers): ReconciledSave {
  const out: { -readonly [K in keyof WizardAnswers]: WizardAnswers[K] } = { ...patch };
  const clear: WizardAnswerKey[] = [];
  const methods = patch.metodosCobro ?? stored.metodosCobro;
  if (patch.vendeACredito === false && methods?.includes('Crédito')) {
    const rest = methods.filter((m) => m !== 'Crédito');
    if (rest.length > 0) out.metodosCobro = rest;
    else {
      delete out.metodosCobro;
      clear.push('metodosCobro');
    }
  }
  if (patch.metodosCobro?.includes('Crédito') && stored.vendeACredito === false) {
    out.vendeACredito = true;
  }
  return { patch: out, clear };
}
