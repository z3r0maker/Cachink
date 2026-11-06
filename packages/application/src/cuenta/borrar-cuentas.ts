/**
 * `BorrarCuentasUseCase` — the daily job of account deletion (ADR-136).
 *
 * For every open request: three days before its erase day, the reminder
 * (once); on its erase day, Stripe ends what is still live, the ledger erases
 * the rows and the last email says so, with the date the blocked billing rows
 * erase themselves. One request failing never stops the rest; a failed erase
 * is retried the next day.
 */
import { horizonteDeAvisos } from './plazos.js';
import type { AccountDeletionStore, DeletionNotices, OpenDeletion } from './ports.js';
import { terminarSuscripciones, type Billing } from './renovaciones.js';

export interface BorrarCuentasDeps {
  readonly store: AccountDeletionStore;
  readonly billing: Billing;
  readonly notices: DeletionNotices;
  readonly report: (error: unknown, folio: string) => void;
}

export interface BorrarCuentasOutcome {
  readonly erased: number;
  readonly reminded: number;
  readonly failed: number;
}

type One = keyof BorrarCuentasOutcome | 'skipped';

export class BorrarCuentasUseCase {
  readonly #d: BorrarCuentasDeps;
  constructor(deps: BorrarCuentasDeps) {
    this.#d = deps;
  }

  async execute(now: Date): Promise<BorrarCuentasOutcome> {
    const tally = { erased: 0, reminded: 0, failed: 0, skipped: 0 };
    for (const d of await this.#d.store.open(horizonteDeAvisos(now))) {
      tally[await this.#one(d, now)] += 1;
    }
    return { erased: tally.erased, reminded: tally.reminded, failed: tally.failed };
  }

  async #one(d: OpenDeletion, now: Date): Promise<One> {
    const email = { email: d.email, folio: d.folio, negocios: d.negocios, eraseAt: d.eraseAt };
    try {
      if (Date.parse(d.eraseAt) <= now.getTime()) {
        await terminarSuscripciones(this.#d.billing, d.businessIds);
        const blockedUntil = await this.#d.store.erase(d.folio);
        await this.#d.notices
          .erased({ ...email, blockedUntil })
          .catch((e) => this.#d.report(e, d.folio));
        return 'erased';
      }
      if (d.reminded) return 'skipped';
      const undoToken = await this.#d.store.markReminded(d.folio);
      if (undoToken === null) return 'skipped';
      await this.#d.notices.reminder({ ...email, undoToken });
      return 'reminded';
    } catch (error) {
      this.#d.report(error, d.folio);
      return 'failed';
    }
  }
}
