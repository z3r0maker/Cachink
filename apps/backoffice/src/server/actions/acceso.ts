'use server';

import type {
  PublicKeyCredentialCreationOptionsJSON,
  PublicKeyCredentialRequestOptionsJSON,
} from '@xangarro/auth-core';
import { revalidatePath } from 'next/cache';

import { finishLinkRegistration, startLinkRegistration, viewLink } from '../auth/enrol-link';
import {
  finishAddPasskey,
  finishStepUp,
  removePasskey,
  startAddPasskey,
  startStepUp,
} from '../auth/manage-passkeys';
import { parseAuthentication, parseRegistration } from '../auth/webauthn-json';
import { authDeps } from '../auth/wiring';
import { MI_ACCESO_PATH } from '../gate';
import { requireStaff } from '../staff';

/**
 * The printed enrolment link's page and «Mi acceso» (N-85, ADR-160). The
 * link's token comes from the URL fragment, so it never reaches a request
 * line or a log; the page hands it to these calls in the body.
 *
 * «Mi acceso» re-applies the gate in every call (`requireStaff`), and the
 * use cases refuse an add or a removal without a tap in the last 5 minutes.
 */
export type EnlaceState =
  | { readonly kind: 'valido'; readonly nombre: string; readonly vence: string }
  | { readonly kind: 'vencido' | 'usado' | 'invalido' };

export async function estadoEnlace(token: string): Promise<EnlaceState> {
  const view = await viewLink(authDeps(), String(token));
  if (view.state !== 'valido') return { kind: view.state };
  return { kind: 'valido', nombre: view.nombre, vence: view.expiresAt.toISOString() };
}

export type RegistroStart =
  | { readonly kind: 'opciones'; readonly options: PublicKeyCredentialCreationOptionsJSON }
  | { readonly kind: 'vencido' | 'usado' | 'invalido' };

export async function opcionesRegistro(token: string): Promise<RegistroStart> {
  const started = await startLinkRegistration(authDeps(), String(token));
  if (started.kind === 'refused') return { kind: started.view.state };
  return { kind: 'opciones', options: started.options };
}

export type RegistroResult =
  | { readonly kind: 'lista'; readonly nombre: string }
  | { readonly kind: 'fallida' }
  | { readonly kind: 'enlace' };

export async function registrarConEnlace(token: string, answer: unknown): Promise<RegistroResult> {
  const response = parseRegistration(answer);
  if (response === null) return { kind: 'fallida' };
  const result = await finishLinkRegistration(authDeps(), String(token), response);
  if (result.kind === 'ok') return { kind: 'lista', nombre: result.nombre };
  console.error(`[enlace] failed (${result.reason})`);
  return result.reason === 'link' ? { kind: 'enlace' } : { kind: 'fallida' };
}

export type AgregarStart =
  | { readonly kind: 'opciones'; readonly options: PublicKeyCredentialCreationOptionsJSON }
  | { readonly kind: 'confirmar' };

export async function prepararAgregar(): Promise<AgregarStart> {
  const { session } = await requireStaff();
  const started = await startAddPasskey(authDeps(), session);
  return started.kind === 'stepup'
    ? { kind: 'confirmar' }
    : { kind: 'opciones', options: started.options };
}

export async function opcionesReconfirmar(): Promise<PublicKeyCredentialRequestOptionsJSON> {
  const { session } = await requireStaff();
  return startStepUp(authDeps(), session);
}

export async function reconfirmar(answer: unknown): Promise<boolean> {
  const { session, token } = await requireStaff();
  const response = parseAuthentication(answer);
  return response !== null && finishStepUp(authDeps(), session, token, response);
}

export type AgregarResult =
  | { readonly kind: 'lista'; readonly nombre: string }
  | { readonly kind: 'confirmar' }
  | { readonly kind: 'fallida' };

export async function agregarLlave(answer: unknown): Promise<AgregarResult> {
  const { session } = await requireStaff();
  const response = parseRegistration(answer);
  if (response === null) return { kind: 'fallida' };
  const result = await finishAddPasskey(authDeps(), session, response);
  if (result.kind === 'ok') revalidatePath(MI_ACCESO_PATH);
  if (result.kind === 'stepup') return { kind: 'confirmar' };
  return result.kind === 'ok' ? { kind: 'lista', nombre: result.nombre } : { kind: 'fallida' };
}

export type QuitarResult = 'quitada' | 'confirmar' | 'ultima' | 'no-existe';

export async function quitarLlave(passkeyId: string): Promise<QuitarResult> {
  const { session } = await requireStaff();
  const outcome = await removePasskey(authDeps(), session, String(passkeyId));
  if (outcome === 'removed') revalidatePath(MI_ACCESO_PATH);
  const names = {
    removed: 'quitada',
    stepup: 'confirmar',
    last: 'ultima',
    missing: 'no-existe',
  } as const;
  return names[outcome];
}
