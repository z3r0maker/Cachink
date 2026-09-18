/**
 * In-memory IssuedCfdiRepository — for tests and local development until the
 * Postgres implementation exists. `claim` is atomic within one JS process.
 */

import { CfdiError } from './errors.js';
import type {
  GlobalCfdiRecord,
  IssuedCfdiRecord,
  IssuedCfdiRepository,
} from './issued-cfdi-repository.js';

export class InMemoryIssuedCfdiRepository implements IssuedCfdiRepository {
  readonly #records = new Map<string, IssuedCfdiRecord>();
  readonly #globals = new Map<string, GlobalCfdiRecord>();

  async findByPaymentId(externalPaymentId: string): Promise<IssuedCfdiRecord | null> {
    return this.#records.get(externalPaymentId) ?? null;
  }

  async claim(record: IssuedCfdiRecord): Promise<boolean> {
    if (this.#records.has(record.externalPaymentId)) return false;
    this.#records.set(record.externalPaymentId, record);
    return true;
  }

  async update(record: IssuedCfdiRecord): Promise<void> {
    if (!this.#records.has(record.externalPaymentId)) {
      throw new CfdiError('CFDI_RECORD_NOT_FOUND', `Sin registro para ${record.externalPaymentId}`);
    }
    this.#records.set(record.externalPaymentId, record);
  }

  async listPendingGlobal(period: string): Promise<IssuedCfdiRecord[]> {
    return [...this.#records.values()]
      .filter((r) => r.period === period && r.status === 'pending_global')
      .sort((a, b) => a.paidAt.getTime() - b.paidAt.getTime());
  }

  async listGlobals(period: string): Promise<GlobalCfdiRecord[]> {
    return [...this.#globals.values()]
      .filter((g) => g.period === period)
      .sort((a, b) => a.sequence - b.sequence);
  }

  async saveGlobal(record: GlobalCfdiRecord): Promise<void> {
    this.#globals.set(record.id, record);
  }
}
