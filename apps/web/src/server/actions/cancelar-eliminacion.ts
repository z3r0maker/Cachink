'use server';

import type { CancelarEliminacionView } from '@xangarro/application/cuenta';

import { liveCancelarEliminacion } from '../cuenta/live';
import { reportError } from '../observability/report';

/**
 * The tap on «Sí, conservar mi cuenta» from a deletion email (ADR-136). No
 * session: the single-use link is the proof, and opening it changed nothing.
 */
export type CancelarEliminacionResult =
  | { ok: true; view: CancelarEliminacionView }
  | { ok: false; message: string };

export async function cancelarEliminacion(token: string): Promise<CancelarEliminacionResult> {
  try {
    return { ok: true, view: await liveCancelarEliminacion().confirm(token) };
  } catch (error) {
    reportError(error, { endpoint: 'eliminacion/conservar' });
    return {
      ok: false,
      message:
        'No pudimos cancelar la eliminación y no se cambió nada. Intenta otra vez; si sigue, escríbenos a hola@xangarro.mx.',
    };
  }
}
