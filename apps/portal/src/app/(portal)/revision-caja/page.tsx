import { requireSession } from '@/server/auth';

import { REVISION_FIXTURE } from './fixture';
import { RevisionScreen } from './screen';
import type { Pestana } from './types';

/**
 * Revisión de caja (O-30). Owner-only, like every portal screen. Fixture data
 * until the review status on products and clients exists (ADR-074 §2, C-18);
 * `?startTab=clientes` is the design's forcing, development only.
 */
export const dynamic = 'force-dynamic';

export default async function RevisionCajaPage({
  searchParams,
}: {
  readonly searchParams: Promise<{ readonly startTab?: string }>;
}) {
  await requireSession();
  const { startTab } = await searchParams;
  const tab: Pestana =
    process.env.NODE_ENV !== 'production' && startTab === 'clientes' ? 'clientes' : 'productos';
  return <RevisionScreen data={REVISION_FIXTURE} tab={tab} />;
}
