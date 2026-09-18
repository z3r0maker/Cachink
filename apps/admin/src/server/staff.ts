import 'server-only';

import { redirect } from 'next/navigation';

import type { ActiveStaff } from './db/staff';
import { FORBIDDEN_PATH, type GateDecision } from './gate';
import { resolveGate } from './resolve-gate';
import type { Identity } from './supabase/identity';
import { supabaseServer } from './supabase/server';

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
  readonly identity: Identity;
  readonly staff: ActiveStaff;
}

/** Any console path that is neither public nor /mfa: the full gate applies. */
const CONSOLE_PATH = '/';

async function evaluate(
  path: string,
): Promise<{ decision: GateDecision; ctx: StaffContext | null }> {
  const { decision, identity, staff } = await resolveGate(await supabaseServer(), path);
  const ctx = identity && staff && decision.kind === 'allow' ? { identity, staff } : null;
  return { decision, ctx };
}

/** For server actions: throws rather than redirecting, so the caller can show why. */
export async function requireStaff(): Promise<StaffContext> {
  const { ctx } = await evaluate(CONSOLE_PATH);
  if (ctx === null) throw new NotPermitted('Tu sesión no tiene acceso a la consola.');
  return ctx;
}

/**
 * For layouts, pages and the /mfa action: follows the gate's redirect.
 * With `MFA_PATH` it admits an allowlisted user who is still at AAL1.
 */
export async function requireStaffPage(path: string = CONSOLE_PATH): Promise<StaffContext> {
  const { decision, ctx } = await evaluate(path);
  if (ctx !== null) return ctx;
  if (decision.kind === 'redirect') redirect(decision.to);
  redirect(FORBIDDEN_PATH);
}
