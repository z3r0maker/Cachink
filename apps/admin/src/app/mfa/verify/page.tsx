import { MFA_VERIFY_PATH } from '@/server/gate';
import { requireStaffPage } from '@/server/staff';
import { body, card, centered, heading, muted } from '@/styles/ui.css';

import { VerifyForm } from './form';

/** Every sign-in after the password: a TOTP code, or a recovery code. */
export default async function VerifyPage() {
  await requireStaffPage(MFA_VERIFY_PATH);
  return (
    <main className={centered}>
      <section className={card} aria-labelledby="mfa-title">
        <h1 id="mfa-title" className={heading}>
          Verificación en dos pasos
        </h1>
        <p className={body}>Escribe el código que muestra tu app de autenticación.</p>
        <VerifyForm />
        <p className={muted}>
          ¿Perdiste tu teléfono? Escribe uno de tus códigos de recuperación en el mismo campo.
        </p>
      </section>
    </main>
  );
}
