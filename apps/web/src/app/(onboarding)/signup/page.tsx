import { PLAN_IDS } from '@xangarro/domain';
import { redirect } from 'next/navigation';

import { readSession } from '@/server/session';

import { SignupForm } from './form';

/**
 * `/signup?plan=` — "Crea tu negocio" (P-03, reordered by N-13). Outside the
 * `(portal)` shell: a visitor has no business yet. `?plan=` is only a
 * preselection carried to "Tu plan ideal"; an unknown slug is dropped
 * (ADR-059: invalid → the free plan).
 */
export const dynamic = 'force-dynamic';

export default async function SignupPage({
  searchParams,
}: {
  readonly searchParams: Promise<Readonly<{ plan?: string }>>;
}) {
  if ((await readSession()) !== null) redirect('/');
  const { plan } = await searchParams;
  return <SignupForm plan={PLAN_IDS.find((p) => p === plan) ?? null} />;
}
