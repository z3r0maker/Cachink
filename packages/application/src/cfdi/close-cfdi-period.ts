/**
 * CloseCfdiPeriodUseCase — the monthly global-CFDI close as the cron runs it
 * (N-33), behind `CFDI_MODE`.
 *
 * - `off`: nothing is stamped; every payment of the period still owed a CFDI
 *   is listed in ONE inbox item (idempotent per period), so staff can issue
 *   the global "público en general" CFDI in the SAT portal.
 * - `test` / `live`: `CloseMonthlyGlobalCfdiUseCase` stamps it; a failure
 *   files one urgent item instead of throwing (the cron is not retried by
 *   anyone else — the item is the retry).
 *
 * The period defaults to the fiscal month that just ended and must be closed.
 */

import type { UseCase } from '../_use-case.js';
import type { SupportInbox } from '../support-inbox/index.js';
import { closeFailureItem, periodItem } from './cfdi-inbox-items.js';
import type { CfdiMode } from './cfdi-mode.js';
import type { CloseMonthlyGlobalCfdiUseCase } from './close-monthly-global-cfdi.js';
import { CfdiError } from './errors.js';
import type { IssuedCfdiRepository } from './issued-cfdi-repository.js';
import { parseFiscalPeriod, previousFiscalPeriodOf } from './period.js';

export interface CloseCfdiPeriodDeps {
  readonly mode: CfdiMode;
  readonly repo: IssuedCfdiRepository;
  readonly inbox: SupportInbox;
  /** Required for `test` and `live`. */
  readonly close: CloseMonthlyGlobalCfdiUseCase | null;
  readonly now: () => Date;
}

export interface CloseCfdiPeriodResult {
  readonly period: string;
  readonly outcome: 'listed' | 'nothing_pending' | 'stamped' | 'failed';
  /** `listed` only: how many payments the item lists. */
  readonly payments?: number;
}

export class CloseCfdiPeriodUseCase implements UseCase<
  { readonly period?: string },
  CloseCfdiPeriodResult
> {
  readonly #deps: CloseCfdiPeriodDeps;

  constructor(deps: CloseCfdiPeriodDeps) {
    if (deps.mode !== 'off' && deps.close === null) {
      throw new CfdiError('CFDI_PROVIDER_CONFIG', `CFDI_MODE=${deps.mode} necesita un PAC`);
    }
    this.#deps = deps;
  }

  async execute(input: { readonly period?: string }): Promise<CloseCfdiPeriodResult> {
    const now = this.#deps.now();
    const period = parseFiscalPeriod(input.period ?? previousFiscalPeriodOf(now));
    if (now.getTime() < period.endsAt.getTime()) {
      throw new CfdiError('CFDI_PERIOD_NOT_CLOSED', `El periodo ${period.period} aún no termina`);
    }
    return this.#deps.mode === 'off' ? this.#list(period.period) : this.#stamp(period.period);
  }

  async #list(period: string): Promise<CloseCfdiPeriodResult> {
    const records = await this.#deps.repo.listUninvoiced(period);
    if (records.length === 0) return { period, outcome: 'nothing_pending' };
    await this.#deps.inbox.file(periodItem(period, records));
    return { period, outcome: 'listed', payments: records.length };
  }

  async #stamp(period: string): Promise<CloseCfdiPeriodResult> {
    try {
      const result = await (this.#deps.close as CloseMonthlyGlobalCfdiUseCase).execute({ period });
      return { period, outcome: result.outcome };
    } catch (error) {
      await this.#deps.inbox.file(closeFailureItem(period, error));
      return { period, outcome: 'failed' };
    }
  }
}
