import type { Metadata } from 'next';

import { enlaceDeConfirmacion } from '@/server/acceso/confirmacion';
import { accessDeps } from '@/server/acceso/live';

import { ConfirmarCorreo } from './confirmar';

export const metadata: Metadata = {
  title: 'Confirma tu correo · Xangarro',
  robots: { index: false },
};

/**
 * `/signup/confirmar?t=` — where the emailed link lands (N-83, board
 * SgConfirmar). The token is only **read** here: mail filters open links, so
 * the page asks for one tap and the tap is what confirms. A token that is
 * missing or malformed reads as unknown.
 */
export const dynamic = 'force-dynamic';

export default async function ConfirmarPage({
  searchParams,
}: {
  readonly searchParams: Promise<{ t?: string }>;
}) {
  const { t = '' } = await searchParams;
  const enlace =
    t === '' ? ({ estado: 'desconocido' } as const) : await enlaceDeConfirmacion(accessDeps(), t);
  return <ConfirmarCorreo token={t} enlace={enlace} />;
}
