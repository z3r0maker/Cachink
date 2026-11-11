import 'server-only';

import { refusal, STEP_UP_REQUIRED } from '../action-errors';
import type { SessionClaims } from '../session';
import { accessDeps } from './live';
import { reconfirmado } from './segundo-paso';

/**
 * The re-ask (N-83, ADR-142 §8): with the second factor on, a change to
 * operators, cajas or billing needs a code typed on this session in the last
 * 15 minutes. Called by the server action itself, after its role check, so a
 * request that skips the dialog is refused all the same.
 *
 * The refusal's code is what `failure()` turns into `reconfirmar: true`, and
 * the screen answers that with the dialog (`shell/reconfirmar`). An account
 * without the second factor is never asked.
 */
export const STEP_UP_MESSAGE = 'Confirma que eres tú para seguir.';

export async function requireStepUp(session: SessionClaims): Promise<void> {
  if (await reconfirmado(accessDeps(), session.sub)) return;
  throw refusal(STEP_UP_REQUIRED, STEP_UP_MESSAGE);
}
