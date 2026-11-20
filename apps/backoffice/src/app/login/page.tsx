import { Trastienda, Vale } from '@/components/trastienda/trastienda';

import { Entrada } from './entrada';

/** The console's entrance (board CD-20, ADR-160): one passkey tap, no email, no password. */
export default function LoginPage() {
  return (
    <Trastienda mood="idle">
      <Vale
        eyebrow="Vale de entrada"
        title="Pásale a la trastienda."
        titleId="login-title"
        intro="Solo para el equipo de Xangarro. Entras con la llave de acceso de tu teléfono o tu computadora: Face ID, Touch ID o el PIN del equipo."
      >
        <Entrada />
      </Vale>
    </Trastienda>
  );
}
