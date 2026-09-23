import {
  CfdiError,
  UNINVOICED_STATUSES,
  type CfdiReceptor,
  type CfdiCancellationState,
  type CreditNoteRef,
  type FiscalIssue,
  type FormaPago,
  type GlobalCfdiRecord,
  type IssuedCfdiRecord,
  type IssuedCfdiRepository,
} from '@xangarro/application/cfdi';
import {
  cfdiGlobalsOfPeriod,
  cfdiPaymentOf,
  cfdiPaymentsOfPeriod,
  claimCfdiPayment,
  saveCfdiGlobal,
  updateCfdiPayment,
  type CfdiGlobalRow,
  type CfdiPaymentRow,
  type Db,
} from '@xangarro/data-pg';

/**
 * `IssuedCfdiRepository` over `cfdi_payments` / `cfdi_globals` (N-33), on the
 * `xangarro_billing` connection — the only role granted them. Rows and
 * records differ only in shape: dates as ISO strings, the two CFDI documents
 * as flat columns, JSON for the snapshots.
 */

const ref = (providerId: string | null, uuid: string | null) =>
  providerId !== null && uuid !== null ? { providerId, uuid } : undefined;

export function toRow(r: IssuedCfdiRecord): CfdiPaymentRow {
  return {
    externalPaymentId: r.externalPaymentId,
    businessId: r.tenantId,
    route: r.route,
    status: r.status,
    totalCentavos: r.totalCentavos,
    paidAt: r.paidAt.toISOString(),
    period: r.period,
    formaPago: r.formaPago,
    description: r.description,
    ...documentColumns(r),
  };
}

const refColumns = (doc: { providerId: string; uuid: string } | undefined) =>
  [doc?.providerId ?? null, doc?.uuid ?? null] as const;

/** The optional half of a record: snapshots and the CFDI documents, as nullable columns. */
function documentColumns(r: IssuedCfdiRecord) {
  const [invoiceProviderId, invoiceUuid] = refColumns(r.invoice);
  const [complementProviderId, complementUuid] = refColumns(r.complement);
  return {
    receptor: r.receptor ?? null,
    globalReasons: r.globalReasons ?? null,
    invoiceProviderId,
    invoiceUuid,
    complementProviderId,
    complementUuid,
    globalId: r.globalId ?? null,
    cancellation: r.cancellation ?? null,
    creditNotes: r.creditNotes ? r.creditNotes.map(noteToJson) : null,
  };
}

/** JSON has no bigint: the amount is stored as a decimal string of centavos. */
function noteToJson(n: CreditNoteRef) {
  return { ...n, totalCentavos: n.totalCentavos.toString() };
}

function notesFromJson(value: unknown): CreditNoteRef[] {
  const notes = value as (Omit<CreditNoteRef, 'totalCentavos'> & { totalCentavos: string })[];
  return notes.map((n) => ({ ...n, totalCentavos: BigInt(n.totalCentavos) }));
}

export function fromRow(row: CfdiPaymentRow): IssuedCfdiRecord {
  const invoice = ref(row.invoiceProviderId, row.invoiceUuid);
  const complement = ref(row.complementProviderId, row.complementUuid);
  return {
    externalPaymentId: row.externalPaymentId,
    tenantId: row.businessId,
    route: row.route,
    status: row.status,
    totalCentavos: row.totalCentavos,
    paidAt: new Date(row.paidAt),
    period: row.period,
    formaPago: row.formaPago as FormaPago,
    description: row.description,
    ...(row.receptor ? { receptor: row.receptor as CfdiReceptor } : {}),
    ...(row.globalReasons ? { globalReasons: row.globalReasons as FiscalIssue[] } : {}),
    ...(invoice ? { invoice } : {}),
    ...(complement ? { complement } : {}),
    ...(row.globalId ? { globalId: row.globalId } : {}),
    ...(row.cancellation ? { cancellation: row.cancellation as CfdiCancellationState } : {}),
    ...(row.creditNotes ? { creditNotes: notesFromJson(row.creditNotes) } : {}),
  };
}

export function globalToRow(g: GlobalCfdiRecord): CfdiGlobalRow {
  return {
    id: g.id,
    period: g.period,
    sequence: g.sequence,
    paymentIds: [...g.paymentIds],
    status: g.status,
    invoiceProviderId: g.invoice?.providerId ?? null,
    invoiceUuid: g.invoice?.uuid ?? null,
  };
}

export function globalFromRow(row: CfdiGlobalRow): GlobalCfdiRecord {
  const invoice = ref(row.invoiceProviderId, row.invoiceUuid);
  return {
    id: row.id,
    period: row.period,
    sequence: row.sequence,
    paymentIds: row.paymentIds as string[],
    status: row.status,
    ...(invoice ? { invoice } : {}),
  };
}

export function pgIssuedCfdiRepository(db: Db): IssuedCfdiRepository {
  return {
    findByPaymentId: async (id) => {
      const row = await cfdiPaymentOf(db, id);
      return row ? fromRow(row) : null;
    },
    claim: (record) => claimCfdiPayment(db, toRow(record)),
    update: async (record) => {
      if (!(await updateCfdiPayment(db, toRow(record)))) {
        throw new CfdiError(
          'CFDI_RECORD_NOT_FOUND',
          `Sin registro para ${record.externalPaymentId}`,
        );
      }
    },
    listPendingGlobal: async (period) =>
      (await cfdiPaymentsOfPeriod(db, period, ['pending_global'])).map(fromRow),
    listUninvoiced: async (period) =>
      (await cfdiPaymentsOfPeriod(db, period, UNINVOICED_STATUSES)).map(fromRow),
    listGlobals: async (period) => (await cfdiGlobalsOfPeriod(db, period)).map(globalFromRow),
    saveGlobal: (record) => saveCfdiGlobal(db, globalToRow(record)),
  };
}
