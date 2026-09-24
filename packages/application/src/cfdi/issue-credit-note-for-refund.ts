/**
 * IssueCreditNoteForRefundUseCase — the CFDI de egreso (nota de crédito) a
 * refund needs when cancelling is not the answer (N-33):
 *
 * - a **partial** refund of a payment with its own CFDI, related to that CFDI;
 * - any refund of a payment already inside a **stamped global** CFDI,
 *   issued to «público en general» and related to the global.
 *
 * Stripe reports the charge's cumulative `amount_refunded`, so the note is
 * for what is refunded to date minus what earlier notes already credited: a
 * duplicate webhook credits nothing, a second partial refund credits only
 * its own part. The PAC idempotency key is the payment plus that cumulative
 * amount, so a retry after a crash returns the same stamped note.
 */

import type { Money } from '@xangarro/domain';

import { CfdiError } from './errors.js';
import type {
  CreditNoteRef,
  IssuedCfdiRecord,
  IssuedCfdiRepository,
} from './issued-cfdi-repository.js';
import type { PacProvider } from './pac-provider.js';
import { EGRESO, PUBLICO_EN_GENERAL } from './sat-catalogs.js';
import type { CfdiIssuerConfig, CfdiReceptor } from './types.js';

export interface IssueCreditNoteInput {
  readonly externalPaymentId: string;
  /** Stripe refund id, kept on the note. */
  readonly refundId: string;
  /** Everything refunded on the charge so far, IVA included, in centavos. */
  readonly refundedToDateCentavos: Money;
}

export interface IssueCreditNoteResult {
  readonly outcome: 'credited' | 'already_credited';
  readonly record: IssuedCfdiRecord;
  readonly note?: CreditNoteRef;
}

interface Target {
  readonly receptor: CfdiReceptor;
  readonly relatedUuid: string;
}

function checkedRefund(record: IssuedCfdiRecord, toDate: Money): Money {
  if (typeof toDate !== 'bigint' || toDate <= 0n || toDate > record.totalCentavos) {
    throw new CfdiError(
      'CFDI_INVALID_REFUND',
      `Reembolso inválido: ${String(toDate)} de ${record.totalCentavos} centavos`,
    );
  }
  return toDate;
}

/** Centavos already credited by this payment's notes. */
export function creditedCentavos(record: IssuedCfdiRecord): Money {
  return (record.creditNotes ?? []).reduce((sum, n) => sum + n.totalCentavos, 0n);
}

export class IssueCreditNoteForRefundUseCase {
  readonly #repo: IssuedCfdiRepository;
  readonly #pac: PacProvider;
  readonly #issuer: CfdiIssuerConfig;

  constructor(repo: IssuedCfdiRepository, pac: PacProvider, issuer: CfdiIssuerConfig) {
    this.#repo = repo;
    this.#pac = pac;
    this.#issuer = issuer;
  }

  async execute(input: IssueCreditNoteInput): Promise<IssueCreditNoteResult> {
    const record = await this.#repo.findByPaymentId(input.externalPaymentId);
    if (!record) {
      throw new CfdiError('CFDI_RECORD_NOT_FOUND', `Sin CFDI para ${input.externalPaymentId}`);
    }
    const toDate = checkedRefund(record, input.refundedToDateCentavos);
    const amount = toDate - creditedCentavos(record);
    if (amount <= 0n) return { outcome: 'already_credited', record };

    const target = await this.#target(record);
    const stamped = await this.#pac.stampCreditNote({
      idempotencyKey: `egreso:${record.externalPaymentId}:${toDate}`,
      externalId: input.refundId,
      receptor: target.receptor,
      relatedUuid: target.relatedUuid,
      formaPago: record.formaPago,
      concepto: {
        claveProdServ: EGRESO.claveProdServ,
        claveUnidad: EGRESO.claveUnidad,
        descripcion: `Devolución — ${record.description}`,
        totalCentavos: amount,
      },
    });
    const note: CreditNoteRef = {
      providerId: stamped.providerId,
      uuid: stamped.uuid,
      refundId: input.refundId,
      totalCentavos: amount,
    };
    const updated: IssuedCfdiRecord = {
      ...record,
      creditNotes: [...(record.creditNotes ?? []), note],
    };
    await this.#repo.update(updated);
    return { outcome: 'credited', record: updated, note };
  }

  /** Who the note is for and which CFDI it reduces. */
  async #target(record: IssuedCfdiRecord): Promise<Target> {
    if (record.status === 'stamped' && record.invoice && record.receptor) {
      return {
        receptor: { ...record.receptor, usoCfdi: EGRESO.usoCfdi },
        relatedUuid: record.invoice.uuid,
      };
    }
    if (record.status === 'in_global') {
      const globals = await this.#repo.listGlobals(record.period);
      const global = globals.find((g) => g.id === record.globalId);
      if (global?.invoice) {
        return { receptor: this.#publicoEnGeneral(), relatedUuid: global.invoice.uuid };
      }
      throw new CfdiError(
        'CFDI_RECORD_NOT_FOUND',
        `El CFDI global de ${record.externalPaymentId} no está registrado`,
      );
    }
    throw new CfdiError(
      'CFDI_INVALID_REFUND',
      `El pago ${record.externalPaymentId} (${record.status}) no admite nota de crédito`,
    );
  }

  #publicoEnGeneral(): CfdiReceptor {
    return {
      rfc: PUBLICO_EN_GENERAL.rfc,
      nombre: PUBLICO_EN_GENERAL.nombre,
      regimenFiscal: PUBLICO_EN_GENERAL.regimenFiscal,
      usoCfdi: PUBLICO_EN_GENERAL.usoCfdi,
      codigoPostal: this.#issuer.lugarExpedicion,
    };
  }
}
