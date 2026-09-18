/**
 * IssuedCfdiRepository — the port that makes CFDI issuance idempotent per
 * external payment id and remembers which payments await the global CFDI.
 *
 * Postgres implementation is future work (packages/data-pg); `claim` maps to
 * an INSERT … ON CONFLICT DO NOTHING on `external_payment_id`.
 */

import type { Money } from '@xangarro/domain';
import type { FiscalIssue } from './fiscal-validation.js';
import type { FormaPago, MotivoCancelacion } from './sat-catalogs.js';
import type { CancellationStatus, CfdiDocumentRef, CfdiReceptor } from './types.js';

/** How a payment is invoiced. */
export type CfdiRoute = 'individual_pue' | 'individual_ppd' | 'global';

/**
 * `claimed`: reserved, stamping not finished (retry resumes it).
 * `stamped`: individual CFDI (and REP, for PPD) done.
 * `pending_global` → `in_global`: waiting for / included in a global CFDI.
 * `excluded_from_global`: refunded before the global CFDI was stamped.
 * `cancel_requested` → `cancelled`: refund cancellation in flight / done.
 */
export type IssuedCfdiStatus =
  | 'claimed'
  | 'stamped'
  | 'pending_global'
  | 'in_global'
  | 'excluded_from_global'
  | 'cancel_requested'
  | 'cancelled';

export interface CfdiCancellationState {
  readonly motivo: MotivoCancelacion;
  readonly invoice?: CancellationStatus;
  readonly complement?: CancellationStatus;
}

export interface IssuedCfdiRecord {
  readonly externalPaymentId: string;
  readonly tenantId: string;
  readonly route: CfdiRoute;
  readonly status: IssuedCfdiStatus;
  /** IVA included, in centavos. */
  readonly totalCentavos: Money;
  readonly paidAt: Date;
  /** "YYYY-MM" in CDMX time. */
  readonly period: string;
  /** Forma de pago the money actually arrived by (03 / 04 / 28). */
  readonly formaPago: FormaPago;
  readonly description: string;
  /** Receptor snapshot used for stamping (individual routes only). */
  readonly receptor?: CfdiReceptor;
  /** Why the payment went to the global CFDI (global route only). */
  readonly globalReasons?: readonly FiscalIssue[];
  readonly invoice?: CfdiDocumentRef;
  readonly complement?: CfdiDocumentRef;
  readonly globalId?: string;
  readonly cancellation?: CfdiCancellationState;
}

export interface GlobalCfdiRecord {
  /** `${period}#${sequence}`. */
  readonly id: string;
  readonly period: string;
  readonly sequence: number;
  /** Fixed when the draft is created, so a retry stamps the same set. */
  readonly paymentIds: readonly string[];
  readonly status: 'stamping' | 'stamped';
  readonly invoice?: CfdiDocumentRef;
}

export interface IssuedCfdiRepository {
  findByPaymentId(externalPaymentId: string): Promise<IssuedCfdiRecord | null>;
  /** Insert if no record exists for the payment id. False if one already did. */
  claim(record: IssuedCfdiRecord): Promise<boolean>;
  /** Replace an existing record (matched by payment id). */
  update(record: IssuedCfdiRecord): Promise<void>;
  /** Records with status `pending_global` in a period, oldest payment first. */
  listPendingGlobal(period: string): Promise<IssuedCfdiRecord[]>;
  /** Global CFDIs of a period, by sequence. */
  listGlobals(period: string): Promise<GlobalCfdiRecord[]>;
  /** Insert or replace a global CFDI record (matched by id). */
  saveGlobal(record: GlobalCfdiRecord): Promise<void>;
}
