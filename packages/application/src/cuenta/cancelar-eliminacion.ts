/**
 * «Cancelar la eliminación» — the confirmation email's link (ADR-136).
 *
 * Opening the link only reads (mail scanners open links); the tap undoes the
 * request: the businesses reopen and the plans it stopped renew again. Cajas
 * stay unlinked: the owner links them again. Spent, past its day or after the
 * erase, the link is vencido.
 */
import type { AccountDeletionStore } from './ports.js';
import { reanudarRenovaciones, type Billing } from './renovaciones.js';

export type CancelarEliminacionView =
  | {
      readonly state: 'deshacer';
      readonly email: string;
      readonly eraseAt: string;
      readonly negocios: readonly string[];
    }
  | { readonly state: 'reabierta' | 'vencido' };

export interface CancelarEliminacionDeps {
  readonly store: AccountDeletionStore;
  readonly billing: Billing;
  /** A plan that could not be resumed is reported: the owner resumes it in Plan y pagos. */
  readonly report: (error: unknown) => void;
}

const VENCIDO = { state: 'vencido' } as const;

export class CancelarEliminacionUseCase {
  readonly #d: CancelarEliminacionDeps;
  constructor(deps: CancelarEliminacionDeps) {
    this.#d = deps;
  }

  async peek(token: string): Promise<CancelarEliminacionView> {
    const view = token === '' ? null : await this.#d.store.peek(token);
    if (view === null || view.estado !== 'pendiente') return VENCIDO;
    return { state: 'deshacer', email: view.email, eraseAt: view.eraseAt, negocios: view.negocios };
  }

  async confirm(token: string): Promise<CancelarEliminacionView> {
    const undone = token === '' ? null : await this.#d.store.undo(token);
    if (undone === null) return VENCIDO;
    await reanudarRenovaciones(this.#d.billing, undone.stoppedRenewals).catch(this.#d.report);
    return { state: 'reabierta' };
  }
}
