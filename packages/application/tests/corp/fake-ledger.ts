import type { JournalLine } from '@xangarro/domain/corp';

import type {
  CorpLedgerRepository,
  FundingCall,
  FundingCallRepository,
  LedgerEntry,
  NewFundingCall,
  NewLedgerEntry,
} from '../../src/corp/index.js';

/** The corp ports in memory (E-02, E-03); the posting rules stay the domain's. */
export class FakeLedger implements CorpLedgerRepository {
  readonly entries: LedgerEntry[] = [];
  readonly projects = new Set(['xangarro']);
  readonly closed = new Set<string>(['2026-08']);

  async projectExists(id: string) {
    return this.projects.has(id);
  }
  async closedPeriods() {
    return this.closed;
  }
  async findBySource(source: string, ref: string) {
    return this.entries.find((e) => e.source === source && e.sourceRef === ref) ?? null;
  }
  async findById(id: string) {
    return this.entries.find((e) => e.id === id) ?? null;
  }
  async isReversed(id: string) {
    return this.entries.some((e) => e.reversesEntryId === id);
  }
  async listPartnerEntries(range?: { readonly desde: string; readonly hasta: string }) {
    return this.entries.filter(
      (e) =>
        e.lines.some((l) => l.socio !== undefined) &&
        (range === undefined || (e.fecha >= range.desde && e.fecha < range.hasta)),
    );
  }
  async insert(entry: NewLedgerEntry, lines: readonly JournalLine[]) {
    const saved: LedgerEntry = { ...entry, id: `e${this.entries.length + 1}`, lines };
    this.entries.push(saved);
    return saved;
  }
}

export class FakeCalls implements FundingCallRepository {
  readonly calls: FundingCall[] = [];

  async insert(call: NewFundingCall) {
    const saved = { ...call, id: `c${this.calls.length + 1}` };
    this.calls.push(saved);
    return saved;
  }
  async findById(id: string) {
    return this.calls.find((c) => c.id === id) ?? null;
  }
}
