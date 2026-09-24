import type { Metadata } from 'next';

import { page, title } from '../../activar/activar.css';
import { FormularioArco } from './formulario';

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
  return (
    <main className={page}>
      <h1 className={title}>Tus datos personales: solicitud ARCO</h1>
      <p>
        Pide acceso a tus datos, corregirlos, cancelarlos, oponerte a un uso o retirar tu
        consentimiento. Te respondemos por correo en un máximo de 20 días hábiles.
      </p>
      <p>
        Para proteger tus datos, antes de actuar te pediremos por correo una identificación. Aviso
        de privacidad completo: <a href="https://xangarro.mx/privacidad">xangarro.mx/privacidad</a>.
      </p>
      <FormularioArco />
    </main>
  );
}
