import type { Metadata } from 'next';

import { liveCancelarEliminacion } from '@/server/cuenta/live';
import { reportError } from '@/server/observability/report';

import { Deshacer } from './deshacer';
import { MarcoEliminacion } from './marco';

/**
 * «Cancelar la eliminación» from a deletion email (ElProgramada, ADR-136):
 * public, no session. Opening the link only reads; the tap undoes.
 */
export const dynamic = 'force-dynamic';
export const metadata: Metadata = {
  title: 'Conservar tu cuenta · Xangarro',
  robots: { index: false, follow: false },
};

async function vista(token: string) {
  try {
    return await liveCancelarEliminacion().peek(token);
  } catch (error) {
    reportError(error, { endpoint: 'eliminacion' });
    return null;
  }
}

export default async function EliminacionPage({
  searchParams,
}: {
  readonly searchParams: Promise<{ t?: string }>;
}) {
  const { t = '' } = await searchParams;
  return (
    <MarcoEliminacion>
      <Deshacer token={t} inicial={await vista(t)} />
    </MarcoEliminacion>
  );
}
