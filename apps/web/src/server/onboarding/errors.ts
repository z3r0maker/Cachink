import 'server-only';

import { reportError } from '../observability/report';

/**
 * One way to turn an onboarding action's failure into something to show.
 *
 * Expected refusals carry a code and a Spanish message already written for a
 * person; those are shown as they are and not reported. Anything else is a
 * bug or an outage: it goes to `reportError` and the person gets a generic
 * line — never a stack, a SQL error or a column value.
 */
export type Failure = { ok: false; message: string };

const SHOWN = new Set([
  'INVALID_WIZARD_ANSWERS',
  'CONTRADICTORY_WIZARD_ANSWERS',
  'NOT_A_PAID_PLAN',
  'BUSINESS_NOT_FOUND',
  'NOT_PERMITTED',
  'FLAG_NOT_ALLOWED',
  'FLAG_DEPENDENCY',
]);

/** Per-code copy where the domain's own message is written for logs, not people. */
const COPY: Readonly<Record<string, string>> = {
  INVALID_WIZARD_ANSWERS: 'Revisa tu respuesta: hay un dato que no pudimos guardar.',
  CONTRADICTORY_WIZARD_ANSWERS: 'Esa respuesta contradice otra anterior. Revísalas.',
};

export function failure(error: unknown, endpoint: string, businessId?: string): Failure {
  const code = (error as { code?: unknown } | null)?.code;
  if (error instanceof Error && typeof code === 'string' && SHOWN.has(code)) {
    return { ok: false, message: COPY[code] ?? error.message };
  }
  reportError(error, { endpoint, ...(businessId === undefined ? {} : { businessId }) });
  return { ok: false, message: 'No pudimos guardar. Intenta de nuevo.' };
}
