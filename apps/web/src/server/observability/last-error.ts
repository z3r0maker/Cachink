import 'server-only';

import { isPlausibleToken } from '@xangarro/auth-core';
import { describeError } from '@xangarro/config/error-report';
import { noteSessionError, sessionLastError, type SessionLastError } from '@xangarro/data-pg';
import { after } from 'next/server';

import { db } from '../db';
import { SESSION_COOKIE, sessionToken } from '../session';

/**
 * The last error a portal session was shown (P-48, ADR-162 §8).
 *
 * When `reportError` sends an error to Sentry, the event's id is kept with
 * the session **on the server** (`xangarro.portal_sessions`, migration 0061),
 * so «Algo no funciona» in Ayuda can file a report that names it. The id
 * never travels in a URL and the browser never chooses it.
 *
 * Keeping it is a courtesy to a later report: it runs after the response,
 * never throws, and a failure here is one log line, not a second incident.
 * There is nothing to keep while Sentry is off (`reportError` then returns no
 * id), so local runs and CI write nothing.
 */
type CookieHeader = string | readonly string[] | undefined;

const logged = (evt: string, error: unknown): void => {
  console.error(JSON.stringify({ evt, ...describeError(error) }));
};

/** The session token in a raw `cookie` header; null when it carries none of ours. */
export function tokenFromCookieHeader(header: CookieHeader): string | null {
  const pairs = (typeof header === 'string' ? [header] : (header ?? []))
    .flatMap((line) => line.split(';'))
    .map((pair) => pair.trim());
  const prefix = `${SESSION_COOKIE}=`;
  const value = pairs.find((pair) => pair.startsWith(prefix))?.slice(prefix.length);
  return isPlausibleToken(value) ? value : null;
}

/** Keep `eventId` with the session `token` names. For `onRequestError`, which holds the raw request. */
export async function keepLastErrorFor(
  token: string | null,
  eventId: string | undefined,
): Promise<void> {
  if (token === null || eventId === undefined) return;
  try {
    await noteSessionError(db(), token, eventId);
  } catch (error) {
    logged('last_error_not_kept', error);
  }
}

/**
 * Keep `eventId` with the session of the request that is running. For
 * `failure()`, inside a server action: the write waits for the response
 * (`after`), and outside a request there is no session to keep it with.
 */
export function keepLastError(eventId: string | undefined): void {
  if (eventId === undefined) return;
  const task = async (): Promise<void> => {
    const token = await sessionToken().catch(() => null);
    await keepLastErrorFor(token, eventId);
  };
  try {
    after(task);
  } catch {
    void task();
  }
}

/** What the running request's session was last shown; null when nothing, or when it cannot be read. */
export async function lastErrorOfSession(): Promise<SessionLastError | null> {
  try {
    const token = await sessionToken();
    return token === null ? null : await sessionLastError(db(), token);
  } catch (error) {
    logged('last_error_not_read', error);
    return null;
  }
}
