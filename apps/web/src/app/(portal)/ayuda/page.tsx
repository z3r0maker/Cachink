import { requireMember } from '@/server/auth';

import { AyudaScreen } from './parts';

/** `/ayuda` (N-08): any signed-in member, any role — asking for help is never gated. */
export default async function AyudaPage() {
  await requireMember('viewer');
  return <AyudaScreen />;
}
