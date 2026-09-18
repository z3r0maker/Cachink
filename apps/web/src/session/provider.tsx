'use client';

import { createContext, useContext, type ReactNode } from 'react';

import type { Session } from './types';

/**
 * The session, as the screens see it.
 *
 * Screens are client components, so they cannot read the cookie. The layout
 * resolves it once on the server and hands it down. That replaces the
 * module-level `SESSION` fixture that nine screens reached for directly —
 * a singleton that made them impossible to render as any other user, and that
 * silently made everyone the owner of Taquería Don Pedro.
 *
 * `role` and `businessId` are now real, from the signed cookie and
 * `business_members`. `planId`, `capabilities` and `features` are still
 * fixtures: they belong to the signed entitlement (B-06), which has no issuer
 * yet. The seam is here, so that lands as one change rather than nine.
 */
const SessionContext = createContext<Session | null>(null);

export function SessionProvider({
  session,
  children,
}: {
  readonly session: Session;
  readonly children: ReactNode;
}) {
  return <SessionContext.Provider value={session}>{children}</SessionContext.Provider>;
}

export function useSession(): Session {
  const session = useContext(SessionContext);
  if (session === null) {
    throw new Error('useSession outside SessionProvider — the portal layout provides it.');
  }
  return session;
}
