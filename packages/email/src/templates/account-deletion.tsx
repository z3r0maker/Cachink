/**
 * The three emails of account deletion (ADR-136, board ElCorreo): the acuse
 * with the folio and the undo link, the reminder three days before the erase,
 * and the last one, once the rows are gone, with the date the blocked billing
 * rows erase themselves.
 */
import type { EmailContent } from '@xangarro/application/email';

import { fechaLarga, renderEmail } from '../render.js';
import { Cta, Detalles, Layout, P, Small, Titulo } from './layout.js';
import { diaMes } from './renewal-dates.js';

const HORA = new Intl.DateTimeFormat('es-MX', {
  timeZone: 'America/Mexico_City',
  hour: '2-digit',
  minute: '2-digit',
  hour12: false,
});
const RAZON = 'Te llega porque pediste eliminar tu cuenta de Xangarro.';
const BORRA =
  'Ese día borramos tus ventas, gastos, inventario, clientes, empleados, catálogo y tu acceso. Las facturas y pagos de tu suscripción se guardan bloqueados 10 años, porque la ley lo pide, y después se borran solos.';

interface Base {
  readonly negocios: readonly string[];
  readonly folio: string;
  /** ISO-8601: the erase day. */
  readonly eraseAt: string;
}

export interface DeletionRequestedEmailProps extends Base {
  readonly requestedAt: string;
  /** The single-use undo link. */
  readonly undoUrl: string;
}

export type DeletionReminderEmailProps = Base & { readonly undoUrl: string };

export interface DeletionErasedEmailProps extends Base {
  readonly blockedUntil: string;
}

const negociosFila = (n: readonly string[]) => ['Negocios', n.join(', ')] as const;

function Requested(p: DeletionRequestedEmailProps) {
  const fecha = fechaLarga(p.eraseAt);
  return (
    <Layout
      preview={`Folio ${p.folio}. Si cambias de idea, tienes 30 días para cancelarlo.`}
      reason={RAZON}
      legal
    >
      <Titulo>Recibimos tu solicitud para eliminar tu cuenta</Titulo>
      <P>Cerramos tu cuenta y tus negocios hoy. El {fecha} borramos tus datos.</P>
      <Detalles
        filas={[
          negociosFila(p.negocios),
          [
            'Solicitada el',
            `${fechaLarga(p.requestedAt)}, ${HORA.format(new Date(p.requestedAt))}`,
          ],
          ['Se borra el', fecha],
          ['Folio', p.folio],
        ]}
      />
      <P>{BORRA}</P>
      <P>Guarda este correo: es tu comprobante.</P>
      <Cta href={p.undoUrl}>Cancelar la eliminación</Cta>
      <Small>
        ¿Cambiaste de idea? El botón funciona una vez, hasta el {diaMes(p.eraseAt)}. Tus cajas se
        tendrán que vincular otra vez.
      </Small>
    </Layout>
  );
}

function Reminder(p: DeletionReminderEmailProps) {
  return (
    <Layout
      preview={`El ${diaMes(p.eraseAt)} borramos tus datos. Todavía puedes cancelarlo.`}
      reason={RAZON}
      legal
    >
      <Titulo>El {diaMes(p.eraseAt)} borramos tu cuenta</Titulo>
      <P>Faltan 3 días. Después de esa fecha ya no podremos recuperar tus datos.</P>
      <Detalles
        filas={[
          negociosFila(p.negocios),
          ['Se borra el', fechaLarga(p.eraseAt)],
          ['Folio', p.folio],
        ]}
      />
      <P>Si quieres conservar tu cuenta, toca el botón. Todo vuelve como estaba.</P>
      <Cta href={p.undoUrl}>Cancelar la eliminación</Cta>
      <Small>
        Si no haces nada, el {diaMes(p.eraseAt)} borramos tus datos y te avisamos por aquí.
      </Small>
    </Layout>
  );
}

function Erased(p: DeletionErasedEmailProps) {
  const hasta = fechaLarga(p.blockedUntil);
  return (
    <Layout preview={`Borramos tus datos. Folio ${p.folio}.`} reason={RAZON} legal>
      <Titulo>Eliminamos tu cuenta</Titulo>
      <P>El {fechaLarga(p.eraseAt)} borramos tu cuenta y tus negocios, como lo pediste.</P>
      <Detalles
        filas={[
          negociosFila(p.negocios),
          ['Borrada el', fechaLarga(p.eraseAt)],
          ['Folio', p.folio],
          ['Bloqueado hasta', hasta],
        ]}
      />
      <P>
        Las facturas y pagos de tu suscripción quedan bloqueados hasta el {hasta}, como pide la ley,
        y ese día se borran solos. Nadie los usa.
      </P>
      <P>Este es el último correo que te mandamos. Gracias por usar Xangarro.</P>
      <Small>Si quieres volver, puedes crear una cuenta nueva en xangarro.mx.</Small>
    </Layout>
  );
}

export function renderDeletionRequestedEmail(
  p: DeletionRequestedEmailProps,
): Promise<EmailContent> {
  return renderEmail(
    `Tu cuenta de Xangarro se eliminará el ${diaMes(p.eraseAt)}`,
    <Requested {...p} />,
  );
}

export function renderDeletionReminderEmail(p: DeletionReminderEmailProps): Promise<EmailContent> {
  return renderEmail('En 3 días borramos tu cuenta de Xangarro', <Reminder {...p} />);
}

export function renderDeletionErasedEmail(p: DeletionErasedEmailProps): Promise<EmailContent> {
  return renderEmail('Eliminamos tu cuenta de Xangarro', <Erased {...p} />);
}
