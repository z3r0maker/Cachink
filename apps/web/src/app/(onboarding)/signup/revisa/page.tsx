import type { Metadata } from 'next';
import { redirect } from 'next/navigation';

import { rutaDeDueno } from '@/app/login/puertas';
import { pasePendiente } from '@/server/acceso/confirmacion';
import { leerPase } from '@/server/acceso/cookies';
import { accessDeps } from '@/server/acceso/live';
import { readSession } from '@/server/session';

import { RevisaCorreo } from './revisa';

export const metadata: Metadata = {
  title: 'Revisa tu correo · Xangarro',
  robots: { index: false },
};

/**
 * `/signup/revisa` — «Revisa tu correo» (N-83, board SgRevisaCorreo). The
 * account exists and has no session: it waits on the emailed link. Only the
 * browser holding the pending pass sees this page (the one that signed up, or
 * one that just typed the right password); anyone else is sent to sign in.
 * `?desde=entrar` words it for the second case.
 */
export const dynamic = 'force-dynamic';

export default async function RevisaPage({
  searchParams,
}: {
  readonly searchParams: Promise<{ desde?: string }>;
}) {
  if ((await readSession()) !== null) redirect('/');
  const pendiente = await pasePendiente(accessDeps(), await leerPase());
  if (pendiente === null) redirect(rutaDeDueno);
  const { desde } = await searchParams;
  return <RevisaCorreo email={pendiente.email} alEntrar={desde === 'entrar'} />;
}
