import { PLAN_IDS } from '@xangarro/domain';
import type { Metadata } from 'next';
import { redirect } from 'next/navigation';

import { parseUtm } from '@/server/attribution/utm';
import { readSession } from '@/server/session';

import { SignupForm } from './form';

/** One of the two portal pages a search engine may index (see app/robots.ts). */
export const metadata: Metadata = {
  title: 'Crea tu cuenta gratis · Xangarro',
  description:
    'Abre tu negocio en Xangarro sin tarjeta: caja, punto de venta y estados financieros NIF desde el navegador. Gratis para empezar.',
};

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
