import 'server-only';

import type { Founder } from '@xangarro/data-corp';
import { notFound } from 'next/navigation';

import { founderLookup } from './db/corp';
import { founderForNav, founderOrNull } from './founder-gate';
import { NotPermitted, requireStaff, requireStaffPage, type StaffContext } from './staff';

/**
 * The founder gate on top of the staff gate (E-01, ADR-124 §1). Every
 * `/empresa` page and action calls one of these; the proxy knows nothing about
 * founders, so this is the only check, re-run on every request.
 *
 * A staff member who is not a founder gets a 404, not a 403: the area does not
 * exist for them, and a support hire should not learn that it does.
 */
export interface FounderContext extends StaffContext {
  readonly founder: Founder;
}

export async function requireFounderPage(): Promise<FounderContext> {
  const ctx = await requireStaffPage();
  const founder = await founderOrNull(ctx.staff.id, founderLookup());
  if (founder === null) notFound();
  return { ...ctx, founder };
}

/** For server actions: throws, so the caller can show why. */
export async function requireFounder(): Promise<FounderContext> {
  const ctx = await requireStaff();
  const founder = await founderOrNull(ctx.staff.id, founderLookup());
  if (founder === null) throw new NotPermitted('Solo los socios pueden hacer esto.');
  return { ...ctx, founder };
}

/** The console layout's question: draw the «Empresa» group for this staff member? */
export async function founderForLayout(staffId: string): Promise<Founder | null> {
  return founderForNav(staffId, founderLookup(), (error) => {
    console.error('[empresa] founder lookup failed; hiding the area', error);
  });
}
