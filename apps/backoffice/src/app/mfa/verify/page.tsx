import { Trastienda, Vale } from '@/components/trastienda/trastienda';
import { MFA_VERIFY_PATH } from '@/server/gate';
import { requireStaffPage } from '@/server/staff';
import { muted } from '@/styles/ui.css';

import { VerifyForm } from './form';

/** Every sign-in after the password: a TOTP code, or a recovery code. */
export default async function VerifyPage() {
  await requireStaffPage(MFA_VERIFY_PATH);
  return (
    <Trastienda mood="otp">
      <Vale
        eyebrow="Paso 2 de 2 · Verificación"
        title="Nomás el código y ya."
        titleId="mfa-title"
        intro="Escribe el código que muestra tu app de autenticación."
      >
        <VerifyForm />
        <p className={muted}>
          ¿Perdiste tu teléfono? Escribe uno de tus códigos de recuperación en el mismo campo.
        </p>
      </Vale>
    </Trastienda>
  );
}
