'use server';

import { clientIp, minutes, type PublicKeyCredentialRequestOptionsJSON } from '@xangarro/auth-core';
import { headers } from 'next/headers';
import { redirect } from 'next/navigation';

import { clearSessionCookie, readSessionToken, setSessionCookie } from '../auth/cookie';
import { classifyInfraFailure, infraFailureMessage } from '../auth/infra-failure';
import { finishSignIn, signOut, startSignIn } from '../auth/sign-in-passkey';
import { answerIssues, parseAuthentication } from '../auth/webauthn-json';
import { authDeps } from '../auth/wiring';
import { dbFingerprint } from '../db/fingerprint';
import { LOGIN_PATH } from '../gate';
import { reportError } from '../observability/report';
import { resolveGate } from '../resolve-gate';

/**
 * Sign-in with a passkey (N-85, ADR-160), as the two calls the login page
 * makes around the browser's own prompt: the options, then the answer.
 *
 * What the page may say is deliberately thin: a refused passkey is one
 * sentence whatever the reason, so the page never confirms whether a key
 * belongs to the team. Every refusal logs its reason server-side.
 */
export type EntradaState =
  | { readonly kind: 'opciones'; readonly options: PublicKeyCredentialRequestOptionsJSON }
  | { readonly kind: 'rechazada' }
  | { readonly kind: 'bloqueada'; readonly minutos: number }
  | { readonly kind: 'error'; readonly message: string };

const diagnostics = () => ({ on: process.env.ADMIN_DIAGNOSTICS === '1', db: dbFingerprint() });

/**
 * A throw from here is a misconfigured deployment, not a bad passkey: a
 * `DATABASE_URL` the database rejects, an `ADMIN_BASE_URL` that is not a URL.
 * Turning it into a state keeps the page on screen and the cause in the logs.
 */
function infra(error: unknown, step: string): Extract<EntradaState, { kind: 'error' }> {
  const failure = classifyInfraFailure(error);
  reportError(
    error,
    `[login:${step}] infra ${failure.cause}/${failure.detail} db=${dbFingerprint()}`,
  );
  return { kind: 'error', message: infraFailureMessage(failure, diagnostics()) };
}

export async function opcionesEntrada(): Promise<EntradaState> {
  try {
    const started = await startSignIn(authDeps(), clientIp(await headers()));
    if (started.kind === 'locked') return { kind: 'bloqueada', minutos: minutes(started.wait) };
    return { kind: 'opciones', options: started.options };
  } catch (error) {
    return infra(error, 'opciones');
  }
}

/** The browser's answer. On success the cookie is set and the page goes to `/`. */
export async function entrarConLlave(
  answer: unknown,
): Promise<Exclude<EntradaState, { kind: 'opciones' }>> {
  const ip = clientIp(await headers());
  const response = parseAuthentication(answer);
  if (response === null) {
    console.error(`[login] malformed answer (${answerIssues(answer, 'authentication')}) ip=${ip}`);
    return { kind: 'rechazada' };
  }
  let result;
  try {
    result = await finishSignIn(authDeps(), response, ip);
  } catch (error) {
    return infra(error, 'entrar');
  }
  if (result.kind === 'locked') return { kind: 'bloqueada', minutos: minutes(result.wait) };
  if (result.kind === 'failed') {
    console.error(`[login] failed (${result.reason}) ip=${ip} db=${dbFingerprint()}`);
    return { kind: 'rechazada' };
  }
  await setSessionCookie(result.token);
  redirect('/');
}

/**
 * Signing out always ends at the login page with the cookie gone. A database
 * that cannot record the revocation must not strand a staff member in a
 * session they asked to end, so the server-side half is best-effort and
 * logged; the cookie is what the browser actually holds.
 */
export async function logout(): Promise<never> {
  const token = await readSessionToken();
  try {
    const { session } = await resolveGate(token, LOGIN_PATH);
    await signOut(authDeps(), token, session?.staffId ?? null);
  } catch (error) {
    const failure = classifyInfraFailure(error);
    reportError(error, `[logout] infra ${failure.cause}/${failure.detail}`);
  }
  await clearSessionCookie();
  redirect(LOGIN_PATH);
}
