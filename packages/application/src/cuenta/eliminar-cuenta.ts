/**
 * `EliminarCuentaUseCase` — «Eliminar mi cuenta» (ADR-136).
 *
 * The password, once; then nothing renews any more, every business the
 * account owns closes, every session and caja is cut, and the erase is set
 * 30 days out. The confirmation email carries the folio and the undo link. A
 * Stripe failure changes nothing; a ledger failure after Stripe resumes what
 * it stopped, so the account is never left half-deleted.
 */
import { CuentaError } from './errors.js';
import { DIAS_PARA_BORRAR } from './plazos.js';
import type { AccountDeletionStore, AccountDirectory, DeletionNotices } from './ports.js';
import { detenerRenovaciones, reanudarRenovaciones, type Billing } from './renovaciones.js';

export interface EliminarCuentaInput {
  readonly userId: string;
  readonly email: string;
  readonly password: string;
}

export interface EliminarCuentaResult {
  readonly folio: string;
  readonly eraseAt: string;
  readonly negocios: readonly string[];
}

export interface EliminarCuentaDeps {
  readonly store: AccountDeletionStore;
  readonly accounts: AccountDirectory;
  readonly billing: Billing;
  readonly notices: DeletionNotices;
  readonly report: (error: unknown) => void;
  readonly now: () => Date;
}

export class EliminarCuentaUseCase {
  readonly #d: EliminarCuentaDeps;
  constructor(deps: EliminarCuentaDeps) {
    this.#d = deps;
  }

  async execute(input: EliminarCuentaInput): Promise<EliminarCuentaResult> {
    const { store, accounts, billing } = this.#d;
    if (!(await accounts.passwordMatches(input.email, input.password))) {
      throw new CuentaError('WRONG_PASSWORD');
    }
    const owned = await accounts.ownedBusinesses(input.userId);
    if (owned.length === 0) throw new CuentaError('NO_BUSINESS');

    const stopped = await detenerRenovaciones(
      billing,
      owned.map((b) => b.id),
    );
    const requested = await store
      .request({
        userId: input.userId,
        email: input.email,
        stoppedRenewals: stopped,
        days: DIAS_PARA_BORRAR,
      })
      .catch(async (error: unknown) => {
        await reanudarRenovaciones(billing, stopped).catch(this.#d.report);
        throw error;
      });
    const negocios = owned.map((b) => b.nombre);
    await this.#d.notices
      .requested({
        email: input.email,
        folio: requested.folio,
        negocios,
        eraseAt: requested.eraseAt,
        requestedAt: this.#d.now().toISOString(),
        undoToken: requested.undoToken,
      })
      .catch(this.#d.report);
    return { folio: requested.folio, eraseAt: requested.eraseAt, negocios };
  }
}
