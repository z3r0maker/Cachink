'use server';

import { headers } from 'next/headers';
import { z } from 'zod';

import { failure } from '../action-errors';
import { lastErrorOfSession } from '../observability/last-error';
import { filePortalReport } from '../support/portal-report';
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

/**
 * «Algo no funciona» (P-48, ADR-162 §8): a `bug` item that carries by itself
 * the screen the person was on, their browser and the last error of their
 * session. The form sends only the screen's address, an optional sentence and
 * its attempt id; the browser and the error are read here, on the server, and
 * the rules are `server/support/portal-report.ts`'s.
 *
 * Any member may send one, a read-only one included: seeing something broken
 * needs no role. A failed send is said, reported, and never kept as the
 * session's last error, so the retry does not name its own failure.
 */
export interface FallaForm {
  /** The address of the screen it happened on (`shell/pantallas.ts`), or null. */
  readonly pantalla: string | null;
  readonly mensaje: string;
  readonly urgente: boolean;
  /** Minted once by the form: a retry of the same attempt files nothing new. */
  readonly intento: string;
}

const FallaSchema = z.object({
  pantalla: z.string().max(200).nullable(),
  mensaje: z.string(),
  urgente: z.boolean(),
  intento: z.string().max(64),
});

export async function reportarFalla(form: FallaForm): Promise<AyudaResult> {
  try {
    const session = await requireMember('viewer');
    const outcome = await filePortalReport(
      { userId: session.sub, businessId: session.business_id, email: session.email },
      FallaSchema.parse(form),
      {
        navegador: (await headers()).get('user-agent'),
        ultimoError: await lastErrorOfSession(),
        enviado: new Date().toISOString(),
      },
      supportInboxFromEnv(),
    );
    return outcome.kind === 'accepted' ? { ok: true } : { ok: false, message: outcome.message };
  } catch (error) {
    return failure(error, 'reportarFalla', {
      invalid: () => 'Revisa lo que escribiste e intenta de nuevo.',
      retry: 'No pudimos enviar tu reporte. Intenta de nuevo.',
      remember: false,
    });
  }
}
