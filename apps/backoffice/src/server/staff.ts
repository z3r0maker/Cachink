import 'server-only';

import { redirect } from 'next/navigation';

import { readSessionToken } from './auth/cookie';
import type { StaffSession } from './auth/ports';
import type { ActiveStaff } from './db/staff';
import { FORBIDDEN_PATH, type GateDecision } from './gate';
import { resolveGate } from './resolve-gate';

/**
 * The server-side half of the gate. `src/proxy.ts` is an optimistic check on
 * page requests; this re-applies the **same** `decideAccess` wherever it
 * matters — inside every server action (which can be invoked directly) and in
 * the console layout.
 */
export class NotPermitted extends Error {
  readonly code = 'NOT_PERMITTED';
  constructor(message: string) {
    super(message);
    this.name = 'NotPermitted';
  }
}

export interface StaffContext {
  readonly staff: ActiveStaff;
  readonly session: StaffSession;
  /** The raw cookie token — the MFA step replaces it with an AAL2 one. */
  readonly token: string;
}

/** Any console path that is neither public nor an MFA step: the full gate applies. */
const CONSOLE_PATH = '/';

async function evaluate(
  path: string,
): Promise<{ decision: GateDecision; ctx: StaffContext | null }> {
  const token = await readSessionToken();
  const { decision, session } = await resolveGate(token, path);
  if (session === null || token === undefined || decision.kind !== 'allow') {
    return { decision, ctx: null };
  }
  const staff = { id: session.staffId, email: session.email, nombre: session.nombre };
  return { decision, ctx: { staff, session, token } };
}

/** For server actions: throws rather than redirecting, so the caller can show why. */
export async function requireStaff(): Promise<StaffContext> {
  const { ctx } = await evaluate(CONSOLE_PATH);
  if (ctx === null) throw new NotPermitted('Tu sesión no tiene acceso a la consola.');
  return ctx;
}

/**
 * For layouts, pages and the MFA actions: follows the gate's redirect. With
 * an MFA path it admits an allowlisted member still at AAL1 — on the one MFA
 * step the gate assigns them.
 */
export async function requireStaffPage(path: string = CONSOLE_PATH): Promise<StaffContext> {
  const { decision, ctx } = await evaluate(path);
  if (ctx !== null) return ctx;
  if (decision.kind === 'redirect') redirect(decision.to);
  redirect(FORBIDDEN_PATH);
}
