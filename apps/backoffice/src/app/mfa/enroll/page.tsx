import { Trastienda, Vale } from '@/components/trastienda/trastienda';
import { prepareEnrolment } from '@/server/auth/enrolment';
import { groupKey, qrDataUri } from '@/server/auth/qr';
import { authDeps } from '@/server/auth/wiring';
import { MFA_ENROLL_PATH } from '@/server/gate';
import { requireStaffPage } from '@/server/staff';
import { body, errorText, muted } from '@/styles/ui.css';

import { qr as qrClass, secret as secretClass } from '../mfa.css';
import { EnrolForm } from './form';

/**
 * First sign-in: register an authenticator app. The gate admits only an
 * allowlisted AAL1 session with no confirmed authenticator, so this page can
 * never be used to replace an existing one.
 */
export default async function EnrollPage() {
  const { session } = await requireStaffPage(MFA_ENROLL_PATH);
  const view = await prepareEnrolment(authDeps(), session);

  return (
    <Trastienda mood="enroll">
      <Vale
        eyebrow="Primera vez · Verificación en dos pasos"
        title="Ponle candado a tu cuenta."
        titleId="mfa-title"
      >
        {view === null ? (
          <p className={errorText}>
            No pudimos preparar la verificación en dos pasos. Recarga la página.
          </p>
        ) : (
          <>
            <p className={body}>
              La consola exige un código de una app de autenticación. Escanea este código QR con tu
              app (1Password, Google Authenticator, Authy…) y escribe el código que muestra.
            </p>
            {/* Rendered on the server; allowed by `img-src data:` and nothing wider. */}
            <img
              className={qrClass}
              src={qrDataUri(view.uri)}
              alt="Código QR para tu app de autenticación"
            />
            <p className={muted}>
              ¿No puedes escanear? Escribe esta clave:{' '}
              <code className={secretClass}>{groupKey(view.secret)}</code>
            </p>
            <EnrolForm />
          </>
        )}
      </Vale>
    </Trastienda>
  );
}
