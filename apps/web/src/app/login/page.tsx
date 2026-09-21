import { redirect } from 'next/navigation';

import { readSession } from '@/server/session';

import { LoginDoor } from './door';

/**
 * Sign in.
 *
 * Outside the `(portal)` group on purpose: it must render without the shell,
 * and without the shell's database reads, so a signed-out visitor never touches
 * a tenant query. The two doors come first; the member form is one click in.
 */
export const dynamic = 'force-dynamic';

export default async function LoginPage() {
  if ((await readSession()) !== null) redirect('/');
  return <LoginDoor />;
}
