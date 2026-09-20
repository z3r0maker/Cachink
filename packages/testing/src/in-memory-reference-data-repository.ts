/**
 * In-memory ReferenceDataRepository — records every apply so tests can
 * assert what the activation/pull flow handed to the database layer.
 */

import type { ReferenceTables } from '@xangarro/contracts';
import type { ApplyReferenceResult, ReferenceDataRepository } from '@xangarro/sync';

export class InMemoryReferenceDataRepository implements ReferenceDataRepository {
  readonly applied: { tables: ReferenceTables; businessId: string }[] = [];

  async apply(tables: ReferenceTables, businessId: string): Promise<ApplyReferenceResult> {
    this.applied.push({ tables, businessId });
    const count = (rows: readonly unknown[]): number => rows.length;
    return {
      applied: {
        businesses: count(tables.businesses),
        products: count(tables.products),
        clients: count(tables.clients),
        users: count(tables.users),
        employees: count(tables.employees),
        inventory_movements: count(tables.inventory_movements),
        mensajes_operador: count(tables.mensajes_operador),
        recurring_expenses: count(tables.recurring_expenses),
        conversion_recetas: count(tables.conversion_recetas),
      },
    };
  }
}
