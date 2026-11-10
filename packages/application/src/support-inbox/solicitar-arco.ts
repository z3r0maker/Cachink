/**
 * SolicitarArcoUseCase — a titular's ARCO request (N-34, LFPDPPP arts. 21–34).
 *
 * The request is validated, gets a folio, and is filed in the admin inbox as
 * `kind = 'arco'` with its legal clock: `dueAt` is the end of the 20th día
 * hábil after it was received, in Mexico City. The titular is told the folio
 * and the date; staff see both in the inbox and in every daily digest until
 * the item is resolved. The titular also gets the acuse by email (Reglamento
 * art. 95): folio, the moment received, the right and the deadline.
 *
 * It works without an account (the public form) and with one (the portal,
 * which passes the member's business so staff have context).
 */

import {
  finDelDiaCdmx,
  plazosArco,
  SolicitudArcoSchema,
  type DerechoArco,
  type IsoDate,
  type PlazosArco,
  type SolicitudArco,
} from '@xangarro/domain';

import type { SupportInbox } from './support-inbox.js';

/** What the acuse email says, sent to the address the titular gave. */
export interface AcuseArco {
  readonly folio: string;
  readonly nombre: string;
  readonly correo: string;
  readonly derecho: DerechoArco;
  /** ISO-8601: the moment the request was received. */
  readonly recibidaEn: string;
  /** Last day to answer, in Mexico City. */
  readonly responderA: IsoDate;
}

export interface SolicitarArcoDeps {
  readonly inbox: SupportInbox;
  readonly now: () => Date;
  /** A unique folio for the request, e.g. a ULID. */
  readonly newFolio: () => string;
  /** Sends the acuse; the adapter reports its own failures. */
  readonly acuse: (acuse: AcuseArco) => Promise<void>;
}

export interface SolicitarArcoInput {
  readonly solicitud: unknown;
  /** The member's business, when filed from a portal session. */
  readonly businessId: string | null;
}

export type SolicitarArcoResult =
  | { readonly ok: true; readonly folio: string; readonly plazos: PlazosArco }
  | { readonly ok: false; readonly code: 'ARCO_INVALID'; readonly field: string };

export const DERECHO_LABEL: Readonly<Record<DerechoArco, string>> = {
  acceso: 'Acceso',
  rectificacion: 'Rectificación',
  cancelacion: 'Cancelación',
  oposicion: 'Oposición',
  revocacion: 'Revocación del consentimiento',
};

function body(s: SolicitudArco, folio: string, plazos: PlazosArco): string {
  return [
    `Folio: ${folio}`,
    `Titular: ${s.nombre} <${s.correo}>`,
    `Derecho: ${DERECHO_LABEL[s.derecho]}`,
    `Recibida: ${plazos.recibida} · responder a más tardar el ${plazos.responderA} (20 días hábiles);`,
    `si procede, ejecutar dentro de los 15 días hábiles siguientes a la respuesta.`,
    'Antes de actuar: acreditar la identidad del titular (art. 28).',
    '',
    s.descripcion,
  ].join('\n');
}

export class SolicitarArcoUseCase {
  readonly #deps: SolicitarArcoDeps;

  constructor(deps: SolicitarArcoDeps) {
    this.#deps = deps;
  }

  async execute(input: SolicitarArcoInput): Promise<SolicitarArcoResult> {
    const parsed = SolicitudArcoSchema.safeParse(input.solicitud);
    if (!parsed.success) {
      const field = String(parsed.error.issues[0]?.path[0] ?? 'solicitud');
      return { ok: false, code: 'ARCO_INVALID', field };
    }
    const solicitud = parsed.data;
    const folio = this.#deps.newFolio();
    const recibidaEn = this.#deps.now();
    const plazos = plazosArco(recibidaEn);
    await this.#deps.inbox.file({
      kind: 'arco',
      urgent: false,
      businessId: input.businessId,
      title: `ARCO · ${DERECHO_LABEL[solicitud.derecho]} · responder antes del ${plazos.responderA}`,
      body: body(solicitud, folio, plazos),
      source: 'portal-arco',
      sourceRef: folio,
      paymentRef: null,
      dueAt: finDelDiaCdmx(plazos.responderA),
    });
    await this.#sendAcuse({
      folio,
      nombre: solicitud.nombre,
      correo: solicitud.correo,
      derecho: solicitud.derecho,
      recibidaEn: recibidaEn.toISOString(),
      responderA: plazos.responderA,
    });
    return { ok: true, folio, plazos };
  }

  /**
   * The request is filed and its clock runs whether or not the email lands:
   * failing here would make the titular send it twice. The screen shows the
   * same folio and date, and the adapter reports the failure.
   */
  async #sendAcuse(acuse: AcuseArco): Promise<void> {
    try {
      await this.#deps.acuse(acuse);
    } catch {
      // Reported by the adapter; the screen already carries the acuse.
    }
  }
}
