import { redirect } from 'next/navigation';

import { readSession } from '@/server/session';

import { LoginForm } from './form';

/**
 * Sign in.
 *
 * Outside the `(portal)` group on purpose: it must render without the shell,
 * and without the shell's database reads, so a signed-out visitor never touches
 * a tenant query.
 */
export const dynamic = 'force-dynamic';

export default async function LoginPage() {
  if ((await readSession()) !== null) redirect('/');
  return <LoginForm />;
}
