/**
 * ReferenceDataRepository — the repository seam for writing cloud reference
 * tables, so UI hooks never touch the database directly (CLAUDE.md §2.5).
 */

import type { Bootstrap, ReferenceTables } from '@xangarro/contracts';
import type { XangarroDatabase } from '@xangarro/data';
import { applyBootstrap } from './page-applier.js';
import { applyReferenceTables, type ApplyReferenceResult } from './reference-applier.js';

export interface ReferenceDataRepository {
  apply(tables: ReferenceTables, businessId: string): Promise<ApplyReferenceResult>;
  /**
   * Activation's first page (C-23): its rows, stock baseline and pull cursor,
   * in one transaction — the next pull continues exactly where it left off.
   */
  applyBootstrap(bootstrap: Bootstrap, businessId: string): Promise<ApplyReferenceResult>;
}

export class DrizzleReferenceDataRepository implements ReferenceDataRepository {
  readonly #db: XangarroDatabase;
  constructor(db: XangarroDatabase) {
    this.#db = db;
  }
  apply(tables: ReferenceTables, businessId: string): Promise<ApplyReferenceResult> {
    return applyReferenceTables(this.#db, tables, businessId);
  }
  applyBootstrap(bootstrap: Bootstrap, businessId: string): Promise<ApplyReferenceResult> {
    return applyBootstrap(this.#db, bootstrap, businessId);
  }
}
