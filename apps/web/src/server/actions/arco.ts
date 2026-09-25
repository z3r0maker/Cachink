'use server';

import { clientIp, LOGIN_PER_IP } from '@xangarro/auth-core';
import { SolicitarArcoUseCase } from '@xangarro/application/support-inbox';
import { throttleKey, throttleTake } from '@xangarro/data-pg';
import { newUlid } from '@xangarro/domain';
import { headers } from 'next/headers';

import { failure } from '../action-errors';
import { db } from '../db';
import { readSession } from '../session';
import { supportInboxFromEnv } from '../support-inbox';

/**
 * A titular's ARCO request (N-34): the public form at `/privacidad/solicitud`,
 * open to anyone, with or without an account. Filed in the admin inbox as
 * `kind = 'arco'` with its legal deadline; a signed-in member's business goes
 * with it so staff have context. Throttled per IP with the sign-in limit: the
 * form is public, and each submit is an item a person must read.
 */
export type ArcoResult =
  | { readonly ok: true; readonly folio: string; readonly responderA: string }
  | { readonly ok: false; readonly message: string };

const FIELD_MESSAGE: Readonly<Record<string, string>> = {
  nombre: 'Escribe tu nombre completo.',
  correo: 'Escribe un correo válido para enviarte la respuesta.',
  derecho: 'Elige qué derecho quieres ejercer.',
  descripcion: 'Describe tu solicitud (al menos 10 caracteres).',
};

const FALLO = 'No pudimos enviar tu solicitud. Intenta de nuevo o escríbenos por correo.';

async function throttled(): Promise<boolean> {
  const key = throttleKey('arco', 'ip', clientIp(await headers()));
  return (await throttleTake(db(), key, LOGIN_PER_IP.max, LOGIN_PER_IP.window)) > 0;
}

export async function enviarSolicitudArco(form: unknown): Promise<ArcoResult> {
  try {
    if (await throttled()) {
      return { ok: false, message: 'Recibimos muchas solicitudes desde aquí. Intenta más tarde.' };
    }
    const session = await readSession();
    const result = await new SolicitarArcoUseCase({
      inbox: supportInboxFromEnv(),
      now: () => new Date(),
      newFolio: () => `ARCO-${newUlid()}`,
    }).execute({ solicitud: form, businessId: session?.business_id ?? null });
    if (!result.ok) return { ok: false, message: FIELD_MESSAGE[result.field] ?? FALLO };
    return { ok: true, folio: result.folio, responderA: result.plazos.responderA };
  } catch (error) {
    return failure(error, 'enviarSolicitudArco', { retry: FALLO });
  }
}
