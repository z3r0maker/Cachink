import type { JournalLine, Movement } from '@xangarro/domain/corp';

/**
 * The ledger's storage port (E-02, ADR-124 §4). `@xangarro/data-corp`
 * implements it over the corp schema; tests fake it in memory.
 */
export type EntrySource = 'manual' | 'billing' | 'statement' | 'recurring' | 'agent';

export interface NewLedgerEntry {
  readonly fecha: string;
  readonly projectId: string | null;
  readonly kind: Movement['kind'];
  readonly concepto: string;
  readonly contraparte: string | null;
  readonly moneda: 'MXN' | 'USD';
  /** USD centavos when `moneda` is USD. */
  readonly montoOriginal: bigint | null;
  readonly tipoCambio: string | null;
  readonly deducible: boolean | null;
  readonly source: EntrySource;
  readonly sourceRef: string | null;
  readonly reversesEntryId: string | null;
  /** The movement as captured (audit trail, detail drawer). */
  readonly payload: Movement | { readonly reversal: true; readonly motivo: string };
  readonly createdBy: string;
}

export interface LedgerEntry extends NewLedgerEntry {
  readonly id: string;
  readonly lines: readonly JournalLine[];
}

export interface CorpLedgerRepository {
  projectExists(id: string): Promise<boolean>;
  closedPeriods(): Promise<ReadonlySet<string>>;
  findBySource(source: EntrySource, sourceRef: string): Promise<LedgerEntry | null>;
  findById(id: string): Promise<LedgerEntry | null>;
  isReversed(id: string): Promise<boolean>;
  /**
   * Every entry with a partner line (E-03), oldest first; with a range, only
   * those dated in `[desde, hasta)`.
   */
  listPartnerEntries(range?: {
    readonly desde: string;
    readonly hasta: string;
  }): Promise<readonly LedgerEntry[]>;
  /** Writes the entry and its lines in one transaction. */
  insert(entry: NewLedgerEntry, lines: readonly JournalLine[]): Promise<LedgerEntry>;
}

/** A call for equal funding (E-03, agreement Quinta): each partner pays `porSocio`. */
export interface NewFundingCall {
  readonly concepto: string;
  /** Centavos. */
  readonly total: bigint;
  /** Centavos; half the total, an odd centavo rounded up. */
  readonly porSocio: bigint;
  /** `YYYY-MM-DD`: ten business days after approval, per the agreement. */
  readonly vence: string;
  readonly createdBy: string;
}

export interface FundingCall extends NewFundingCall {
  readonly id: string;
}

export interface FundingCallRepository {
  insert(call: NewFundingCall): Promise<FundingCall>;
  findById(id: string): Promise<FundingCall | null>;
}
