/**
 * «Bienvenido» (B-14): sent once, right after the account exists. Three
 * steps in the order the «¿Cómo empiezo?» checklist tracks them, and one
 * link — to that checklist, not to a plan page (ADR-069: selling happens in
 * the portal, and this email's job is the first venta, not the first cobro).
 */
import type { EmailContent } from '@xangarro/application/email';

import { renderEmail } from '../render.js';
import { Cta, Layout, P, Small } from './layout.js';

export interface WelcomeEmailProps {
  readonly name: string | null;
  readonly nombreNegocio: string;
  /** The portal's «¿Cómo empiezo?» page. */
  readonly comoEmpiezoUrl: string;
}

const hola = (name: string | null) => (name ? `Hola, ${name}:` : 'Hola:');

export function WelcomeEmail(p: WelcomeEmailProps) {
  return (
    <Layout preview={`${p.nombreNegocio} ya está en Xangarro. Tres pasos y estás vendiendo.`}>
      <P>{hola(p.name)}</P>
      <P>{p.nombreNegocio} ya está en Xangarro. Para vender hoy mismo, en este orden:</P>
      <P>1. Agrega tus productos, o impórtalos desde Excel.</P>
      <P>2. Conecta tu caja con el código de activación que te da el portal.</P>
      <P>3. Registra tu primera venta. Desde ahí, tus números se arman solos.</P>
      <Cta href={p.comoEmpiezoUrl}>Ver «¿Cómo empiezo?»</Cta>
      <Small>Si algo no queda claro, escríbenos desde Ayuda en el portal.</Small>
    </Layout>
  );
}

export function renderWelcomeEmail(p: WelcomeEmailProps): Promise<EmailContent> {
  return renderEmail(`${p.nombreNegocio} ya está en Xangarro`, <WelcomeEmail {...p} />);
}
