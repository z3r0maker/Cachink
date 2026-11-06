import type { Metadata } from 'next';

import { liveCancelLink } from '@/server/billing/live';
import { reportError } from '@/server/observability/report';

import { MarcoPublico } from '../_publico/marco';
import { CancelarEnlace } from './enlace';

/**
 * The renewal reminder's one-click cancel (LFPC 76 Bis, ADR-132): public, no
 * session. Opening the link only reads; the tap cancels (mail scanners open
 * links on their own).
 */
export const dynamic = 'force-dynamic';
export const metadata: Metadata = {
  title: 'Cancelar tu suscripción · Xangarro',
  robots: { index: false, follow: false },
};

async function vista(token: string) {
  try {
    return await liveCancelLink().peek(token);
  } catch (error) {
    reportError(error, { endpoint: 'cancelar' });
    return null;
  }
}

export default async function CancelarPage({
  searchParams,
}: {
  readonly searchParams: Promise<{ t?: string }>;
}) {
  const { t = '' } = await searchParams;
  return (
    <MarcoPublico
      pose="quieto"
      titulo="Tus registros siempre son tuyos."
      bajada="Cancelar no borra nada. Sigues entrando gratis con Xangarrito cuando quieras."
    >
      <CancelarEnlace token={t} inicial={await vista(t)} />
    </MarcoPublico>
  );
}
