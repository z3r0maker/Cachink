/**
 * CloseMonthlyGlobalCfdiUseCase — stamps the "público en general" global CFDI
 * for a month's payments that had no usable fiscal data.
 *
 * Meant to run from a cron on the 1st (CDMX): the SAT expects the global CFDI
 * within 24 h after the period ends (confirm with contador). Safe to re-run:
 *
 * - The set of payments is frozen into a `stamping` draft before calling the
 *   PAC, so a retry stamps exactly the same set with the same idempotency key.
 * - With nothing pending, it stamps nothing.
 * - Payments that arrive after a month was closed (late webhooks) get a
 *   second global CFDI for that month (`#2`).
 */

import type { UseCase } from '../_use-case.js';
import { CfdiError } from './errors.js';
import type {
  GlobalCfdiRecord,
  IssuedCfdiRecord,
  IssuedCfdiRepository,
} from './issued-cfdi-repository.js';
import type { PacProvider } from './pac-provider.js';
import { buildGlobalRequest } from './payload-builder.js';
import { parseFiscalPeriod, type FiscalPeriod } from './period.js';
import type { CfdiIssuerConfig } from './types.js';

export interface CloseMonthlyGlobalCfdiInput {
  /** "YYYY-MM". */
  readonly period: string;
}

export interface CloseMonthlyGlobalCfdiResult {
  readonly outcome: 'stamped' | 'nothing_pending';
  readonly global: GlobalCfdiRecord | null;
}

export class CloseMonthlyGlobalCfdiUseCase implements UseCase<
  CloseMonthlyGlobalCfdiInput,
  CloseMonthlyGlobalCfdiResult
> {
  readonly #repo: IssuedCfdiRepository;
  readonly #pac: PacProvider;
  readonly #issuer: CfdiIssuerConfig;
  readonly #now: () => Date;

  constructor(
    repo: IssuedCfdiRepository,
    pac: PacProvider,
    issuer: CfdiIssuerConfig,
    now: () => Date = () => new Date(),
  ) {
    this.#repo = repo;
    this.#pac = pac;
    this.#issuer = issuer;
    this.#now = now;
  }

  async execute(input: CloseMonthlyGlobalCfdiInput): Promise<CloseMonthlyGlobalCfdiResult> {
    const period = parseFiscalPeriod(input.period);
    if (this.#now().getTime() < period.endsAt.getTime()) {
      throw new CfdiError(
        'CFDI_PERIOD_NOT_CLOSED',
        `El periodo ${period.period} aún no termina (hora del centro de México)`,
      );
    }
    const draft = await this.#openDraft(period.period);
    if (!draft) return { outcome: 'nothing_pending', global: null };
    return { outcome: 'stamped', global: await this.#stamp(draft, period) };
  }

  /** The unfinished draft, or a new one over the pending payments, or null. */
  async #openDraft(period: string): Promise<GlobalCfdiRecord | null> {
    const globals = await this.#repo.listGlobals(period);
    const unfinished = globals.find((g) => g.status === 'stamping');
    if (unfinished) return unfinished;
    const pending = await this.#repo.listPendingGlobal(period);
    if (pending.length === 0) return null;
    const sequence = globals.length + 1;
    const draft: GlobalCfdiRecord = {
      id: `${period}#${sequence}`,
      period,
      sequence,
      paymentIds: pending.map((r) => r.externalPaymentId),
      status: 'stamping',
    };
    await this.#repo.saveGlobal(draft);
    return draft;
  }

  async #stamp(draft: GlobalCfdiRecord, period: FiscalPeriod): Promise<GlobalCfdiRecord> {
    const records = await this.#load(draft.paymentIds);
    const request = buildGlobalRequest(draft.id, records, period, this.#issuer);
    const stamped = await this.#pac.stampGlobalInvoice(request);
    const global: GlobalCfdiRecord = {
      ...draft,
      status: 'stamped',
      invoice: { providerId: stamped.providerId, uuid: stamped.uuid },
    };
    await this.#repo.saveGlobal(global);
    for (const record of records) {
      await this.#repo.update({ ...record, status: 'in_global', globalId: global.id });
    }
    return global;
  }

  async #load(ids: readonly string[]): Promise<IssuedCfdiRecord[]> {
    const records: IssuedCfdiRecord[] = [];
    for (const id of ids) {
      const record = await this.#repo.findByPaymentId(id);
      if (!record) throw new CfdiError('CFDI_RECORD_NOT_FOUND', `Sin registro para ${id}`);
      records.push(record);
    }
    return records;
  }
}
