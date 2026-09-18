/**
 * Sign-in link and password reset (ADR-080): single-use, short-lived links
 * issued by the portal. The email only carries the URL it is given; the token
 * logic stays in the portal. Both say what to do if you did not ask.
 */
import { Link } from '@react-email/components';
import type { EmailContent } from '@xangarro/application/email';

import { renderEmail } from '../render.js';
import { Cta, Layout, P, Small } from './layout.js';

export interface AuthLinkEmailProps {
  readonly url: string;
  /** How long the link works, in minutes. */
  readonly expiresInMinutes: number;
}

const REASON = 'Recibes este correo porque alguien lo pidió desde el portal de Xangarro.';

function Fallback({ url }: { readonly url: string }) {
  return (
    <Small>
      Si el botón no funciona, copia este enlace en tu navegador: <Link href={url}>{url}</Link>
    </Small>
  );
}

export function PasswordResetEmail({ url, expiresInMinutes }: AuthLinkEmailProps) {
  return (
    <Layout preview="Crea una contraseña nueva para tu cuenta." reason={REASON}>
      <P>Hola:</P>
      <P>Pediste restablecer la contraseña de tu cuenta de Xangarro.</P>
      <Cta href={url}>Crear contraseña nueva</Cta>
      <P>
        El enlace funciona una sola vez durante {expiresInMinutes} minutos. Si no fuiste tú, ignora
        este correo: tu contraseña no cambia.
      </P>
      <Fallback url={url} />
    </Layout>
  );
}

export function MagicLinkEmail({ url, expiresInMinutes }: AuthLinkEmailProps) {
  return (
    <Layout preview="Entra al portal con un toque." reason={REASON}>
      <P>Hola:</P>
      <P>Usa este botón para entrar al portal de Xangarro.</P>
      <Cta href={url}>Entrar a Xangarro</Cta>
      <P>
        El enlace funciona una sola vez durante {expiresInMinutes} minutos. Si no lo pediste, ignora
        este correo: nadie entra sin él.
      </P>
      <Fallback url={url} />
    </Layout>
  );
}

export function renderPasswordResetEmail(p: AuthLinkEmailProps): Promise<EmailContent> {
  return renderEmail('Restablece tu contraseña de Xangarro', <PasswordResetEmail {...p} />);
}

export function renderMagicLinkEmail(p: AuthLinkEmailProps): Promise<EmailContent> {
  return renderEmail('Tu enlace para entrar a Xangarro', <MagicLinkEmail {...p} />);
}
