import { redirect } from 'next/navigation';

import { MFA_PATH } from '@/server/gate';
import { prepareMfa } from '@/server/mfa';
import { requireStaffPage } from '@/server/staff';
import { supabaseServer } from '@/server/supabase/server';
import { body, card, centered, errorText, heading, muted } from '@/styles/ui.css';

import { qr as qrClass, secret as secretClass } from './mfa.css';
import { TotpForm } from './form';

/**
 * Mandatory TOTP (AAL2) for every staff member. First visit enrols a factor;
 * every later session is challenged. Reached only by allowlisted users — the
 * gate forbids everyone else before MFA is ever offered.
 */
export default async function MfaPage() {
  const { identity } = await requireStaffPage(MFA_PATH);
  const view = await prepareMfa(await supabaseServer(), identity.aal);
  if (view.step === 'done') redirect('/');

  return (
    <main className={centered}>
      <section className={card} aria-labelledby="mfa-title">
        <h1 id="mfa-title" className={heading}>
          Verificación en dos pasos
        </h1>
        {view.step === 'error' ? <p className={errorText}>{view.message}</p> : null}
        {view.step === 'enrol' ? (
          <>
            <p className={body}>
              La consola exige un código de una app de autenticación. Escanea este código QR con tu
              app (1Password, Google Authenticator, Authy…) y escribe el código que muestra.
            </p>
            {/* A `data:` SVG from Supabase; allowed by `img-src data:` and nothing wider. */}
            <img className={qrClass} src={view.qr} alt="Código QR para tu app de autenticación" />
            <p className={muted}>
              ¿No puedes escanear? Escribe esta clave:{' '}
              <code className={secretClass}>{view.secret}</code>
            </p>
            <TotpForm factorId={view.factorId} />
          </>
        ) : null}
        {view.step === 'challenge' ? (
          <>
            <p className={body}>Escribe el código que muestra tu app de autenticación.</p>
            <TotpForm factorId={view.factorId} />
          </>
        ) : null}
      </section>
    </main>
  );
}
