'use server';

import { clientIp, throttleKey } from '@xangarro/auth-core';
import { throttleTake } from '@xangarro/data-pg';
import { headers } from 'next/headers';

import { aplicarEntrada, type Destino } from '../acceso/aplicar';
import { confirmar, corregir, reenviar, reenviarVencido } from '../acceso/confirmacion';
import { leerPase } from '../acceso/cookies';
import { accessDeps } from '../acceso/live';
import { failure } from '../action-errors';
import { db } from '../db';

/**
 * Confirming a new account's address (N-83, ADR-142; boards SgRevisaCorreo and
 * SgConfirmar). None of these has a session to check: the first spends a
 * 256-bit emailed link, the second and fourth need the pending pass the signup
 * browser holds in an `httpOnly` cookie, and the third names an expired link.
 * The three that send email are throttled per address and per IP.
 */
export type ConfirmacionResult =
  | Destino
  | {
      readonly ok: false;
      readonly message: string;
      readonly estado: 'vencido' | 'usado' | 'desconocido';
    };
/** `limite`: too many emails for now, a wait and not a fault. */
export type ReenvioResult = { ok: true } | { ok: false; message: string; limite?: true };
export type CorregirResult =
  | { ok: true; email: string }
  | { ok: false; message: string; limite?: true };

const LIMITE = 'Pediste varios enlaces seguidos. Vuelve a intentar en 15 min.';
const NO_ENVIADO = 'No pudimos mandar el correo. Tu cuenta ya está creada. Intenta otra vez.';
const SIN_PASE =
  'Tu registro ya no está abierto en este navegador. Entra con tu correo y tu contraseña.';
const NO_SIRVE = 'Este enlace ya no sirve. Pide otro.';
const EN_LIMITE = { ok: false, message: LIMITE, limite: true } as const;
const PER_IP = 10;
const WINDOW = 15 * 60;

async function ipLibre(): Promise<boolean> {
  const key = throttleKey('confirm', 'ip', clientIp(await headers()));
  return (await throttleTake(db(), key, PER_IP, WINDOW)) === 0;
}

/** The button on the page the emailed link opens. Opening the page confirms nothing. */
export async function confirmarCorreo(token: string): Promise<ConfirmacionResult> {
  try {
    const result = await confirmar(accessDeps(), token);
    if (result.kind === 'enlace') return { ok: false, message: NO_SIRVE, estado: result.estado };
    return await aplicarEntrada(result);
  } catch (error) {
    return failure(error, 'confirmarCorreo', {
      retry: 'No pudimos confirmar tu correo y no se cambió nada. Intenta otra vez.',
    });
  }
}

/** «Mandar otro enlace» on «Revisa tu correo». */
export async function reenviarConfirmacion(): Promise<ReenvioResult> {
  try {
    if (!(await ipLibre())) return EN_LIMITE;
    const sent = await reenviar(accessDeps(), await leerPase());
    if (sent === 'sin-pase') return { ok: false, message: SIN_PASE };
    return sent === 'limite' ? EN_LIMITE : { ok: true };
  } catch (error) {
    return failure(error, 'reenviarConfirmacion', { retry: NO_ENVIADO });
  }
}

/** «Mandar otro enlace» on an expired link's page: it goes to that link's own account. */
export async function reenviarEnlaceVencido(token: string): Promise<ReenvioResult> {
  try {
    if (!(await ipLibre())) return EN_LIMITE;
    const sent = await reenviarVencido(accessDeps(), token);
    // `no`: confirmed already, or unknown. Answered like a send, so the page tells a stranger nothing.
    return sent === 'limite' ? EN_LIMITE : { ok: true };
  } catch (error) {
    return failure(error, 'reenviarEnlaceVencido', { retry: NO_ENVIADO });
  }
}

const MOTIVO = {
  'sin-pase': SIN_PASE,
  correo: 'Escribe un correo válido.',
  ocupado: 'No pudimos usar ese correo. Si ya tienes una cuenta con él, entra con tu contraseña.',
} as const;

/** «Corregir mi correo»: only for the pass holder, only while unconfirmed. */
export async function corregirCorreo(email: string): Promise<CorregirResult> {
  try {
    if (!(await ipLibre())) return EN_LIMITE;
    const result = await corregir(accessDeps(), await leerPase(), email);
    if (result.kind === 'limite') return EN_LIMITE;
    if (result.kind !== 'ok') return { ok: false, message: MOTIVO[result.kind] };
    return result.enviado ? { ok: true, email: result.email } : EN_LIMITE;
  } catch (error) {
    return failure(error, 'corregirCorreo', { retry: NO_ENVIADO });
  }
}
