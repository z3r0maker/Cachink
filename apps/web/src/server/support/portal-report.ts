import 'server-only';

import type { InboxItemRequest, SupportInbox } from '@xangarro/application/support-inbox';

import { pantallaPorHref, type Pantalla } from '@/shell/pantallas';

/**
 * «Algo no funciona» in the portal's Ayuda, filed into the staff inbox (P-48,
 * ADR-162 §8). The portal's counterpart of the phone's report
 * (`./bug-report.ts`), and like it a `bug` item that carries no stack trace
 * and no screenshot.
 *
 * - **Who** is the session's: the account and its business are the caller's,
 *   never the form's.
 * - **The screen is one of the portal's own names** (`shell/pantallas.ts`).
 *   The browser sends an address; anything that is not a screen's address is
 *   no screen, so nothing the browser typed is filed as a name.
 * - **The browser and the last error are the server's to read**: the request's
 *   own user agent, cut to a line, and the event the session was last shown
 *   (`observability/last-error.ts`), which travels as the item's `eventId` so
 *   the console shows the report beside its error.
 * - **A screen or a sentence is enough**: two taps and no typing file a
 *   report. With neither there is nothing to act on, and it is refused.
 *
 * Filing is idempotent on the console's side by `(source, sourceRef)`: the
 * form mints one attempt id when it opens, so a retry after a failed send, or
 * a double click, files nothing new.
 */
export interface PortalReportCaller {
  /** `auth.users.id`. */
  readonly userId: string;
  readonly businessId: string;
  /** Where the form promises the answer goes. */
  readonly email: string;
}

export interface PortalReportForm {
  /** The address of the screen it happened on (`Pantalla.href`), or null. */
  readonly pantalla: string | null;
  /** «¿Qué pasó?», optional. */
  readonly mensaje: string;
  readonly urgente: boolean;
  /** The form's attempt id, a UUID minted in the browser: the idempotency key. */
  readonly intento: string;
}

export interface PortalReportContext {
  /** The request's `user-agent`, as sent; null when there was none. */
  readonly navegador: string | null;
  /** The session's last error, when it saw one. */
  readonly ultimoError: { readonly eventId: string; readonly at: string } | null;
  /** Now, an ISO instant. */
  readonly enviado: string;
}

export type PortalReportOutcome =
  { readonly kind: 'accepted' } | { readonly kind: 'invalid'; readonly message: string };

export const PORTAL_REPORT_MESSAGE_MAX = 4000;
/** A user agent is a line of context, not a document: longer ones are cut. */
const BROWSER_MAX = 300;
const ATTEMPT = /^[0-9a-f]{8}(-[0-9a-f]{4}){3}-[0-9a-f]{12}$/i;

const invalid = (message: string): PortalReportOutcome => ({ kind: 'invalid', message });

/** The item's body: what was said, where, from what, by whom, and when. */
function bodyOf(
  caller: PortalReportCaller,
  mensaje: string,
  pantalla: Pantalla | null,
  context: PortalReportContext,
): string {
  const navegador = context.navegador?.replace(/\s+/g, ' ').trim().slice(0, BROWSER_MAX) ?? '';
  const { ultimoError } = context;
  return [
    mensaje,
    pantalla === null ? 'Pantalla: no la indicó' : `Pantalla: ${pantalla.label} (${pantalla.href})`,
    `Navegador: ${navegador === '' ? 'desconocido' : navegador}`,
    `Cuenta: ${caller.email}`,
    ultimoError === null ? '' : `Último error de la sesión: ${ultimoError.at}`,
    `Enviado: ${context.enviado}`,
  ]
    .filter((line) => line !== '')
    .join('\n');
}

/**
 * Validate, then file. An inbox that throws is the caller's to report and to
 * say: nothing was filed, and the same attempt may be sent again.
 */
export async function filePortalReport(
  caller: PortalReportCaller,
  form: PortalReportForm,
  context: PortalReportContext,
  inbox: SupportInbox,
): Promise<PortalReportOutcome> {
  const mensaje = form.mensaje.trim();
  const pantalla = form.pantalla === null ? null : pantallaPorHref(form.pantalla);
  if (!ATTEMPT.test(form.intento)) {
    return invalid('No pudimos enviar tu reporte. Recarga la página e intenta de nuevo.');
  }
  if (mensaje.length > PORTAL_REPORT_MESSAGE_MAX) {
    return invalid('Cuéntanos qué pasó en hasta 4000 caracteres.');
  }
  if (pantalla === null && mensaje === '') {
    return invalid('Dinos en qué pantalla fue o cuéntanos qué pasó.');
  }
  const item: InboxItemRequest = {
    kind: 'bug',
    urgent: form.urgente,
    businessId: caller.businessId,
    title:
      pantalla === null ? 'Algo no funciona en el portal' : `Algo no funciona: ${pantalla.label}`,
    body: bodyOf(caller, mensaje, pantalla, context),
    source: 'portal-ayuda',
    sourceRef: `falla:${caller.userId}:${form.intento.toLowerCase()}`,
    paymentRef: null,
    ...(context.ultimoError === null ? {} : { eventId: context.ultimoError.eventId }),
  };
  await inbox.file(item);
  return { kind: 'accepted' };
}
