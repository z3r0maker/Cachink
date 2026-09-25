'use server';

import { failure } from '../action-errors';
import { supportInboxFromEnv } from '../support-inbox';
import { requireMember } from '../auth';

/**
 * «Ayuda» (N-08's wiring list): a support request from the portal — a
 * question, a "no entiendo X", anything that is neither a bug report nor an
 * escalation. Files an inbox item (`kind = 'ayuda'`) through the console's
 * ingestion endpoint, tagged with the member's business so staff see context
 * without asking. Idempotent per (source, sourceRef): the id is a ULID of
 * the submit instant, so one click is one item and a retry of the same
 * submit (double-click raced) is not a second one.
 */
export interface AyudaForm {
  readonly asunto: string;
  readonly mensaje: string;
  readonly urgente: boolean;
}

export type AyudaResult = { ok: true } | { ok: false; message: string };

const runId = (): string =>
  new Date()
    .toISOString()
    .replace(/[-:.TZ]/g, '')
    .slice(0, 20) + Math.random().toString(36).slice(2, 8).toUpperCase();

export async function enviarAyuda(form: AyudaForm): Promise<AyudaResult> {
  try {
    const session = await requireMember();
    const asunto = form.asunto.trim();
    const mensaje = form.mensaje.trim();
    if (asunto === '' || asunto.length > 120) {
      return { ok: false, message: 'Escribe un asunto de hasta 120 caracteres.' };
    }
    if (mensaje === '' || mensaje.length > 4000) {
      return { ok: false, message: 'Escribe tu mensaje (hasta 4000 caracteres).' };
    }
    await supportInboxFromEnv().file({
      kind: 'ayuda',
      urgent: form.urgente,
      businessId: session.business_id,
      title: asunto,
      body: mensaje,
      source: 'portal-ayuda',
      sourceRef: `ayuda:${runId()}`,
      paymentRef: null,
    });
    return { ok: true };
  } catch (error) {
    return failure(error, 'enviarAyuda', {
      retry: 'No pudimos enviar tu mensaje. Intenta de nuevo.',
    });
  }
}
