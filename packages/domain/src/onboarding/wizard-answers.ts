/**
 * Answers to the 8-step "Platícanos de ti" wizard (N-12, ADR-067).
 *
 * Every field is optional because every step is skippable; a skipped step
 * means "no opinion" and never changes configuration. Unknown keys are
 * rejected so a renamed field cannot pass silently.
 */

import { z } from 'zod';
import { TipoNegocioEnum } from '../entities/business.js';
import { PaymentMethodEnum } from '../entities/sale.js';
import { OnboardingError } from './errors.js';

export const WizardAnswersSchema = z.strictObject({
  /** Step 1. */
  nombre: z.string().trim().min(1).max(120).optional(),
  tipoNegocio: TipoNegocioEnum.optional(),
  /** Step 2 — "¿cómo cobras?". */
  metodosCobro: z
    .array(PaymentMethodEnum)
    .min(1)
    .refine((list) => new Set(list).size === list.length, 'duplicated payment method')
    .optional(),
  /** Step 3. */
  manejaInventario: z.boolean().optional(),
  /** Step 4. */
  manejaCajaEfectivo: z.boolean().optional(),
  /** Step 5. */
  vendeACredito: z.boolean().optional(),
  /** Step 6 — Mexican 10-digit number, optionally prefixed with +52. */
  whatsapp: z
    .string()
    .regex(/^(\+52)?\d{10}$/)
    .optional(),
  hasLogo: z.boolean().optional(),
  /** Step 7 — whether fiscal data was captured (the values live on Business). */
  tieneDatosFiscales: z.boolean().optional(),
  /** Step 8 — "¿cuántas personas cobran?". */
  personasQueCobran: z.number().int().min(1).max(99).optional(),
});

export type WizardAnswers = z.infer<typeof WizardAnswersSchema>;
export type WizardAnswerKey = keyof WizardAnswers;

/** Validate raw answers; throws `OnboardingError` on invalid or contradictory input. */
export function parseWizardAnswers(raw: unknown): WizardAnswers {
  const parsed = WizardAnswersSchema.safeParse(raw);
  if (!parsed.success) {
    const issues = parsed.error.issues.map((i) => `${i.path.join('.')}: ${i.message}`);
    throw new OnboardingError(
      'INVALID_WIZARD_ANSWERS',
      'Respuestas del asistente inválidas',
      issues,
    );
  }
  const answers = parsed.data;
  if (answers.vendeACredito === false && answers.metodosCobro?.includes('Crédito')) {
    throw new OnboardingError(
      'CONTRADICTORY_WIZARD_ANSWERS',
      'Crédito como forma de cobro contradice "no vendo a crédito"',
      ['metodosCobro', 'vendeACredito'],
    );
  }
  return answers;
}

/** Credit is wanted if step 5 says so, or step 2 lists Crédito; `undefined` = no opinion. */
export function wantsCredit(answers: WizardAnswers): boolean | undefined {
  if (answers.vendeACredito !== undefined) return answers.vendeACredito;
  return answers.metodosCobro?.includes('Crédito') ? true : undefined;
}
