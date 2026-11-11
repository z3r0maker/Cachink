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

export interface EmailConfirmationEmailProps {
  readonly url: string;
  /** How long the link works, in hours. */
  readonly expiresInHours: number;
  /** The person's own name; null greets with «Hola:». */
  readonly name: string | null;
  readonly nombreNegocio: string;
}

const CONFIRM_REASON =
  'Recibes este correo porque alguien creó una cuenta de Xangarro con esta dirección.';

/**
 * «Confirma tu correo» (N-83, board SgCorreo): sent at signup, on «Mandar otro
 * enlace» and when someone signs in before confirming. It replaces the welcome
 * as the first email; the welcome goes out once the address is confirmed.
 */
export function EmailConfirmationEmail(p: EmailConfirmationEmailProps) {
  return (
    <Layout preview="Un toque y tu negocio queda listo." reason={CONFIRM_REASON}>
      <P>{p.name ? `Hola, ${p.name}:` : 'Hola:'}</P>
      <P>
        Creaste una cuenta de Xangarro para {p.nombreNegocio}. Confirma que este correo es tuyo para
        abrir tu changarro.
      </P>
      <Cta href={p.url}>Confirmar mi correo</Cta>
      <P>
        El enlace funciona una sola vez durante {p.expiresInHours} horas. Si no creaste esta cuenta,
        ignora este correo: sin confirmar, nadie puede entrar con tu dirección.
      </P>
      <Fallback url={p.url} />
    </Layout>
  );
}

export function renderEmailConfirmationEmail(
  p: EmailConfirmationEmailProps,
): Promise<EmailContent> {
  return renderEmail('Confirma tu correo de Xangarro', <EmailConfirmationEmail {...p} />);
}

export function renderPasswordResetEmail(p: AuthLinkEmailProps): Promise<EmailContent> {
  return renderEmail('Restablece tu contraseña de Xangarro', <PasswordResetEmail {...p} />);
}

export function renderMagicLinkEmail(p: AuthLinkEmailProps): Promise<EmailContent> {
  return renderEmail('Tu enlace para entrar a Xangarro', <MagicLinkEmail {...p} />);
}
