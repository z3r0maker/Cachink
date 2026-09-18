import 'server-only';

import { redirect } from 'next/navigation';

import type { Role } from '@/session/types';
import { readSession, type SessionClaims } from './session';

/**
 * The server-side half of role gating.
 *
 * `session/gating.ts` decides what a viewer *sees*; this decides what they may
 * *do*. Hiding a button is a courtesy — the affordance is absent so nobody is
 * invited to fail — but it is not a control: a viewer can still call a server
 * action directly. Every action that writes calls `requireMember` first, and
 * the check is on the session cookie the server signed, never on anything the
 * caller supplied.
 */
const RANK: Readonly<Record<Role, number>> = { viewer: 0, admin: 1, owner: 2 };

export class NotPermitted extends Error {
  readonly code = 'NOT_PERMITTED';
  constructor(message: string) {
    super(message);
    this.name = 'NotPermitted';
  }
}

/** The session, or a redirect to `/login`. For pages and layouts. */
export async function requireSession(): Promise<SessionClaims> {
  const session = await readSession();
  if (session === null) redirect('/login');
  return session;
}

/**
 * The session, if it clears `minRole`. For server actions.
 *
 * Throws rather than redirecting: an action's caller needs a result it can show
 * the user, and a redirect mid-action is not that.
 */
export async function requireMember(minRole: Role = 'admin'): Promise<SessionClaims> {
  const session = await readSession();
  if (session === null) throw new NotPermitted('Inicia sesión para continuar.');
  if (RANK[session.member_role] < RANK[minRole]) {
    throw new NotPermitted('Tu cuenta es de solo lectura. Pide acceso al dueño del negocio.');
  }
  return session;
}
