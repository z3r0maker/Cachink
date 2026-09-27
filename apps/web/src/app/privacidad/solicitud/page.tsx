import type { Metadata } from 'next';

import { PantallaArco } from './pantalla';

/**
 * `/privacidad/solicitud` — the public ARCO form (N-34). Anyone can use it,
 * with or without an account: acceso, rectificación, cancelación, oposición,
 * or revoking consent. The aviso integral names this address.
 */
export const metadata: Metadata = {
  title: 'Solicitud de derechos ARCO · Xangarro',
  robots: { index: false, follow: false },
};

export default function SolicitudArcoPage() {
  return <PantallaArco />;
}
