'use server';

import type { CancelLinkView } from '@xangarro/application/billing';

import { reportError } from '../observability/report';
import { liveCancelLink } from './live';

/**
 * The tap on «Sí, cancelar mi suscripción» from a renewal reminder (LFPC 76
 * Bis, ADR-132). No session: the single-use link is the proof, and opening it
 * cancelled nothing. A failure changes nothing and says so.
 */
export type ConfirmarEnlaceResult =
  | { ok: true; view: CancelLinkView }
  | { ok: false; message: string };

export async function confirmarCancelacionPorEnlace(token: string): Promise<ConfirmarEnlaceResult> {
  try {
    return { ok: true, view: await liveCancelLink().confirm(token) };
  } catch (error) {
    reportError(error, { endpoint: 'cancelar/confirmar' });
    return {
      ok: false,
      message:
        'No pudimos cancelar tu suscripción y no se cambió nada. Intenta otra vez; si sigue, escríbenos a hola@xangarro.mx.',
    };
  }
}
