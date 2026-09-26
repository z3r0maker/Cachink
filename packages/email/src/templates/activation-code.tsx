/**
 * The pairing code (P-06, B-14): the eight characters a new phone types to
 * join the business. The email carries the code the portal minted; expiry and
 * single-use logic stay in the portal. Sent to whichever address the owner
 * names — often the operator's own.
 */
import type { EmailContent } from '@xangarro/application/email';

import { renderEmail } from '../render.js';
import { Layout, P, Small } from './layout.js';

export interface ActivationCodeEmailProps {
  readonly code: string;
  /** The business the phone would join. */
  readonly negocio: string;
  /** Hours the code still works, rounded down, at least 1. */
  readonly expiresInHours: number;
}

const REASON = 'Recibes este correo porque el dueño de un negocio pidió conectar una caja.';

function CodeLine({ code }: { readonly code: string }) {
  return (
    <p style={{ margin: '16px 0', fontSize: 32, fontWeight: 700, letterSpacing: '0.35em' }}>
      {code}
    </p>
  );
}

export function ActivationCodeEmail({ code, negocio, expiresInHours }: ActivationCodeEmailProps) {
  return (
    <Layout preview={`El código para conectar una caja a ${negocio}.`} reason={REASON}>
      <P>Hola:</P>
      <P>
        Este es el código para conectar una caja a <strong>{negocio}</strong>. Escríbelo en la
        pantalla «Activar» del teléfono o la computadora donde se va a cobrar.
      </P>
      <CodeLine code={code} />
      <P>
        El código funciona una sola vez y vence en {expiresInHours}{' '}
        {expiresInHours === 1 ? 'hora' : 'horas'}. Si no lo pediste, ignora este correo: sin el
        código, ninguna caja entra a este negocio.
      </P>
      <Small>Cada código conecta una sola caja. Para otra, genera uno nuevo en tu portal.</Small>
    </Layout>
  );
}

export function renderActivationCodeEmail(p: ActivationCodeEmailProps): Promise<EmailContent> {
  return renderEmail(
    `Tu código para conectar una caja a ${p.negocio}`,
    <ActivationCodeEmail {...p} />,
  );
}
