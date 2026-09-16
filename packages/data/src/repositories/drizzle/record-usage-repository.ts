/**
 * Drizzle-backed {@link RecordUsageRepository}: three COUNTs over the
 * capture tables, filtered by the month prefix of `fecha`.
 */

import { sql } from 'drizzle-orm';
import type { BusinessId } from '@xangarro/domain';
import type { RecordUsageRepository } from '../record-usage-repository.js';
import type { CachinkDatabase } from './_db.js';

export class DrizzleRecordUsageRepository implements RecordUsageRepository {
  readonly #db: CachinkDatabase;

  constructor(db: CachinkDatabase) {
    this.#db = db;
  }

  async countRecordsInMonth(businessId: BusinessId, yearMonth: string): Promise<number> {
    const prefix = `${yearMonth}-%`;
    const row = await this.#db.get<{ n: number }>(sql`SELECT
      (SELECT COUNT(*) FROM sales WHERE business_id = ${businessId} AND fecha LIKE ${prefix})
      + (SELECT COUNT(*) FROM expenses WHERE business_id = ${businessId} AND fecha LIKE ${prefix})
      + (SELECT COUNT(*) FROM inventory_movements WHERE business_id = ${businessId}
          AND fecha LIKE ${prefix} AND tipo = 'salida' AND motivo <> 'Venta') AS n`);
    return row?.n ?? 0;
  }
}
