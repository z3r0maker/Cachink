import 'server-only';

import type { ExpensesRepository, InventoryMovementsRepository } from '@xangarro/data';
import { expenses, inventoryMovements, logChange } from '@xangarro/data-pg';
import {
  newUlid,
  type Expense,
  type InventoryMovement,
  type NewExpense,
  type NewInventoryMovement,
} from '@xangarro/domain';

import type { Tx } from '../db';
import { PORTAL_DEVICE_ID } from './portal-device';

/**
 * The two writes `RegistrarMovimientoInventarioUseCase` makes, over Postgres
 * (ADR-081). Only `create` — the use case needs nothing else.
 *
 * - A **movement** is HYBRID: logged, so every phone pulls it and its stock
 *   agrees with the portal's.
 * - An **expense** is UP and stays in the cloud: phones capture expenses, the
 *   portal reports them. Nothing to log.
 */
function stamps(businessId: string) {
  const now = new Date().toISOString();
  return {
    id: newUlid(),
    businessId,
    deviceId: PORTAL_DEVICE_ID,
    createdByUserId: null,
    createdAt: now,
    updatedAt: now,
    deletedAt: null,
  };
}

export function pgMovementsCreator(
  tx: Tx,
  businessId: string,
): Pick<InventoryMovementsRepository, 'create'> {
  return {
    async create(input: NewInventoryMovement): Promise<InventoryMovement> {
      const row = { ...input, nota: input.nota ?? null, ...stamps(businessId) };
      await tx.insert(inventoryMovements).values(row);
      await logChange(tx, businessId, 'inventory_movements', row.id, 'insert');
      return row as unknown as InventoryMovement;
    },
  };
}

export function pgExpensesCreator(tx: Tx, businessId: string): Pick<ExpensesRepository, 'create'> {
  return {
    async create(input: NewExpense): Promise<Expense> {
      const row = { ...input, ...stamps(businessId) };
      await tx.insert(expenses).values(row);
      return row as unknown as Expense;
    },
  };
}
