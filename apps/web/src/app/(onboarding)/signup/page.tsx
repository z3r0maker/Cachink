import { PLAN_IDS } from '@xangarro/domain';
import { redirect } from 'next/navigation';

import { parseUtm } from '@/server/attribution/utm';
import { readSession } from '@/server/session';

import { SignupForm } from './form';

/**
 * `/signup?plan=` — "Crea tu negocio" (P-03, reordered by N-13). Outside the
 * `(portal)` shell: a visitor has no business yet. `?plan=` is only a
 * preselection carried to "Tu plan ideal"; an unknown slug is dropped
 * (ADR-059: invalid → the free plan).
 *
 * The `utm_*` params the landing appends (N-57) are parsed here and handed to
 * the form, which returns them with the signup — the same route `plan`
 * already takes.
 */
export const dynamic = 'force-dynamic';

export default async function SignupPage({
  searchParams,
}: {
  readonly searchParams: Promise<Readonly<Record<string, string | string[] | undefined>>>;
}) {
  if ((await readSession()) !== null) redirect('/');
  const params = await searchParams;
  const plan = typeof params.plan === 'string' ? params.plan : undefined;
  return <SignupForm plan={PLAN_IDS.find((p) => p === plan) ?? null} utm={parseUtm(params)} />;
}
