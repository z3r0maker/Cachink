import type { Metadata } from 'next';
import { redirect } from 'next/navigation';

import { leerReto } from '@/server/acceso/cookies';
import { accessDeps } from '@/server/acceso/live';
import { retoPendiente } from '@/server/acceso/segundo-paso';
import { readSession } from '@/server/session';

import { rutaDeDueno } from '../puertas';
import { SegundoPaso } from './segundo-paso';

export const metadata: Metadata = {
  title: 'Escribe tu código · Xangarro',
  robots: { index: false },
};

/**
 * `/login/verificar` — step 2 of 2 (N-83, board SgDesafio). Reached only with
 * the challenge a right password leaves behind; without it (never signed in,
 * ten minutes gone, already used) the visitor is sent back to the password.
 * There is no session on this page: that is the point of the step.
 */
export const dynamic = 'force-dynamic';

export default async function VerificarPage() {
  if ((await readSession()) !== null) redirect('/');
  if ((await retoPendiente(accessDeps(), await leerReto())) === null) redirect(rutaDeDueno);
  return <SegundoPaso />;
}
